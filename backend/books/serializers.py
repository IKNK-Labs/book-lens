from rest_framework import serializers

from .models import Book, BookContent


class BookContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookContent
        fields = ["content"]


class BookSerializer(serializers.ModelSerializer):
    content = BookContentSerializer(required=False, allow_null=True)
    character_count = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id",
            "isbn",
            "title",
            "author",
            "publisher",
            "description",
            "updated_at",
            "content",
            "character_count",
        ]
        read_only_fields = ["id", "updated_at", "character_count"]

    def get_character_count(self, obj):
        return obj.characters.count()

    def to_internal_value(self, data):
        if "content" in data and isinstance(data["content"], str):
            data = data.copy()
            data["content"] = {"content": data["content"]}
        return super().to_internal_value(data)

    def create(self, validated_data):
        content_data = validated_data.pop("content", None)
        book = Book.objects.create(**validated_data)
        if content_data is not None:
            BookContent.objects.create(book=book, **content_data)
        return book

    def update(self, instance, validated_data):
        content_data = validated_data.pop("content", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if content_data is not None:
            content, _created = BookContent.objects.update_or_create(
                book=instance,
                defaults=content_data,
            )
            instance.content = content
            instance._state.fields_cache["content"] = content
        return instance
