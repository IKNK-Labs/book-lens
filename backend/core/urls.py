"""URL configuration for the book-lens backend."""

from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/books/", include("books.urls")),           # 사용자용
    path("api/admin/books/", include("books.admin_urls")),       # 관리자용
    path("api/admin/characters/", include("characters.admin_urls")),  # 관리자용
]
"""URL configuration for the book-lens backend."""

from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("api/", include("api.urls")),
    path("admin/", admin.site.urls),
]
