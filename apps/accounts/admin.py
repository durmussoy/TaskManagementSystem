from django.contrib import admin

from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "title", "language", "timezone", "default_task_view")
    list_select_related = ("user",)
