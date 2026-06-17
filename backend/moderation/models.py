import uuid

from django.db import models


class ForbiddenRule(models.Model):
    RULE_TYPE_WORD = "word"
    RULE_TYPE_PHRASE = "phrase"
    RULE_TYPE_REGEX = "regex"
    RULE_TYPE_CHOICES = [
        (RULE_TYPE_WORD, "Word"),
        (RULE_TYPE_PHRASE, "Phrase"),
        (RULE_TYPE_REGEX, "Regex"),
    ]

    SEVERITY_BLOCK = "block"
    SEVERITY_WARN = "warn"
    SEVERITY_INFO = "info"
    SEVERITY_CHOICES = [
        (SEVERITY_BLOCK, "Block"),
        (SEVERITY_WARN, "Warn"),
        (SEVERITY_INFO, "Info"),
    ]

    TARGET_USER_INPUT = "user_input"
    TARGET_BOT_OUTPUT = "bot_output"
    TARGET_BOTH = "both"
    TARGET_CHOICES = [
        (TARGET_USER_INPUT, "User input"),
        (TARGET_BOT_OUTPUT, "Bot output"),
        (TARGET_BOTH, "Both"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pattern = models.TextField()
    rule_type = models.CharField(max_length=20, choices=RULE_TYPE_CHOICES)
    description = models.TextField(blank=True, null=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default=SEVERITY_WARN)
    target = models.CharField(max_length=20, choices=TARGET_CHOICES, default=TARGET_BOTH)
    category = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "forbidden_rules"
        managed = False
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.pattern} ({self.rule_type})"
