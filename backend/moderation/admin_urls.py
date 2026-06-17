from rest_framework.routers import DefaultRouter

from .views import ForbiddenRuleAdminViewSet

router = DefaultRouter(trailing_slash=False)
router.register("", ForbiddenRuleAdminViewSet, basename="admin-forbidden-rules")

urlpatterns = router.urls
