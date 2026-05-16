from django.db import transaction
from django.utils import timezone

from .models import SubTask, TaskActivity, TaskReminder


def log_task_activity(task, user, action, message):
    return TaskActivity.objects.create(task=task, task_title=task.title, user=user, action=action, message=message)


@transaction.atomic
def sync_task_subtasks(task, subtasks_text):
    lines = [line.strip() for line in (subtasks_text or "").splitlines() if line.strip()]
    existing = list(task.subtasks.all())
    existing_map = {subtask.title: subtask for subtask in existing}
    kept_ids = []

    for index, title in enumerate(lines):
        if title in existing_map:
            subtask = existing_map[title]
            subtask.order = index
            subtask.save(update_fields=["order"])
            kept_ids.append(subtask.id)
        else:
            new_subtask = SubTask.objects.create(task=task, title=title, order=index)
            kept_ids.append(new_subtask.id)

    task.subtasks.exclude(id__in=kept_ids).delete()


def upsert_task_reminder(task, user, reminder_datetime):
    reminder_datetime = reminder_datetime.replace(second=0, microsecond=0)
    task.reminders.exclude(user=user).delete()
    reminder, _ = TaskReminder.objects.update_or_create(
        task=task,
        user=user,
        defaults={
            "reminder_datetime": reminder_datetime,
            "last_reminded_at": None,
        },
    )
    return reminder


@transaction.atomic
def trigger_due_reminders(user):
    now = timezone.now()
    reminders = (
        TaskReminder.objects.select_related("task", "user")
        .filter(user=user, task__assigned_to=user, task__status__in=["new", "pending", "remind"])
        .order_by("reminder_datetime")
    )
    triggered = []
    for reminder in reminders:
        if not reminder.should_trigger(now):
            continue
        reminder.task.status = "remind"
        reminder.task.updated_by = user
        reminder.task.save(update_fields=["status", "updated_by", "updated_at"])
        reminder.last_reminded_at = now
        reminder.save(update_fields=["last_reminded_at"])
        log_task_activity(reminder.task, user, "reminder", f'Time for reminder: "{reminder.task.title}"')
        triggered.append(reminder.task)
    return triggered
