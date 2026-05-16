from datetime import datetime, time, timedelta
import json
from urllib.parse import urlencode
from zipfile import BadZipFile, ZipFile
import xml.etree.ElementTree as ET
from io import BytesIO
from xml.sax.saxutils import escape

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Count, Max, Q
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone

from .forms import PostponeForm, QuickTaskForm, TaskForm, TaskImportForm
from .models import SubTask, SubTaskComment, Task, TaskActivity
from .services import log_task_activity, sync_task_subtasks, trigger_due_reminders, upsert_task_reminder


def _task_queryset_for(user):
    public_tasks = Q(is_private=False) & (Q(assigned_to=user) | Q(created_by=user))
    private_tasks = Q(is_private=True, created_by=user)
    return Task.objects.filter(public_tasks | private_tasks).select_related("assigned_to", "created_by")


def _status_counts(user):
    base = _task_queryset_for(user)
    return {
        "new": base.filter(status="new").count(),
        "pending": base.filter(status="pending").count(),
        "remind": base.filter(status="remind").count(),
        "completed": base.filter(status="completed").count(),
        "cancelled": base.filter(status="cancelled").count(),
    }


TASK_STATUS_KEYS = ["new", "pending", "remind", "completed", "cancelled"]
DEFAULT_TASK_STATUSES = ["new", "pending", "remind"]
XLSX_NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
TASK_SORT_FIELDS = {
    "title": "title",
    "status": "status",
    "due": "due_datetime",
    "assigned": "assigned_to__username",
    "created": "created_at",
}


