"""Tests for moderation admin API permission alignment."""

from django.test import SimpleTestCase
from rest_framework.permissions import AllowAny
from rest_framework.test import APIRequestFactory

from moderation.views import ForbiddenRuleAdminViewSet


class ForbiddenRuleAdminPermissionTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = AllowAny()
        self.view = ForbiddenRuleAdminViewSet()

    def test_forbidden_rule_admin_uses_proxy_guard_aligned_permission(self):
        request = self.factory.get("/api/admin/forbidden-rules")

        self.assertEqual(ForbiddenRuleAdminViewSet.permission_classes, [AllowAny])
        self.assertTrue(self.permission.has_permission(request, self.view))
