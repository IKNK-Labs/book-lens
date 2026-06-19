"""URL configuration for the book-lens backend."""

from django.contrib import admin
from django.urls import include, path, re_path


urlpatterns = [
    path("api/", include("api.urls")),
    re_path(r"^api/chat/?", include("chat.urls")),
    re_path(r"^api/books/?", include("books.urls")),
    re_path(r"^api/admin/books/?", include("books.admin_urls")),
    re_path(r"^api/admin/characters/?", include("characters.admin_urls")),
    re_path(r"^api/admin/personas/?", include("characters.persona_admin_urls")),
    re_path(r"^api/admin/forbidden-rules/?", include("moderation.admin_urls")),
    path("admin/", admin.site.urls),
]
