from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from .models import Book
from .serializers import BookSerializer


class BookAdminViewSet(ModelViewSet):
    """관리자용 - 목록/등록/수정/삭제
    TODO: 백엔드 인증 구현 후 AllowAny → IsAdminUser 로 교체
    """
    queryset = Book.objects.select_related("content").all()
    serializer_class = BookSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]


class BookViewSet(ReadOnlyModelViewSet):
    """사용자용 - 목록/상세 조회"""
    queryset = Book.objects.select_related("content").all()
    serializer_class = BookSerializer
    permission_classes = [AllowAny]
