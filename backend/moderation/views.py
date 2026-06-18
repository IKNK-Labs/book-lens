from django.db import connection
from rest_framework.exceptions import APIException
from rest_framework.permissions import IsAdminUser
from rest_framework.viewsets import ModelViewSet

from .models import ForbiddenRule
from .serializers import ForbiddenRuleSerializer


class ForbiddenRulesTableUnavailable(APIException):
    status_code = 503
    default_detail = "forbidden_rules table is not configured."
    default_code = "forbidden_rules_unavailable"


def forbidden_rules_table_exists():
    return ForbiddenRule._meta.db_table in connection.introspection.table_names()


class ForbiddenRuleAdminViewSet(ModelViewSet):
    serializer_class = ForbiddenRuleSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if not forbidden_rules_table_exists():
            raise ForbiddenRulesTableUnavailable()

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
