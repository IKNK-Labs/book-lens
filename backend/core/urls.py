"""URL configuration for the book-lens backend."""

from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("api/", include("api.urls")),
    path("api/books/", include("books.urls")),
    path("api/admin/books/", include("books.admin_urls")),
    path("api/admin/characters/", include("characters.admin_urls")),
    path("admin/", admin.site.urls),
]