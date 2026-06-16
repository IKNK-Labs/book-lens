from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CharacterAdminViewSet, CharacterGenerateView

router = DefaultRouter(trailing_slash=False)
router.register("", CharacterAdminViewSet, basename="admin-characters")

urlpatterns = [
    path("generate", CharacterGenerateView.as_view(), name="admin-characters-generate"),
    *router.urls,
]
