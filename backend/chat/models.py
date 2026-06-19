from django.db import models

from books.models import Book
from characters.models import Character


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


class ConversationFeedback(models.Model):
    """User reaction for a chatbot answer."""

    FEEDBACK_LIKE = "like"
    FEEDBACK_DISLIKE = "dislike"
    FEEDBACK_REPORT = "report"
    FEEDBACK_CHOICES = [
        (FEEDBACK_LIKE, "Like"),
        (FEEDBACK_DISLIKE, "Dislike"),
        (FEEDBACK_REPORT, "Report"),
    ]

    id = models.UUIDField(primary_key=True)
    conversation_log = models.ForeignKey(
        ConversationLog,
        on_delete=models.CASCADE,
        related_name="feedback",
        db_column="conversation_log_id",
    )
    user = models.ForeignKey(
        AppUser,
        on_delete=models.CASCADE,
        related_name="conversation_feedback",
        db_column="user_id",
    )
    character = models.ForeignKey(
        Character,
        on_delete=models.CASCADE,
        related_name="conversation_feedback",
        db_column="character_id",
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name="conversation_feedback",
        db_column="book_id",
    )
    feedback_type = models.CharField(max_length=20, choices=FEEDBACK_CHOICES)
    reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField()

    class Meta:
        db_table = "conversation_feedback"
        managed = False
        constraints = [
            models.UniqueConstraint(
                fields=["conversation_log", "user"],
                name="conversation_feedback_one_per_user",
            ),
        ]

    def __str__(self):
        return f"{self.feedback_type} for log {self.conversation_log_id}"
