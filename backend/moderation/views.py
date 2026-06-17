from rest_framework.permissions import AllowAny
from rest_framework.viewsets import ModelViewSet

from .models import ForbiddenRule
from .serializers import ForbiddenRuleSerializer


class ForbiddenRuleAdminViewSet(ModelViewSet):
    serializer_class = ForbiddenRuleSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = ForbiddenRule.objects.all()
        is_active = self.request.query_params.get("is_active")
        target = self.request.query_params.get("target")
        severity = self.request.query_params.get("severity")
        rule_type = self.request.query_params.get("rule_type")

        if is_active in {"true", "false"}:
            qs = qs.filter(is_active=is_active == "true")
        if target:
            qs = qs.filter(target=target)
        if severity:
            qs = qs.filter(severity=severity)
        if rule_type:
            qs = qs.filter(rule_type=rule_type)

        return qs

