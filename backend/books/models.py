from django.db import models
from pgvector.django import HnswIndex, VectorField


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


class BookContentChunk(models.Model):
    book_content = models.ForeignKey(
        BookContent,
        on_delete=models.CASCADE,
        related_name="chunks",
    )
    chunk_index = models.PositiveIntegerField()
    content = models.TextField()
    embedding = VectorField(dimensions=1024, null=True, blank=True)
    embed_status = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "book_content_chunk"
        ordering = ["book_content_id", "chunk_index"]
        constraints = [
            models.UniqueConstraint(
                fields=["book_content", "chunk_index"],
                name="unique_book_content_chunk_index",
            ),
        ]
        indexes = [
            HnswIndex(
                name="bcc_embedding_hnsw",
                fields=["embedding"],
                m=16,
                ef_construction=64,
                opclasses=["vector_cosine_ops"],
            ),
        ]

    def __str__(self):
        return f"{self.book_content.book.title} - chunk {self.chunk_index}"