def _quick_task_form(user):
    initial_reminder = timezone.localtime(timezone.now() + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M")
    return QuickTaskForm(
        initial={"assigned_to": user.pk, "reminder_datetime": initial_reminder},
        request_user=user,
    )


def _task_list_filter_state(request):
    default_view = getattr(getattr(request.user, "profile", None), "default_task_view", "cards")
    view_mode = request.GET.get("view", default_view)
    if view_mode not in {"cards", "list"}:
        view_mode = "cards"

    requested_statuses = request.GET.getlist("status")
    selected_statuses = [status for status in requested_statuses if status in TASK_STATUS_KEYS]
    if "all" in requested_statuses:
        selected_statuses = TASK_STATUS_KEYS.copy()
    if not requested_statuses:
        selected_statuses = DEFAULT_TASK_STATUSES.copy()
    selected_status_set = set(selected_statuses)

    assigned_filter = request.GET.get("assigned", "all")
    query = request.GET.get("q", "").strip()
    sort_key = request.GET.get("sort", "created")
    direction = request.GET.get("direction", "desc")
    if sort_key not in TASK_SORT_FIELDS:
        sort_key = "created"
    if direction not in {"asc", "desc"}:
        direction = "desc"

    return {
        "view_mode": view_mode,
        "selected_statuses": selected_statuses,
        "selected_status_set": selected_status_set,
        "all_statuses_selected": selected_status_set == set(TASK_STATUS_KEYS),
        "assigned_filter": assigned_filter,
        "query": query,
        "sort_key": sort_key,
        "direction": direction,
    }


def _filtered_task_queryset(request, user):
    state = _task_list_filter_state(request)
    tasks = _task_queryset_for(user)
    if state["selected_statuses"] and not state["all_statuses_selected"]:
        tasks = tasks.filter(status__in=state["selected_statuses"])
    if state["assigned_filter"] != "all":
        tasks = tasks.filter(assigned_to_id=state["assigned_filter"])
    if state["query"]:
        query = state["query"]
        tasks = tasks.filter(
            Q(title__icontains=query)
            | Q(description__icontains=query)
            | Q(assigned_to__username__icontains=query)
            | Q(assigned_to__first_name__icontains=query)
            | Q(assigned_to__last_name__icontains=query)
        )
    order_field = TASK_SORT_FIELDS[state["sort_key"]]
    if state["direction"] == "desc":
        order_field = f"-{order_field}"
    return tasks.prefetch_related("subtasks", "reminders").order_by(order_field, "-created_at"), state


def _parse_xlsx_datetime(value):
    if value in (None, ""):
        return None
    if isinstance(value, (int, float)) or (isinstance(value, str) and value.replace(".", "", 1).isdigit()):
        excel_epoch = datetime(1899, 12, 30)
        parsed = excel_epoch + timedelta(days=float(value))
        return timezone.make_aware(parsed, timezone.get_current_timezone())

    raw_value = str(value).strip()
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d", "%d.%m.%Y %H:%M", "%d.%m.%Y", "%d/%m/%Y %H:%M", "%d/%m/%Y"):
        try:
            parsed = datetime.strptime(raw_value, fmt)
            if parsed.time() == time.min:
                parsed = parsed.replace(hour=9)
            return timezone.make_aware(parsed, timezone.get_current_timezone())
        except ValueError:
            continue
    return None


def _xlsx_column_values(upload):
    try:
        with ZipFile(upload) as archive:
            shared_strings = []
            if "xl/sharedStrings.xml" in archive.namelist():
                shared_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
                for item in shared_root.findall("main:si", XLSX_NS):
                    parts = [node.text or "" for node in item.findall(".//main:t", XLSX_NS)]
                    shared_strings.append("".join(parts))

            sheet_root = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
    except (BadZipFile, KeyError, ET.ParseError) as exc:
        raise ValueError("Could not read the first worksheet from the .xlsx file.") from exc

    rows = []
    for row in sheet_root.findall(".//main:sheetData/main:row", XLSX_NS):
        values_by_index = {}
        for cell in row.findall("main:c", XLSX_NS):
            cell_ref = cell.attrib.get("r", "")
            column_letters = "".join(char for char in cell_ref if char.isalpha())
            column_index = 0
            for char in column_letters:
                column_index = column_index * 26 + (ord(char.upper()) - ord("A") + 1)
            column_index = max(column_index - 1, len(values_by_index))
            cell_type = cell.attrib.get("t")
            value_node = cell.find("main:v", XLSX_NS)
            inline_node = cell.find("main:is/main:t", XLSX_NS)
            raw_value = value_node.text if value_node is not None else inline_node.text if inline_node is not None else ""
            if cell_type == "s" and raw_value:
                raw_value = shared_strings[int(raw_value)]
            values_by_index[column_index] = (raw_value or "").strip() if isinstance(raw_value, str) else raw_value
        values = [values_by_index.get(index, "") for index in range(max(values_by_index.keys(), default=-1) + 1)]
        if any(value not in ("", None) for value in values):
            rows.append(values)
    return rows


def _find_assigned_user(raw_value, fallback_user):
    if not raw_value:
        return fallback_user
    lookup = str(raw_value).strip()
    user = User.objects.filter(is_active=True).filter(
        Q(username__iexact=lookup)
        | Q(email__iexact=lookup)
        | Q(first_name__iexact=lookup)
        | Q(last_name__iexact=lookup)
    ).first()
    if user:
        return user
    for candidate in User.objects.filter(is_active=True):
        if candidate.get_full_name().strip().lower() == lookup.lower():
            return candidate
    return fallback_user


def _import_tasks_from_xlsx(upload, request_user):
    rows = _xlsx_column_values(upload)
    if not rows:
        raise ValueError("The file is empty.")

    headers = [str(value).strip().lower().replace("_", " ") for value in rows[0]]
    aliases = {
        "title": {"title"},
        "description": {"description", "desc"},
        "due_date": {"due date", "due", "due datetime"},
        "assigned": {"assigned", "assigned to", "assign to"},
    }
    indexes = {}
    for key, names in aliases.items():
        for index, header in enumerate(headers):
            if header in names:
                indexes[key] = index
                break
    if "title" not in indexes:
        raise ValueError("Title column is required.")

    created_count = 0
    skipped_count = 0
    for row in rows[1:]:
        title = row[indexes["title"]].strip() if indexes["title"] < len(row) and row[indexes["title"]] else ""
        if not title:
            skipped_count += 1
            continue
        description = row[indexes["description"]].strip() if indexes.get("description", 9999) < len(row) and row[indexes["description"]] else ""
        due_datetime = _parse_xlsx_datetime(row[indexes["due_date"]]) if indexes.get("due_date", 9999) < len(row) else None
        assigned_to = _find_assigned_user(row[indexes["assigned"]] if indexes.get("assigned", 9999) < len(row) else "", request_user)
        task = Task.objects.create(
            title=title,
            description=description,
            due_datetime=due_datetime,
            assigned_to=assigned_to,
            created_by=request_user,
            updated_by=request_user,
        )
        reminder_datetime = due_datetime or timezone.now() + timedelta(days=1)
        upsert_task_reminder(task, assigned_to, reminder_datetime)
        log_task_activity(task, request_user, "create", f'Task "{task.title}" imported from Excel')
        created_count += 1
    return created_count, skipped_count


def _excel_column_name(index):
    name = ""
    index += 1
    while index:
        index, remainder = divmod(index - 1, 26)
        name = chr(ord("A") + remainder) + name
    return name


def _xlsx_response_from_rows(rows):
    row_xml = []
    for row_index, row in enumerate(rows, start=1):
        cells = []
        for column_index, value in enumerate(row):
            cell_ref = f"{_excel_column_name(column_index)}{row_index}"
            cell_value = "" if value is None else str(value)
            cells.append(
                f'<c r="{cell_ref}" t="inlineStr"><is><t>{escape(cell_value)}</t></is></c>'
            )
        row_xml.append(f'<row r="{row_index}">{"".join(cells)}</row>')

    sheet_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(row_xml)}</sheetData>'
        '</worksheet>'
    )
    workbook_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<sheets><sheet name="Tasks" sheetId="1" r:id="rId1"/></sheets></workbook>'
    )
    workbook_rels_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
        '</Relationships>'
    )
    rels_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        '</Relationships>'
    )
    content_types_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        '</Types>'
    )

    buffer = BytesIO()
    with ZipFile(buffer, "w") as archive:
        archive.writestr("[Content_Types].xml", content_types_xml)
        archive.writestr("_rels/.rels", rels_xml)
        archive.writestr("xl/workbook.xml", workbook_xml)
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels_xml)
        archive.writestr("xl/worksheets/sheet1.xml", sheet_xml)
    return buffer.getvalue()


