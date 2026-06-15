from rest_framework.routers import DefaultRouter

from .views import BookAdminViewSet

router = DefaultRouter(trailing_slash=False)
router.register("", BookAdminViewSet, basename="admin-books")

urlpatterns = router.urls
