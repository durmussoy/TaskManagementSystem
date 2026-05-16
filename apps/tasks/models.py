from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from apps.core.models import AuditModel


class Task(AuditModel):
    STATUS_CHOICES = [
        ("new", "New"),
        ("pending", "Pending"),
        ("remind", "Reminder"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    due_datetime = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name="assigned_tasks")
    is_private = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    @property
    def active_reminder(self):
        if not self.pk or not self.assigned_to_id:
            return None
        return self.reminders.filter(user_id=self.assigned_to_id).first()


class SubTask(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="subtasks")
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title


class SubTaskComment(models.Model):
    subtask = models.ForeignKey(SubTask, on_delete=models.CASCADE, related_name="comments")
    body = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self):
        return self.body[:80]


class TaskReminder(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="reminders")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="task_reminders")
    reminder_datetime = models.DateTimeField()
    last_reminded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ["task", "user"]
        ordering = ["reminder_datetime"]

    def should_trigger(self, now=None):
        now = now or timezone.now()
        if self.reminder_datetime > now:
            return False
        if self.task.status not in {"pending", "new", "remind"}:
            return False
        if self.last_reminded_at and self.last_reminded_at >= self.reminder_datetime:
            return False
        return True


class TaskActivity(models.Model):
    ACTION_CHOICES = [
        ("create", "Create"),
        ("update", "Update"),
        ("complete", "Complete"),
        ("cancel", "Cancel"),
        ("postpone", "Postpone"),
        ("reminder", "Reminder"),
        ("delete", "Delete"),
    ]

    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name="activities")
    task_title = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.message