def _task_export_rows(tasks):
    rows = [[
        "Task Title",
        "Task Description",
        "Status",
        "Due date",
        "Reminder",
        "Assigned",
        "Subtask Title",
        "Subtask Completed",
    ]]
    for task in tasks:
        due_datetime = timezone.localtime(task.due_datetime).strftime("%d.%m.%Y %H:%M") if task.due_datetime else ""
        reminder = task.active_reminder
        reminder_datetime = timezone.localtime(reminder.reminder_datetime).strftime("%d.%m.%Y %H:%M") if reminder else ""
        assigned = task.assigned_to.get_full_name() or task.assigned_to.username
        subtasks = list(task.subtasks.all())
        if not subtasks:
            rows.append([task.title, task.description, task.get_status_display(), due_datetime, reminder_datetime, assigned, "", ""])
            continue
        for subtask in subtasks:
            rows.append([
                task.title,
                task.description,
                task.get_status_display(),
                due_datetime,
                reminder_datetime,
                assigned,
                subtask.title,
                "Yes" if subtask.is_completed else "No",
            ])
    return rows


def _task_detail_context(request, task, is_modal=False):
    reminder_source = task.active_reminder.reminder_datetime if task.active_reminder else None
    reminder_initial = reminder_source or task.due_datetime or timezone.now() + timedelta(days=1)
    return {
        "task": task,
        "page_title": task.title,
        "postpone_form": PostponeForm(reminder_datetime=reminder_initial, task=task),
        "is_modal": is_modal,
    }


def _postpone_datetime_from_request(request):
    preset = request.POST.get("postpone_for", "")
    preset_deltas = {
        "1m": timedelta(minutes=1),
        "10m": timedelta(minutes=10),
        "1h": timedelta(hours=1),
        "1d": timedelta(days=1),
        "1w": timedelta(weeks=1),
    }
    if preset in preset_deltas:
        return timezone.now() + preset_deltas[preset]
    return None


def _task_postponed_payload(task, reminder):
    return {
        "taskPostponed": {
            "taskId": str(task.pk),
            "status": task.status,
            "statusLabel": task.get_status_display(),
            "reminderLabel": timezone.localtime(reminder.reminder_datetime).strftime("%d.%m.%Y %H:%M"),
        }
    }


def _render_task_detail_partial(request, task):
    task = get_object_or_404(
        _task_queryset_for(request.user).prefetch_related("subtasks__comments__created_by", "reminders", "activities__user"),
        pk=task.pk,
    )
    return render(request, "tasks/partials/task_detail_body.html", _task_detail_context(request, task, is_modal=True))


