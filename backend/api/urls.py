from django.urls import path

from .views import health, root


urlpatterns = [
    path("", root, name="api-root"),
    path("health/", health, name="api-health"),
]
