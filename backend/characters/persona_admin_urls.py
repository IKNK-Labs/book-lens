from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import PersonaAdminViewSet, PersonaGenerateView

router = DefaultRouter(trailing_slash=False)
router.register("", PersonaAdminViewSet, basename="admin-personas")

urlpatterns = [
    path("generate", PersonaGenerateView.as_view(), name="admin-personas-generate"),
    *router.urls,
]
