from rest_framework.routers import DefaultRouter

from .views import CharacterAdminViewSet

router = DefaultRouter(trailing_slash=False)
router.register("", CharacterAdminViewSet, basename="admin-characters")

urlpatterns = router.urls
