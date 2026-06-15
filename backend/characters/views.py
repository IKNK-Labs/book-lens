from rest_framework.permissions import AllowAny
from rest_framework.viewsets import ModelViewSet

from .models import Character
from .serializers import CharacterSerializer


class CharacterAdminViewSet(ModelViewSet):
    serializer_class = CharacterSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = Character.objects.all()
        book_id = self.request.query_params.get("book_id")
        if book_id:
            qs = qs.filter(book_id=book_id)
        return qs
