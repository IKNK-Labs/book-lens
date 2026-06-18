from rest_framework import serializers


class ChatRequestSerializer(serializers.Serializer):
    character_id = serializers.IntegerField(min_value=1)
    user_message = serializers.CharField(allow_blank=False, trim_whitespace=True)
    user_id = serializers.IntegerField(required=False, allow_null=True)
    top_k = serializers.IntegerField(required=False, min_value=1, max_value=10, default=4)


class ChatResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
    category = serializers.ChoiceField(choices=["story", "counseling", "forbidden"])

