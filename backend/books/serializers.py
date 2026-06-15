from rest_framework import serializers

from .models import Book, BookContent


class BookContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookContent
        fields = ["content"]


class BookSerializer(serializers.ModelSerializer):
    content = BookContentSerializer(required=False)

    class Meta:
        model = Book
        fields = ["id", "isbn", "title", "author", "publisher", "description", "updated_at", "content"]
        read_only_fields = ["id", "updated_at"]

    def create(self, validated_data):
        content_data = validated_data.pop("content", None) or {}
        book = Book.objects.create(**validated_data)
        BookContent.objects.create(book=book, **content_data)
        return book

    def update(self, instance, validated_data):
        content_data = validated_data.pop("content", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if content_data is not None:
            BookContent.objects.update_or_create(book=instance, defaults=content_data)
        return instance