@login_required
def dashboard_view(request):
    tasks = _task_queryset_for(request.user)
    due_soon = tasks.filter(status__in=["new", "pending", "remind"], due_datetime__gte=timezone.now()).order_by("due_datetime")[:5]
    recent_activities = TaskActivity.objects.filter(Q(task__in=tasks) | Q(user=request.user, task__isnull=True)).select_related("user", "task")[:10]
    context = {
        "page_title": "Dashboard",
        "status_counts": _status_counts(request.user),
        "total_tasks": tasks.count(),
        "due_today": tasks.filter(due_datetime__date=timezone.localdate()).count(),
        "overdue": tasks.filter(due_datetime__lt=timezone.now(), status__in=["new", "pending", "remind"]).count(),
        "recent_tasks": tasks.order_by("-created_at")[:8],
        "due_soon": due_soon,
        "recent_activities": recent_activities,
        "create_form": _quick_task_form(request.user),
    }
    return render(request, "tasks/dashboard.html", context)


@login_required
def task_list_view(request):
    base_tasks = _task_queryset_for(request.user)
    tasks, filter_state = _filtered_task_queryset(request, request.user)
    activities = TaskActivity.objects.filter(Q(task__in=_task_queryset_for(request.user)) | Q(user=request.user, task__isnull=True)).select_related("user", "task")[:20]
    filter_params = {
        "q": filter_state["query"],
        "assigned": filter_state["assigned_filter"],
        "view": filter_state["view_mode"],
        "sort": filter_state["sort_key"],
        "direction": filter_state["direction"],
    }
    def build_url(extra=None, statuses=None):
        params = {**filter_params, **(extra or {}), "status": statuses if statuses is not None else filter_state["selected_statuses"]}
        return "?" + urlencode(params, doseq=True)

    status_links = {"all": build_url(statuses=TASK_STATUS_KEYS)}
    for status in TASK_STATUS_KEYS:
        next_statuses = [item for item in filter_state["selected_statuses"] if item != status]
        if status not in filter_state["selected_status_set"]:
            next_statuses = filter_state["selected_statuses"] + [status]
        status_links[status] = build_url(statuses=next_statuses or DEFAULT_TASK_STATUSES)
    view_links = {
        mode: build_url({"view": mode})
        for mode in ["cards", "list"]
    }
    sort_links = {}
    for key in TASK_SORT_FIELDS:
        next_direction = "desc" if filter_state["sort_key"] == key and filter_state["direction"] == "asc" else "asc"
        sort_links[key] = build_url({"sort": key, "direction": next_direction, "view": "list"})
    assigned_users = User.objects.filter(
        pk__in=base_tasks.values_list("assigned_to_id", flat=True)
    ).order_by("first_name", "last_name", "username")
    context = {
        "page_title": "Tasks",
        "tasks": tasks,
        "view_mode": filter_state["view_mode"],
        "selected_statuses": filter_state["selected_statuses"],
        "selected_status_set": filter_state["selected_status_set"],
        "all_statuses_selected": filter_state["all_statuses_selected"],
        "assigned_filter": filter_state["assigned_filter"],
        "query": filter_state["query"],
        "sort_key": filter_state["sort_key"],
        "direction": filter_state["direction"],
        "status_links": status_links,
        "view_links": view_links,
        "sort_links": sort_links,
        "export_url": reverse("tasks:task_export") + build_url(),
        "assigned_users": assigned_users,
        "status_counts": _status_counts(request.user),
        "activities": activities,
        "create_form": _quick_task_form(request.user),
        "import_form": TaskImportForm(),
    }
    return render(request, "tasks/task_list.html", context)


@login_required
def task_detail_view(request, pk):
    is_modal = bool(request.headers.get("HX-Request"))
    task = get_object_or_404(
        _task_queryset_for(request.user).prefetch_related("subtasks__comments__created_by", "reminders", "activities__user"),
        pk=pk,
    )
    if task.status == "new":
        task.status = "pending"
        task.updated_by = request.user
        task.save(update_fields=["status", "updated_by", "updated_at"])
        log_task_activity(task, request.user, "update", f'Task "{task.title}" status changed from new to pending')
    template_name = "tasks/partials/task_detail_body.html" if is_modal else "tasks/task_detail.html"
    return render(request, template_name, _task_detail_context(request, task, is_modal=is_modal))


