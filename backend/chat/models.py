from django.db import models


class AppUser(models.Model):
    """Service user linked to Supabase auth.users by auth_user_id."""

    email = models.CharField(max_length=255)
    auth_user_id = models.UUIDField(unique=True)
    nickname = models.CharField(max_length=50)
    created_at = models.DateTimeField()

    class Meta:
        db_table = "app_user"
        managed = False

    def __str__(self):
        return self.email


class UserPreference(models.Model):
    """사용자 맞춤 설정 (Supabase app_user.id 기반, managed=False)."""

    user_id = models.IntegerField(unique=True)  # app_user.id
    difficulty_level = models.CharField(max_length=50, blank=True, null=True)
    response_length = models.CharField(max_length=50, blank=True, null=True)
    age_group = models.CharField(max_length=50, blank=True, null=True)
    explanation_style = models.CharField(max_length=100, blank=True, null=True)
    interests = models.JSONField(default=list, blank=True)
    instruction = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_preference"
        managed = False

    def __str__(self):
        return f"UserPreference(user_id={self.user_id})"


class ConversationLog(models.Model):
    """캐릭터 대화 기록."""

    ROLE_USER = "user"
    ROLE_ASSISTANT = "assistant"
    ROLE_CHOICES = [
        (ROLE_USER, "User"),
        (ROLE_ASSISTANT, "Assistant"),
    ]

    user_id = models.BigIntegerField()
    character_id = models.BigIntegerField()
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    message = models.TextField()
    is_flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "conversation_log"
        managed = False
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.role}] {self.message[:60]}"
