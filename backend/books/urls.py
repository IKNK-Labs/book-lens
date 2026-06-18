from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import BookCharactersView, BookVectorSearchView, BookViewSet

router = DefaultRouter(trailing_slash=False)
router.register("", BookViewSet, basename="books")

urlpatterns = [
    path("vector-search", BookVectorSearchView.as_view(), name="books-vector-search"),
    path("<int:pk>/characters", BookCharactersView.as_view(), name="book-characters"),
    *router.urls,
]
