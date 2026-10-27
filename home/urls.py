from django.urls import path
from . import api_auth, password_reset, views

urlpatterns = [
    path("", views.student_list, name="student_list"),
    path("students/add/", views.student_create, name="student_create"),
    path("students/<int:pk>/edit/", views.student_update, name="student_update"),
    path("students/<int:pk>/delete/", views.student_delete, name="student_delete"),
    path("login/", views.user_login, name="login"),
    path("logout/", views.user_logout, name="user_logout"),
    path("register/", views.register, name="register"),
    path(
    "forgot-password/",
    views.forgot_password_page,
    name="forgot_password_page",
),
    path("admin-dashboard/", views.admin_dashboard, name="admin_dashboard"),
    path("user-dashboard/", views.user_dashboard, name="user_dashboard"),
    path("api/auth/csrf/", api_auth.csrf_token, name="api_csrf"),
    path("api/auth/register/", api_auth.register_api, name="api_register"),
    path("api/auth/login/", api_auth.login_api, name="api_login"),
    path("api/auth/me/", api_auth.current_user, name="api_current_user"),
    path("api/auth/logout/", api_auth.logout_api, name="api_logout"),
    path("api/auth/forgot-password/", password_reset.ForgotPasswordView.as_view(), name="api_forgot_password"),
    path("api/auth/verify-otp/", password_reset.VerifyOtpView.as_view(), name="api_verify_otp"),
    path("api/auth/reset-password/status/", password_reset.ResetAuthorizationStatusView.as_view(), name="api_reset_authorization_status"),
    path("api/auth/reset-password/", password_reset.ResetPasswordView.as_view(), name="api_reset_password"),
    path("api/students/", views.student_api, name="student_api"),
    path("api/students/<int:pk>/", views.student_detail_api, name="student_detail_api"),
]
