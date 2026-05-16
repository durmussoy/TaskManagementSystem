from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.tasks.models import Task
from apps.tasks.services import log_task_activity, sync_task_subtasks, upsert_task_reminder


class Command(BaseCommand):
    help = "Create demo users and sample tasks for TaskRemainder."

    def handle(self, *args, **options):
        admin, admin_created = User.objects.get_or_create(
            username="admin",
            defaults={"is_staff": True, "is_superuser": True, "first_name": "Admin"},
        )
        admin.set_password("admin123")
        admin.save()
        admin.profile.role = "admin"
        admin.profile.save(update_fields=["role"])

        user, user_created = User.objects.get_or_create(
            username="Durmus",
            defaults={"first_name": "Durmus"},
        )
        user.set_password("123")
        user.save()

        if not Task.objects.exists():
            now = timezone.now()
            samples = [
                {
                    "title": "Prepare weekly report",
                    "description": "Collect updates and prepare the weekly task summary.",
                    "status": "pending",
                    "due": now + timedelta(days=1),
                    "reminder": now + timedelta(hours=12),
                    "subtasks": ["Collect completed items", "Draft summary", "Share with team"],
                },
                {
                    "title": "Review backlog tasks",
                    "description": "Check open work items and clean up outdated tasks.",
                    "status": "new",
                    "due": now + timedelta(days=2),
                    "reminder": now + timedelta(days=1, hours=3),
                    "subtasks": ["Archive stale tasks", "Reassign owners"],
                },
            ]
            for item in samples:
                task = Task.objects.create(
                    title=item["title"],
                    description=item["description"],
                    status=item["status"],
                    due_datetime=item["due"],
                    assigned_to=user,
                    created_by=admin,
                    updated_by=admin,
                )
                sync_task_subtasks(task, "\n".join(item["subtasks"]))
                upsert_task_reminder(task, user, item["reminder"])
                log_task_activity(task, admin, "create", f'Task "{task.title}" has been created')

        self.stdout.write(self.style.SUCCESS("Demo data ready."))
        if admin_created or user_created:
            self.stdout.write("Users: admin/admin123 and Durmus/123")
