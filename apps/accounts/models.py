from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("user", "User"),
    ]
    LANGUAGE_CHOICES = [
        ("en", "English"),
        ("tr", "Turkish"),
    ]
    TIMEZONE_CHOICES = [
        ("Europe/Istanbul", "Europe/Istanbul"),
        ("UTC", "UTC"),
        ("Europe/London", "Europe/London"),
        ("Europe/Berlin", "Europe/Berlin"),
        ("America/New_York", "America/New_York"),
    ]
    DEFAULT_TASK_VIEW_CHOICES = [
        ("cards", "Cards"),
        ("list", "List"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="user")
    title = models.CharField(max_length=120, blank=True)
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default="en")
    timezone = models.CharField(max_length=64, choices=TIMEZONE_CHOICES, default="Europe/Istanbul")
    default_task_view = models.CharField(max_length=10, choices=DEFAULT_TASK_VIEW_CHOICES, default="cards")
    avatar = models.FileField(upload_to="profiles/", blank=True)
    bio = models.TextField(blank=True)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


@receiver(post_save, sender=User)
def ensure_user_profile(sender, instance, created, **kwargs):
    if created:
        role = "admin" if instance.is_superuser else "user"
        UserProfile.objects.create(user=instance, role=role)
    else:
        UserProfile.objects.get_or_create(
            user=instance,
            defaults={"role": "admin" if instance.is_superuser else "user"},
        )
