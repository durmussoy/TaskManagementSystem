from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse


class AccountViewsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="regular", password="123456")
        self.admin = User.objects.create_superuser(username="admincase", password="123456", email="admin@example.com")
        self.client = Client()

    def test_profile_requires_login(self):
        response = self.client.get(reverse("accounts:profile"))
        self.assertEqual(response.status_code, 302)

    def test_profile_update_saves_preferences(self):
        self.client.force_login(self.user)
        response = self.client.post(
            reverse("accounts:profile"),
            {
                "username": "regular",
                "first_name": "Regular",
                "last_name": "User",
                "email": "regular@example.com",
                "title": "Operations Lead",
                "language": "tr",
                "timezone": "Europe/Istanbul",
                "default_task_view": "list",
                "bio": "Keeps work moving.",
            },
        )
        self.user.refresh_from_db()
        self.user.profile.refresh_from_db()

        self.assertEqual(response.status_code, 302)
        self.assertEqual(self.user.first_name, "Regular")
        self.assertEqual(self.user.email, "regular@example.com")
        self.assertEqual(self.user.profile.title, "Operations Lead")
        self.assertEqual(self.user.profile.language, "tr")
        self.assertEqual(self.user.profile.timezone, "Europe/Istanbul")
        self.assertEqual(self.user.profile.default_task_view, "list")
        self.assertEqual(self.user.profile.bio, "Keeps work moving.")

    def test_user_list_requires_admin_role(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse("accounts:user_list"))
        self.assertEqual(response.status_code, 302)

        self.client.force_login(self.admin)
        response = self.client.get(reverse("accounts:user_list"))
        self.assertEqual(response.status_code, 200)
