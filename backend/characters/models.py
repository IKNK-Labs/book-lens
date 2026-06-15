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
