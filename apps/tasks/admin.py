from django.contrib import admin

from .models import SubTask, Task, TaskActivity, TaskReminder


class SubTaskInline(admin.TabularInline):
    model = SubTask
    extra = 0


class TaskReminderInline(admin.TabularInline):
    model = TaskReminder
    extra = 0


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "assigned_to", "due_datetime", "created_at")
    list_filter = ("status", "assigned_to")
    search_fields = ("title", "description")
    inlines = [SubTaskInline, TaskReminderInline]


@admin.register(TaskActivity)
class TaskActivityAdmin(admin.ModelAdmin):
    list_display = ("task_title", "action", "user", "created_at")
    list_filter = ("action",)
    search_fields = ("task_title", "message")

