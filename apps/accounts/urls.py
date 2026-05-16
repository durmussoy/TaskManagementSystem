from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("login/", views.CustomLoginView.as_view(), name="login"),
    path("logout/", views.CustomLogoutView.as_view(), name="logout"),
    path("profile/", views.profile_view, name="profile"),
    path("users/", views.user_list_view, name="user_list"),
    path("users/<int:pk>/edit/", views.user_edit_view, name="user_edit"),
]

