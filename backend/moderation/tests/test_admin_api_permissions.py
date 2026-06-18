"""Tests for moderation admin API permissions."""

from django.contrib.auth.models import AnonymousUser, User
from django.test import SimpleTestCase
from rest_framework.permissions import IsAdminUser
from rest_framework.test import APIRequestFactory

from moderation.views import ForbiddenRuleAdminViewSet


class ForbiddenRuleAdminPermissionTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = IsAdminUser()
        self.view = ForbiddenRuleAdminViewSet()

    def test_forbidden_rule_admin_rejects_anonymous_users(self):
        request = self.factory.get("/api/admin/forbidden-rules")
        request.user = AnonymousUser()

        self.assertFalse(self.permission.has_permission(request, self.view))

    def test_forbidden_rule_admin_rejects_non_staff_users(self):
        request = self.factory.post("/api/admin/forbidden-rules", {}, format="json")
        request.user = User(username="regular", is_staff=False)

        self.assertFalse(self.permission.has_permission(request, self.view))

    def test_forbidden_rule_admin_allows_staff_users(self):
        request = self.factory.get("/api/admin/forbidden-rules")
        request.user = User(username="admin", is_staff=True)

        self.assertTrue(self.permission.has_permission(request, self.view))
