from rest_framework import serializers

from books.models import Book
from .models import Character


class CharacterSerializer(serializers.ModelSerializer):
    book_id = serializers.PrimaryKeyRelatedField(
        source="book", queryset=Book.objects.all()
    )

    class Meta:
        model = Character
        fields = [
            "id", "book_id", "name", "role", "gender",
            "emoji", "description", "profile_image_url", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
