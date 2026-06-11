"""URL configuration for the book-lens backend."""

from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("api/", include("api.urls")),
    path("admin/", admin.site.urls),
]
