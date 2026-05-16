from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User

from .models import UserProfile


class LoginForm(AuthenticationForm):
    username = forms.CharField(widget=forms.TextInput(attrs={"class": "form-control", "placeholder": "Username"}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={"class": "form-control", "placeholder": "Password"}))


class ProfileForm(forms.ModelForm):
    first_name = forms.CharField(required=False, widget=forms.TextInput(attrs={"class": "form-control"}))
    last_name = forms.CharField(required=False, widget=forms.TextInput(attrs={"class": "form-control"}))
    email = forms.EmailField(required=False, widget=forms.EmailInput(attrs={"class": "form-control"}))
    title = forms.CharField(required=False, widget=forms.TextInput(attrs={"class": "form-control", "placeholder": "Product Manager, Team Lead..."}))
    language = forms.ChoiceField(choices=UserProfile.LANGUAGE_CHOICES, widget=forms.Select(attrs={"class": "form-select"}))
    timezone = forms.ChoiceField(choices=UserProfile.TIMEZONE_CHOICES, widget=forms.Select(attrs={"class": "form-select"}))
    default_task_view = forms.ChoiceField(choices=UserProfile.DEFAULT_TASK_VIEW_CHOICES, widget=forms.Select(attrs={"class": "form-select"}))
    avatar = forms.FileField(required=False, widget=forms.FileInput(attrs={"class": "form-control", "accept": "image/*"}))
    bio = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={"class": "form-control", "rows": 4, "placeholder": "Short profile note"}),
    )

    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email"]
        widgets = {
            "username": forms.TextInput(attrs={"class": "form-control"}),
        }

    def __init__(self, *args, **kwargs):
        self.profile = kwargs.pop("profile", None)
        super().__init__(*args, **kwargs)
        if self.profile:
            self.fields["title"].initial = self.profile.title
            self.fields["language"].initial = self.profile.language
            self.fields["timezone"].initial = self.profile.timezone
            self.fields["default_task_view"].initial = self.profile.default_task_view
            self.fields["bio"].initial = self.profile.bio

    def save(self, commit=True):
        user = super().save(commit=commit)
        if self.profile:
            self.profile.title = self.cleaned_data["title"]
            self.profile.language = self.cleaned_data["language"]
            self.profile.timezone = self.cleaned_data["timezone"]
            self.profile.default_task_view = self.cleaned_data["default_task_view"]
            self.profile.bio = self.cleaned_data["bio"]
            avatar = self.cleaned_data.get("avatar")
            if avatar:
                self.profile.avatar = avatar
            if commit:
                self.profile.save(update_fields=["title", "language", "timezone", "default_task_view", "bio", "avatar"])
        return user


class UserAdminUpdateForm(forms.ModelForm):
    role = forms.ChoiceField(choices=[("admin", "Admin"), ("user", "User")], widget=forms.Select(attrs={"class": "form-select"}))
    password = forms.CharField(required=False, widget=forms.PasswordInput(attrs={"class": "form-control"}))

    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "is_active"]
        widgets = {
            "username": forms.TextInput(attrs={"class": "form-control"}),
            "first_name": forms.TextInput(attrs={"class": "form-control"}),
            "last_name": forms.TextInput(attrs={"class": "form-control"}),
        }
