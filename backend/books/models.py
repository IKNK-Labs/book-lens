from django.db import models


class Book(models.Model):
    isbn = models.CharField(max_length=20, unique=True, blank=True, null=True)
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    publisher = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "book"
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title


class BookContent(models.Model):
    book = models.OneToOneField(Book, on_delete=models.CASCADE, related_name="content")
    content = models.TextField(blank=True)
    embed_status = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "book_content"

    def __str__(self):
        return f"{self.book.title} - content"
