from rest_framework.routers import DefaultRouter

from .views import PersonaAdminViewSet

router = DefaultRouter(trailing_slash=False)
router.register("", PersonaAdminViewSet, basename="admin-personas")

urlpatterns = router.urls
