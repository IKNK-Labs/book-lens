from django.db import models

from books.models import Book


class Character(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="characters")
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    emoji = models.CharField(max_length=10, blank=True, null=True)
    profile_image_url = models.CharField(max_length=500, blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        db_table = "character"
        ordering = ["id"]

    def __str__(self):
        return f"{self.name} ({self.book.title})"


class Persona(models.Model):
    character = models.ForeignKey(
        Character,
        on_delete=models.DO_NOTHING,
        related_name="personas",
        db_column="character_id",
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.DO_NOTHING,
        related_name="personas",
        db_column="book_id",
    )
    greeting_open = models.TextField(blank=True, null=True)
    greeting_close = models.TextField(blank=True, null=True)
    personality = models.TextField(blank=True, null=True)
    speech_style = models.TextField(blank=True, null=True)
    catchphrase = models.TextField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    opening_scene = models.TextField(blank=True, null=True)
    era = models.CharField(max_length=100, blank=True, null=True)
    background = models.TextField(blank=True, null=True)
    user_role = models.CharField(max_length=100, blank=True, null=True)
    user_relationship = models.CharField(max_length=100, blank=True, null=True)
    system_prompt = models.TextField(blank=True, null=True)
    approved_status = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        db_table = "persona"
        managed = False
        ordering = ["id"]

    def __str__(self):
        return f"{self.character.name} persona"
