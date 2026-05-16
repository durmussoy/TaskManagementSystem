from datetime import datetime, timedelta

from django import forms
from django.contrib.auth.models import User
from django.utils import timezone

from .models import Task


class TaskForm(forms.ModelForm):
    reminder_datetime = forms.DateTimeField(
        widget=forms.DateTimeInput(attrs={"class": "form-control", "type": "datetime-local"}),
    )
    subtasks_text = forms.CharField(
        required=False,
        widget=forms.Textarea(
            attrs={
                "class": "form-control",
                "rows": 4,
                "placeholder": "One sub-task per line",
            }
        ),
    )

    class Meta:
        model = Task
        fields = ["title", "description", "due_datetime", "assigned_to", "status"]
        widgets = {
            "title": forms.TextInput(attrs={"class": "form-control"}),
            "description": forms.Textarea(attrs={"class": "form-control", "rows": 4}),
            "due_datetime": forms.DateTimeInput(attrs={"class": "form-control", "type": "datetime-local"}),
            "assigned_to": forms.Select(attrs={"class": "form-select"}),
            "status": forms.Select(attrs={"class": "form-select"}),
        }

    def __init__(self, *args, **kwargs):
        self.request_user = kwargs.pop("request_user", None)
        super().__init__(*args, **kwargs)
        self.fields["assigned_to"].queryset = User.objects.filter(is_active=True).order_by("username")
        self.fields["description"].required = False
        self.fields["due_datetime"].required = False
        if self.instance.pk:
            reminder = self.instance.active_reminder
            if reminder:
                self.fields["reminder_datetime"].initial = timezone.localtime(reminder.reminder_datetime).strftime("%Y-%m-%dT%H:%M")
            self.fields["subtasks_text"].initial = "\n".join(subtask.title for subtask in self.instance.subtasks.all())

    def clean(self):
        cleaned_data = super().clean()
        due_datetime = cleaned_data.get("due_datetime")
        reminder_datetime = cleaned_data.get("reminder_datetime")
        if due_datetime and due_datetime < timezone.now():
            self.add_error("due_datetime", "Due date cannot be in the past.")
        if due_datetime and reminder_datetime and reminder_datetime > due_datetime:
            self.add_error("reminder_datetime", "Reminder time cannot be after due date.")
        return cleaned_data


class QuickTaskForm(forms.ModelForm):
    reminder_datetime = forms.DateTimeField(
        required=False,
        label="Reminder date",
        widget=forms.DateTimeInput(attrs={"class": "form-control", "type": "datetime-local"}),
    )

    class Meta:
        model = Task
        fields = ["title", "description", "assigned_to", "is_private"]
        widgets = {
            "title": forms.TextInput(attrs={"class": "form-control", "placeholder": "Task title", "autofocus": True}),
            "description": forms.Textarea(attrs={"class": "form-control", "rows": 3, "placeholder": "Optional notes"}),
            "assigned_to": forms.Select(attrs={"class": "form-select"}),
            "is_private": forms.CheckboxInput(attrs={"class": "form-check-input"}),
        }

    def __init__(self, *args, **kwargs):
        self.request_user = kwargs.pop("request_user", None)
        super().__init__(*args, **kwargs)
        self.fields["description"].required = False
        self.fields["assigned_to"].required = False
        self.fields["assigned_to"].queryset = User.objects.filter(is_active=True).order_by("username")
        if self.request_user and not self.initial.get("assigned_to"):
            self.initial["assigned_to"] = self.request_user.pk
        if not self.initial.get("reminder_datetime"):
            self.initial["reminder_datetime"] = timezone.localtime(timezone.now() + timedelta(days=1)).strftime("%Y-%m-%dT%H:%M")


class TaskImportForm(forms.Form):
    file = forms.FileField(
        widget=forms.FileInput(attrs={"class": "form-control", "accept": ".xlsx"}),
    )

    def clean_file(self):
        upload = self.cleaned_data["file"]
        if not upload.name.lower().endswith(".xlsx"):
            raise forms.ValidationError("Please upload an .xlsx file.")
        return upload


class PostponeForm(forms.Form):
    custom_date = forms.DateField(
        widget=forms.DateInput(attrs={"class": "form-control", "type": "date"}),
    )
    custom_hour = forms.ChoiceField(
        choices=[(str(hour), f"{hour:02d}") for hour in range(9, 24)],
        widget=forms.Select(attrs={"class": "form-select"}),
    )
    custom_minute = forms.ChoiceField(
        choices=[(str(minute), f"{minute:02d}") for minute in (0, 15, 30, 45)],
        widget=forms.Select(attrs={"class": "form-select"}),
    )

    def __init__(self, *args, **kwargs):
        self.task = kwargs.pop("task", None)
        reminder_datetime = kwargs.pop("reminder_datetime", None)
        initial = kwargs.setdefault("initial", {})
        if reminder_datetime:
            local_reminder = timezone.localtime(reminder_datetime)
            rounded_minute = min((0, 15, 30, 45), key=lambda minute: abs(minute - local_reminder.minute))
            initial.setdefault("custom_date", local_reminder.date())
            initial.setdefault("custom_hour", str(max(local_reminder.hour, 9)))
            initial.setdefault("custom_minute", str(rounded_minute))
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned_data = super().clean()
        custom_date = cleaned_data.get("custom_date")
        custom_hour = cleaned_data.get("custom_hour")
        custom_minute = cleaned_data.get("custom_minute")
        if not custom_date or custom_hour is None or custom_minute is None:
            return cleaned_data

        local_datetime = datetime.combine(
            custom_date,
            datetime.min.time().replace(hour=int(custom_hour), minute=int(custom_minute)),
        )
        reminder_datetime = timezone.make_aware(local_datetime, timezone.get_current_timezone())
        cleaned_data["reminder_datetime"] = reminder_datetime
        return cleaned_data
