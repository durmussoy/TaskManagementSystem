from django.urls import path

from . import views

app_name = "tasks"

urlpatterns = [
    path("", views.task_list_view, name="task_list"),
    path("dashboard/", views.dashboard_view, name="dashboard"),
    path("create/", views.task_create_view, name="task_create"),
    path("import/", views.task_import_view, name="task_import"),
    path("export/", views.task_export_view, name="task_export"),
    path("reminders/poll/", views.reminder_poll_view, name="reminder_poll"),
    path("activity/panel/", views.activity_panel_view, name="activity_panel"),
    path("<uuid:pk>/", views.task_detail_view, name="task_detail"),
    path("<uuid:pk>/edit/", views.task_edit_view, name="task_edit"),
    path("<uuid:pk>/delete/", views.task_delete_view, name="task_delete"),
    path("<uuid:pk>/complete/", views.task_complete_view, name="task_complete"),
    path("<uuid:pk>/cancel/", views.task_cancel_view, name="task_cancel"),
    path("<uuid:pk>/postpone/", views.task_postpone_view, name="task_postpone"),
    path("<uuid:pk>/subtasks/add/", views.subtask_add_view, name="subtask_add"),
    path("subtasks/<int:pk>/toggle/", views.subtask_toggle_view, name="subtask_toggle"),
    path("subtasks/<int:pk>/comments/add/", views.subtask_comment_add_view, name="subtask_comment_add"),
]
