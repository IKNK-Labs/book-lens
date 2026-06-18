from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import BookAdminViewSet, BookGenerateView, BookScanView

router = DefaultRouter(trailing_slash=False)
router.register("", BookAdminViewSet, basename="admin-books")

urlpatterns = [
    path("generate", BookGenerateView.as_view(), name="admin-books-generate"),
    path("scan", BookScanView.as_view(), name="admin-books-scan"),
    *router.urls,
]
