from datetime import timedelta
from io import BytesIO
import json
from zipfile import ZipFile

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone

from apps.tasks.models import SubTask, SubTaskComment, Task
from apps.tasks.services import upsert_task_reminder
from apps.tasks.views import _xlsx_column_values


class TaskViewsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="tester", password="123456")
        self.other_user = User.objects.create_user(username="other", password="123456")
        self.client = Client()
        self.client.force_login(self.user)

    def _xlsx_upload(self, rows):
        def cell_ref(row_index, column_index):
            return f"{chr(ord('A') + column_index)}{row_index}"

        row_xml = []
        for row_index, row in enumerate(rows, start=1):
            cells = []
            for column_index, value in enumerate(row):
                cells.append(
                    f'<c r="{cell_ref(row_index, column_index)}" t="inlineStr"><is><t>{value}</t></is></c>'
                )
            row_xml.append(f'<row r="{row_index}">{"".join(cells)}</row>')
        sheet_xml = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            f'<sheetData>{"".join(row_xml)}</sheetData>'
            '</worksheet>'
        )
        buffer = BytesIO()
        with ZipFile(buffer, "w") as archive:
            archive.writestr("xl/worksheets/sheet1.xml", sheet_xml)
        return SimpleUploadedFile(
            "tasks.xlsx",
            buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    def test_task_create_view_creates_task(self):
        response = self.client.post(
            reverse("tasks:task_create"),
            {
                "title": "Create via test",
                "description": "Body",
                "reminder_datetime": (timezone.localtime(timezone.now() + timedelta(days=1))).strftime("%Y-%m-%dT%H:%M"),
                "assigned_to": self.user.pk,
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Task.objects.filter(title="Create via test").exists())
        task = Task.objects.get(title="Create via test")
        self.assertEqual(task.status, "new")
        self.assertIsNone(task.due_datetime)
        self.assertEqual(task.subtasks.count(), 0)
        self.assertTrue(task.reminders.exists())

    def test_private_task_create_is_hidden_from_assigned_user(self):
        response = self.client.post(
            reverse("tasks:task_create"),
            {
                "title": "Private task",
                "description": "Hidden",
                "reminder_datetime": (timezone.localtime(timezone.now() + timedelta(days=1))).strftime("%Y-%m-%dT%H:%M"),
                "assigned_to": self.other_user.pk,
                "is_private": "on",
            },
        )
        task = Task.objects.get(title="Private task")

        self.assertEqual(response.status_code, 302)
        self.assertTrue(task.is_private)
        self.assertEqual(task.created_by, self.user)
        self.assertEqual(task.assigned_to, self.other_user)

        other_client = Client()
        other_client.force_login(self.other_user)
        response = other_client.get(reverse("tasks:task_list"), {"status": "new"})

        self.assertNotContains(response, "Private task")

    def test_public_task_is_visible_to_assigned_user(self):
        Task.objects.create(
            title="Assigned public task",
            description="Visible",
            status="new",
            assigned_to=self.other_user,
            created_by=self.user,
            updated_by=self.user,
        )

        self.client.force_login(self.other_user)
        response = self.client.get(reverse("tasks:task_list"), {"status": "new"})

        self.assertContains(response, "Assigned public task")

    def test_task_import_view_creates_tasks_from_xlsx(self):
        upload = self._xlsx_upload(
            [
                ["Title", "Description", "Due date", "Assigned"],
                ["Imported task", "Imported body", "2026-05-12 09:30", "other"],
            ]
        )

        response = self.client.post(reverse("tasks:task_import"), {"file": upload}, follow=True)
        task = Task.objects.get(title="Imported task")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(task.description, "Imported body")
        self.assertEqual(task.assigned_to, self.other_user)
        self.assertEqual(timezone.localtime(task.due_datetime).hour, 9)
        self.assertEqual(timezone.localtime(task.due_datetime).minute, 30)
        self.assertTrue(task.reminders.exists())

    def test_task_export_view_exports_one_row_per_subtask(self):
        task_with_subtasks = Task.objects.create(
            title="Task with subtasks",
            description="Body",
            status="pending",
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )
        SubTask.objects.create(task=task_with_subtasks, title="First subtask", is_completed=False)
        SubTask.objects.create(task=task_with_subtasks, title="Second subtask", is_completed=True)
        Task.objects.create(
            title="Task without subtasks",
            description="Body",
            status="pending",
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )

        response = self.client.get(reverse("tasks:task_export"), {"status": "pending"})
        rows = _xlsx_column_values(BytesIO(response.content))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        self.assertEqual(rows[0], ["Task Title", "Task Description", "Status", "Due date", "Reminder", "Assigned", "Subtask Title", "Subtask Completed"])
        self.assertIn(["Task with subtasks", "Body", "Pending", None, None, "tester", "First subtask", "No"], rows)
        self.assertIn(["Task with subtasks", "Body", "Pending", None, None, "tester", "Second subtask", "Yes"], rows)
        self.assertIn(["Task without subtasks", "Body", "Pending", None, None, "tester", None, None], rows)

    def test_task_export_view_respects_status_filters(self):
        Task.objects.create(
            title="Pending export task",
            description="Body",
            status="pending",
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )
        Task.objects.create(
            title="Completed export task",
            description="Body",
            status="completed",
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )

        response = self.client.get(reverse("tasks:task_export"), {"status": "completed"})
        rows = _xlsx_column_values(BytesIO(response.content))
        flat_values = [value for row in rows for value in row]

        self.assertIn("Completed export task", flat_values)
        self.assertNotIn("Pending export task", flat_values)

    def test_reminder_poll_returns_due_reminder(self):
        task = Task.objects.create(
            title="Reminder task",
            description="Body",
            status="pending",
            due_datetime=timezone.now() + timedelta(hours=1),
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )
        upsert_task_reminder(task, self.user, timezone.now() - timedelta(minutes=1))

        response = self.client.get(reverse("tasks:reminder_poll"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["reminders"]), 1)

    def test_task_list_defaults_to_active_statuses(self):
        Task.objects.create(
            title="New task",
            description="Body",
            status="new",
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )
        Task.objects.create(
            title="Completed task",
            description="Body",
            status="completed",
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )

        response = self.client.get(reverse("tasks:task_list"))
        content = response.content.decode()

        self.assertEqual(response.status_code, 200)
        self.assertIn("New task", content)
        self.assertNotIn("Completed task", content)
        self.assertContains(response, 'name="status" value="new"')
        self.assertContains(response, 'name="status" value="pending"')
        self.assertContains(response, 'name="status" value="remind"')

    def test_task_list_uses_profile_default_view_when_not_in_url(self):
        self.user.profile.default_task_view = "list"
        self.user.profile.save(update_fields=["default_task_view"])

        response = self.client.get(reverse("tasks:task_list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'class="view-toggle-item active">\n                <i class="bi bi-table"></i> List')

    def test_task_list_accepts_multiple_status_filters(self):
        Task.objects.create(
            title="Pending task",
            description="Body",
            status="pending",
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )
        Task.objects.create(
            title="Completed task",
            description="Body",
            status="completed",
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )
        Task.objects.create(
            title="Cancelled task",
            description="Body",
            status="cancelled",
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )

        response = self.client.get(reverse("tasks:task_list"), {"status": ["pending", "completed"]})
        content = response.content.decode()

        self.assertEqual(response.status_code, 200)
        self.assertIn("Pending task", content)
        self.assertIn("Completed task", content)
        self.assertNotIn("Cancelled task", content)

    def test_subtask_add_view_adds_subtask(self):
        task = Task.objects.create(
            title="Parent task",
            description="Body",
            status="pending",
            due_datetime=timezone.now() + timedelta(days=1),
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )

        response = self.client.post(reverse("tasks:subtask_add", args=[task.pk]), {"title": "New sub-task"})

        self.assertEqual(response.status_code, 302)
        self.assertTrue(task.subtasks.filter(title="New sub-task").exists())

    def test_postpone_view_accepts_preset_duration(self):
        task = Task.objects.create(
            title="Preset postpone",
            description="Body",
            status="remind",
            due_datetime=timezone.now() + timedelta(days=1),
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )

        before = timezone.now()
        response = self.client.post(reverse("tasks:task_postpone", args=[task.pk]), {"postpone_for": "10m"})
        task.refresh_from_db()
        reminder = task.active_reminder

        self.assertEqual(response.status_code, 302)
        self.assertEqual(task.status, "pending")
        self.assertIsNotNone(reminder)
        self.assertEqual(reminder.reminder_datetime.second, 0)
        self.assertEqual(reminder.reminder_datetime.microsecond, 0)
        self.assertGreaterEqual(reminder.reminder_datetime, before + timedelta(minutes=9))
        self.assertLessEqual(reminder.reminder_datetime, before + timedelta(minutes=11))

    def test_postpone_hx_request_closes_modal_without_redirect(self):
        task = Task.objects.create(
            title="Modal postpone",
            description="Body",
            status="remind",
            due_datetime=timezone.now() + timedelta(days=1),
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )

        response = self.client.post(
            reverse("tasks:task_postpone", args=[task.pk]),
            {"postpone_for": "1h"},
            HTTP_HX_REQUEST="true",
        )
        task.refresh_from_db()

        self.assertEqual(response.status_code, 204)
        trigger_payload = json.loads(response.headers["HX-Trigger"])
        self.assertIn("taskPostponed", trigger_payload)
        self.assertEqual(trigger_payload["taskPostponed"]["taskId"], str(task.pk))
        self.assertEqual(trigger_payload["taskPostponed"]["status"], "pending")
        self.assertEqual(task.status, "pending")
        self.assertTrue(task.reminders.exists())

    def test_postpone_preset_can_move_reminder_after_due_date(self):
        task = Task.objects.create(
            title="Postpone after due",
            description="Body",
            status="remind",
            due_datetime=timezone.now() + timedelta(minutes=5),
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )

        response = self.client.post(
            reverse("tasks:task_postpone", args=[task.pk]),
            {"postpone_for": "1h"},
            HTTP_HX_REQUEST="true",
        )
        task.refresh_from_db()

        self.assertEqual(response.status_code, 204)
        self.assertEqual(task.status, "pending")
        self.assertTrue(task.reminders.exists())

    def test_postpone_view_accepts_custom_quarter_hour_time(self):
        task = Task.objects.create(
            title="Custom postpone",
            description="Body",
            status="remind",
            due_datetime=timezone.now() + timedelta(days=3),
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )
        custom_date = timezone.localdate() + timedelta(days=1)

        response = self.client.post(
            reverse("tasks:task_postpone", args=[task.pk]),
            {
                "custom_date": custom_date.strftime("%Y-%m-%d"),
                "custom_hour": "9",
                "custom_minute": "15",
            },
        )
        task.refresh_from_db()
        reminder = timezone.localtime(task.active_reminder.reminder_datetime)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(task.status, "pending")
        self.assertEqual(reminder.date(), custom_date)
        self.assertEqual(reminder.hour, 9)
        self.assertEqual(reminder.minute, 15)

    def test_subtask_add_hx_request_stays_in_modal(self):
        task = Task.objects.create(
            title="Parent task",
            description="Body",
            status="pending",
            due_datetime=timezone.now() + timedelta(days=1),
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )

        response = self.client.post(
            reverse("tasks:subtask_add", args=[task.pk]),
            {"title": "Modal sub-task"},
            HTTP_HX_REQUEST="true",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("Modal sub-task", response.content.decode())
        self.assertIn("subtask-title-truncated", response.content.decode())

    def test_subtask_toggle_hx_request_stays_in_modal(self):
        task = Task.objects.create(
            title="Parent task",
            description="Body",
            status="pending",
            due_datetime=timezone.now() + timedelta(days=1),
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )
        subtask = SubTask.objects.create(task=task, title="Child task")

        response = self.client.post(reverse("tasks:subtask_toggle", args=[subtask.pk]), HTTP_HX_REQUEST="true")
        subtask.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(subtask.is_completed)
        self.assertIn("Child task", response.content.decode())
        self.assertIn("bi-arrows-fullscreen", response.content.decode())

    def test_subtask_comment_add_view_adds_single_level_comment(self):
        task = Task.objects.create(
            title="Parent task",
            description="Body",
            status="pending",
            due_datetime=timezone.now() + timedelta(days=1),
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )
        subtask = SubTask.objects.create(task=task, title="Child task")

        response = self.client.post(reverse("tasks:subtask_comment_add", args=[subtask.pk]), {"body": "Looks good"})

        self.assertEqual(response.status_code, 302)
        comment = SubTaskComment.objects.get(subtask=subtask)
        self.assertEqual(comment.body, "Looks good")
        self.assertEqual(comment.created_by, self.user)

    def test_task_detail_modal_shows_subtask_comment_count_only(self):
        task = Task.objects.create(
            title="Parent task",
            description="Body",
            status="pending",
            due_datetime=timezone.now() + timedelta(days=1),
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )
        subtask = SubTask.objects.create(task=task, title="Child task")
        SubTaskComment.objects.create(subtask=subtask, body="Hidden in modal", created_by=self.user)

        response = self.client.get(reverse("tasks:task_detail", args=[task.pk]), HTTP_HX_REQUEST="true")
        content = response.content.decode()

        self.assertEqual(response.status_code, 200)
        self.assertIn("subtask-comment-count", content)
        self.assertIn("bi-arrows-fullscreen", content)
        self.assertNotIn("Hidden in modal", content)

    def test_task_detail_full_page_collapses_subtask_comments(self):
        task = Task.objects.create(
            title="Parent task",
            description="Body",
            status="pending",
            due_datetime=timezone.now() + timedelta(days=1),
            assigned_to=self.user,
            created_by=self.user,
            updated_by=self.user,
        )
        subtask = SubTask.objects.create(task=task, title="Child task")
        SubTaskComment.objects.create(subtask=subtask, body="Collapsed comment", created_by=self.user)

        response = self.client.get(reverse("tasks:task_detail", args=[task.pk]))
        content = response.content.decode()

        self.assertEqual(response.status_code, 200)
        self.assertIn(f'id="subtask-comments-{subtask.pk}"', content)
        self.assertIn("collapse subtask-comments", content)
        self.assertIn('data-bs-toggle="collapse"', content)
        self.assertIn("Collapsed comment", content)