@login_required
def task_create_view(request):
    if request.method == "POST":
        form = QuickTaskForm(request.POST, request_user=request.user)
        if form.is_valid():
            task = form.save(commit=False)
            task.created_by = request.user
            task.updated_by = request.user
            if not task.assigned_to_id:
                task.assigned_to = request.user
            task.due_datetime = None
            task.save()
            reminder_datetime = form.cleaned_data["reminder_datetime"] or timezone.now() + timedelta(days=1)
            upsert_task_reminder(task, task.assigned_to, reminder_datetime)
            log_task_activity(task, request.user, "create", f'Task "{task.title}" has been created')
            messages.success(request, f'Task "{task.title}" created.')
            return redirect("tasks:task_list")
    else:
        form = _quick_task_form(request.user)
    return render(request, "tasks/task_form.html", {"form": form, "page_title": "Create Task", "is_edit": False})


@login_required
def task_import_view(request):
    if request.method == "POST":
        form = TaskImportForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                created_count, skipped_count = _import_tasks_from_xlsx(form.cleaned_data["file"], request.user)
                message = f"Imported {created_count} task(s)."
                if skipped_count:
                    message += f" Skipped {skipped_count} row(s) without title."
                messages.success(request, message)
            except ValueError as exc:
                messages.error(request, str(exc))
        else:
            messages.error(request, "Please upload a valid .xlsx file.")
    return redirect("tasks:task_list")


