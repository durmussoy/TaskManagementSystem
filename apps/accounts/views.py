from django.contrib import messages
from django.contrib.auth import views as auth_views
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404, redirect, render

from .forms import LoginForm, ProfileForm, UserAdminUpdateForm


class CustomLoginView(auth_views.LoginView):
    template_name = "accounts/login.html"
    authentication_form = LoginForm
    redirect_authenticated_user = True


class CustomLogoutView(auth_views.LogoutView):
    next_page = "accounts:login"


def is_admin(user):
    return user.is_authenticated and getattr(getattr(user, "profile", None), "role", "user") == "admin"


@login_required
def profile_view(request):
    profile = request.user.profile
    if request.method == "POST":
        form = ProfileForm(request.POST, request.FILES, instance=request.user, profile=profile)
        if form.is_valid():
            form.save()
            messages.success(request, "Profile updated.")
            return redirect("accounts:profile")
    else:
        form = ProfileForm(instance=request.user, profile=profile)
    return render(request, "accounts/profile.html", {"form": form, "profile": profile, "page_title": "Profile"})


@user_passes_test(is_admin)
def user_list_view(request):
    users = User.objects.select_related("profile").order_by("username")
    return render(request, "accounts/user_list.html", {"users": users, "page_title": "Users"})


@user_passes_test(is_admin)
def user_edit_view(request, pk):
    target_user = get_object_or_404(User.objects.select_related("profile"), pk=pk)
    if request.method == "POST":
        form = UserAdminUpdateForm(request.POST, instance=target_user)
        if form.is_valid():
            user = form.save()
            if form.cleaned_data["password"]:
                user.set_password(form.cleaned_data["password"])
                user.save(update_fields=["password"])
            user.profile.role = form.cleaned_data["role"]
            user.profile.save(update_fields=["role"])
            messages.success(request, f'User "{user.username}" updated.')
            return redirect("accounts:user_list")
    else:
        initial = {"role": target_user.profile.role}
        form = UserAdminUpdateForm(instance=target_user, initial=initial)
    return render(
        request,
        "accounts/user_form.html",
        {"form": form, "target_user": target_user, "page_title": f"Edit {target_user.username}"},
    )
