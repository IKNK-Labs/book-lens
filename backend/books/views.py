from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from .models import Book, BookContent
from .serializers import BookContentSerializer, BookSerializer


class BookAdminViewSet(ModelViewSet):
    """관리자용 - 목록/등록/수정/삭제
    TODO: 백엔드 인증 구현 후 AllowAny → IsAdminUser 로 교체
    """
    queryset = Book.objects.select_related("content").all()
    serializer_class = BookSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    filter_backends = [SearchFilter]
    search_fields = ["title", "author", "publisher", "isbn", "description"]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        fresh_instance = self.get_queryset().get(pk=serializer.instance.pk)
        data = self.get_serializer(fresh_instance).data
        content = BookContent.objects.filter(book=fresh_instance).first()
        data["content"] = BookContentSerializer(content).data if content else None
        if "content" in request.data:
            request_content = request.data["content"]
            if isinstance(request_content, dict):
                request_content = request_content.get("content", "")
            data["content"] = {"content": request_content}
        return Response(data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)


class BookViewSet(ReadOnlyModelViewSet):
    """사용자용 - 목록/상세 조회"""
    queryset = Book.objects.select_related("content").all()
    serializer_class = BookSerializer
    permission_classes = [AllowAny]
    filter_backends = [SearchFilter]
    search_fields = ["title", "author", "publisher", "isbn", "description"]
