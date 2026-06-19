from django.urls import path

from .views import admin_dashboard, health, root


urlpatterns = [
    path("", root, name="api-root"),
    path("health/", health, name="api-health"),
    path("admin/dashboard", admin_dashboard, name="admin-dashboard"),
    path("admin/dashboard/", admin_dashboard, name="admin-dashboard"),
]
