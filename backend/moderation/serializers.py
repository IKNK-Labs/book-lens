from rest_framework import serializers

from .models import ForbiddenRule


class ForbiddenRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForbiddenRule
        fields = [
            "id",
            "pattern",
            "rule_type",
            "description",
            "severity",
            "target",
            "category",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_pattern(self, value):
        if not value.strip():
            raise serializers.ValidationError("pattern is required.")
        return value.strip()
