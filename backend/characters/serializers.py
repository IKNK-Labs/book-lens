from rest_framework import serializers

from books.models import Book
from .models import Character, Persona


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


class PersonaSerializer(serializers.ModelSerializer):
    character_id = serializers.PrimaryKeyRelatedField(
        source="character", queryset=Character.objects.all()
    )
    book_id = serializers.PrimaryKeyRelatedField(
        source="book", queryset=Book.objects.all()
    )

    class Meta:
        model = Persona
        fields = [
            "id",
            "character_id",
            "book_id",
            "greeting_open",
            "greeting_close",
            "personality",
            "speech_style",
            "catchphrase",
            "bio",
            "tags",
            "opening_scene",
            "era",
            "background",
            "user_role",
            "user_relationship",
            "system_prompt",
            "approved_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        character = attrs.get("character") or getattr(self.instance, "character", None)
        book = attrs.get("book") or getattr(self.instance, "book", None)

        if character and book and character.book_id != book.id:
            raise serializers.ValidationError(
                {"book_id": "캐릭터가 속한 동화책과 일치해야 합니다."}
            )

        return attrs
