from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import BookVectorSearchView, BookViewSet

router = DefaultRouter(trailing_slash=False)
router.register("", BookViewSet, basename="books")

urlpatterns = [
    path("vector-search", BookVectorSearchView.as_view(), name="books-vector-search"),
    *router.urls,
]
