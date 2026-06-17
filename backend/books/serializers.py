from rest_framework import serializers

from .models import Book, BookContent


class BookContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookContent
        fields = ["content"]


class BookSerializer(serializers.ModelSerializer):
    content = BookContentSerializer(required=False)
    character_count = serializers.SerializerMethodField()
    featured_character_id = serializers.SerializerMethodField()

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
            "featured_character_id",
        ]
        read_only_fields = ["id", "updated_at", "character_count", "featured_character_id"]

    def get_character_count(self, obj):
        annotated_count = getattr(obj, "character_count", None)
        if annotated_count is not None:
            return annotated_count
        return obj.characters.count()

    def get_featured_character_id(self, obj):
        if hasattr(obj, "first_character_id"):
            return obj.first_character_id
        character = obj.characters.order_by("id").first()
        return character.id if character else None

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


class BookVectorSearchRequestSerializer(serializers.Serializer):
    query = serializers.CharField(allow_blank=False, trim_whitespace=True)
    limit = serializers.IntegerField(default=10, min_value=1, max_value=50)


class BookVectorSearchResultSerializer(serializers.Serializer):
    book_id = serializers.IntegerField()
    title = serializers.CharField()
    author = serializers.CharField()
    publisher = serializers.CharField()
    chunk_id = serializers.IntegerField()
    chunk_index = serializers.IntegerField()
    content = serializers.CharField()
    distance = serializers.FloatField()