@login_required
def task_export_view(request):
    tasks, _ = _filtered_task_queryset(request, request.user)
    rows = _task_export_rows(tasks)
    content = _xlsx_response_from_rows(rows)
    response = HttpResponse(
        content,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    timestamp = timezone.localtime().strftime("%Y%m%d-%H%M")
    response["Content-Disposition"] = f'attachment; filename="tasks-{timestamp}.xlsx"'
    return response


@login_required
def task_edit_view(request, pk):
    task = get_object_or_404(_task_queryset_for(request.user).prefetch_related("subtasks", "reminders"), pk=pk)
    if request.method == "POST":
        form = TaskForm(request.POST, instance=task, request_user=request.user)
        if form.is_valid():
            task = form.save(commit=False)
            task.updated_by = request.user
            task.save()
            sync_task_subtasks(task, form.cleaned_data["subtasks_text"])
            upsert_task_reminder(task, task.assigned_to, form.cleaned_data["reminder_datetime"])
            log_task_activity(task, request.user, "update", f'Task "{task.title}" has been updated')
            messages.success(request, f'Task "{task.title}" updated.')
            return redirect("tasks:task_detail", pk=task.pk)
    else:
        form = TaskForm(instance=task, request_user=request.user)
    return render(request, "tasks/task_form.html", {"form": form, "task": task, "page_title": f"Edit {task.title}", "is_edit": True})


@login_required
def task_delete_view(request, pk):
    task = get_object_or_404(Task.objects.filter(created_by=request.user), pk=pk)
    if request.method == "POST":
        title = task.title
        log_task_activity(task, request.user, "delete", f'Task "{title}" has been deleted')
        task.delete()
        messages.success(request, f'Task "{title}" deleted.')
        return redirect("tasks:task_list")
    return render(request, "tasks/task_confirm_delete.html", {"task": task, "page_title": f"Delete {task.title}"})


@login_required
def task_complete_view(request, pk):
    task = get_object_or_404(_task_queryset_for(request.user), pk=pk)
    if request.method == "POST":
        task.status = "completed"
        task.updated_by = request.user
        task.save(update_fields=["status", "updated_by", "updated_at"])
        log_task_activity(task, request.user, "complete", f'Task "{task.title}" has been completed')
        messages.success(request, f'Task "{task.title}" completed.')
    return redirect("tasks:task_detail", pk=task.pk)


@login_required
def task_cancel_view(request, pk):
    task = get_object_or_404(_task_queryset_for(request.user), pk=pk)
    if request.method == "POST":
        task.status = "cancelled"
        task.updated_by = request.user
        task.save(update_fields=["status", "updated_by", "updated_at"])
        log_task_activity(task, request.user, "cancel", f'Task "{task.title}" has been cancelled')
        messages.success(request, f'Task "{task.title}" cancelled.')
    return redirect("tasks:task_detail", pk=task.pk)


@login_required
def task_postpone_view(request, pk):
    task = get_object_or_404(_task_queryset_for(request.user), pk=pk)
    is_hx_request = bool(request.headers.get("HX-Request"))
    if request.method == "POST":
        preset_datetime = _postpone_datetime_from_request(request)
        form = PostponeForm(request.POST, task=task) if preset_datetime is None else None
        reminder_datetime = preset_datetime or (form.cleaned_data["reminder_datetime"] if form and form.is_valid() else None)
        if reminder_datetime:
            reminder = upsert_task_reminder(task, task.assigned_to, reminder_datetime)
            task.status = "pending"
            task.updated_by = request.user
            task.save(update_fields=["status", "updated_by", "updated_at"])
            log_task_activity(task, request.user, "postpone", f'Task "{task.title}" postponed to {timezone.localtime(reminder.reminder_datetime).strftime("%d.%m.%Y %H:%M")}')
            if not is_hx_request:
                messages.success(request, f'Task "{task.title}" postponed.')
            if is_hx_request:
                response = HttpResponse(status=204)
                response["HX-Trigger"] = json.dumps(_task_postponed_payload(task, reminder))
                return response
        else:
            if is_hx_request:
                response = HttpResponse(status=400)
                response["HX-Trigger"] = "taskPostponeFailed"
                return response
            messages.error(request, "Choose a valid reminder time.")
    return redirect("tasks:task_detail", pk=task.pk)


@login_required
def subtask_toggle_view(request, pk):
    subtask = get_object_or_404(SubTask.objects.select_related("task"), pk=pk, task__in=_task_queryset_for(request.user))
    if request.method == "POST":
        subtask.is_completed = not subtask.is_completed
        subtask.save(update_fields=["is_completed"])
        log_task_activity(subtask.task, request.user, "update", f'Sub-task "{subtask.title}" updated')
        if request.headers.get("HX-Request"):
            return _render_task_detail_partial(request, subtask.task)
    return redirect("tasks:task_detail", pk=subtask.task.pk)


@login_required
def subtask_add_view(request, pk):
    task = get_object_or_404(_task_queryset_for(request.user), pk=pk)
    if request.method == "POST":
        title = request.POST.get("title", "").strip()
        if title:
            next_order = (task.subtasks.aggregate(max_order=Max("order"))["max_order"] or 0) + 1
            SubTask.objects.create(task=task, title=title, order=next_order)
            task.updated_by = request.user
            task.save(update_fields=["updated_by", "updated_at"])
            log_task_activity(task, request.user, "update", f'Sub-task "{title}" added')
            messages.success(request, f'Sub-task "{title}" added.')
        else:
            messages.error(request, "Sub-task title cannot be empty.")
        if request.headers.get("HX-Request"):
            return _render_task_detail_partial(request, task)
    return redirect("tasks:task_detail", pk=task.pk)


@login_required
def subtask_comment_add_view(request, pk):
    subtask = get_object_or_404(SubTask.objects.select_related("task"), pk=pk, task__in=_task_queryset_for(request.user))
    if request.method == "POST":
        body = request.POST.get("body", "").strip()
        if body:
            SubTaskComment.objects.create(subtask=subtask, body=body, created_by=request.user)
            subtask.task.updated_by = request.user
            subtask.task.save(update_fields=["updated_by", "updated_at"])
            log_task_activity(subtask.task, request.user, "update", f'Comment added to sub-task "{subtask.title}"')
            messages.success(request, "Sub-task comment added.")
        else:
            messages.error(request, "Comment cannot be empty.")
    return redirect("tasks:task_detail", pk=subtask.task.pk)


@login_required
def reminder_poll_view(request):
    triggered = trigger_due_reminders(request.user)
    payload = []
    for task in triggered:
        reminder = task.active_reminder
        payload.append(
            {
                "id": str(task.pk),
                "title": task.title,
                "description": task.description,
                "detail_url": f"/tasks/{task.pk}/",
                "due_datetime": timezone.localtime(task.due_datetime).strftime("%d.%m.%Y %H:%M") if task.due_datetime else "",
                "reminder_datetime": timezone.localtime(reminder.reminder_datetime).strftime("%d.%m.%Y %H:%M") if reminder else "",
            }
        )
    return JsonResponse({"reminders": payload})


@login_required
def activity_panel_view(request):
    activities = TaskActivity.objects.filter(Q(task__in=_task_queryset_for(request.user)) | Q(user=request.user, task__isnull=True)).select_related("task", "user")[:20]
    return render(request, "tasks/partials/activity_panel.html", {"activities": activities})
