"""Tests for book list, detail, admin CRUD, and text search APIs."""

from unittest.mock import patch

from rest_framework import status
from rest_framework.test import APITestCase

from characters.models import Character, Persona

from books.models import Book, BookContent
from books.services import RebuildResult


class BookApiTests(APITestCase):
    def setUp(self):
        self.book = Book.objects.create(
            isbn="9780000000001",
            title="Snow White",
            author="Brothers Grimm",
            publisher="Fairy Press",
            description="A princess meets seven friends in the forest.",
        )
        BookContent.objects.create(
            book=self.book,
            content="Once upon a time there was a kind princess.",
            embed_status="completed",
        )
        self.character = Character.objects.create(book=self.book, name="Snow White")

    def payload(self, suffix="2", **overrides):
        data = {
            "isbn": f"978000000000{suffix}",
            "title": f"Cinderella {suffix}",
            "author": "Charles Perrault",
            "publisher": "Story House",
            "description": "A kind girl finds courage and hope.",
            "content": "A full story content body.",
        }
        data.update(overrides)
        return data

    def test_user_books_list_success(self):
        response = self.client.get("/api/books")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertIn("character_count", response.data[0])
        self.assertIn("featured_character_id", response.data[0])

    def test_user_book_detail_success(self):
        response = self.client.get(f"/api/books/{self.book.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.book.id)
        self.assertEqual(response.data["content"]["content"], self.book.content.content)
        self.assertEqual(response.data["featured_character_id"], self.character.id)

    def test_missing_user_book_returns_404(self):
        response = self.client.get("/api/books/999999")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_books_list_success(self):
        response = self.client.get("/api/admin/books")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["content"]["embed_status"], "completed")

    def test_admin_book_create_success_and_creates_content(self):
        response = self.client.post("/api/admin/books", self.payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = Book.objects.get(id=response.data["id"])
        self.assertEqual(created.content.content, "A full story content body.")

    def test_admin_book_detail_success(self):
        response = self.client.get(f"/api/admin/books/{self.book.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], self.book.title)

    def test_admin_book_patch_success_and_updates_content(self):
        response = self.client.patch(
            f"/api/admin/books/{self.book.id}",
            {"title": "Snow White Revised", "content": "Updated story content."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.book.refresh_from_db()
        self.assertEqual(self.book.title, "Snow White Revised")
        self.assertEqual(self.book.content.content, "Updated story content.")
        self.assertEqual(response.data["content"]["content"], "Updated story content.")
        self.assertEqual(response.data["content"]["embed_status"], "")

    def test_admin_book_embed_rebuilds_only_requested_book(self):
        other_book = Book.objects.create(
            isbn="9780000000099",
            title="Other Book",
            author="Other Author",
            publisher="Other Press",
            description="Another story.",
        )
        BookContent.objects.create(book=other_book, content="Other content.")

        def mark_completed(book_content):
            book_content.embed_status = "completed"
            book_content.save(update_fields=["embed_status", "updated_at"])
            return RebuildResult(
                book_content_id=book_content.id,
                chunk_count=1,
                embed_status="completed",
            )

        with patch("books.views.rebuild_book_content_chunks", side_effect=mark_completed) as rebuild:
            response = self.client.post(f"/api/admin/books/{self.book.id}/embed")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["content"]["embed_status"], "completed")
        self.assertEqual(response.data["embedding"]["chunk_count"], 1)
        rebuild.assert_called_once()
        self.assertEqual(rebuild.call_args.args[0].book_id, self.book.id)

    def test_admin_book_embed_without_content_returns_400(self):
        book = Book.objects.create(
            isbn="9780000000088",
            title="No Content",
            author="Story Keeper",
            publisher="Empty Press",
            description="No body yet.",
        )

        response = self.client.post(f"/api/admin/books/{book.id}/embed")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_book_patch_null_content_returns_400_and_keeps_content(self):
        original_content = self.book.content.content

        response = self.client.patch(
            f"/api/admin/books/{self.book.id}",
            {"content": None},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.book.refresh_from_db()
        self.assertEqual(self.book.content.content, original_content)

    def test_admin_book_delete_success(self):
        book = Book.objects.create(
            isbn="9780000000005",
            title="Delete Me",
            author="Story Keeper",
            publisher="Cleanup Press",
            description="A short-lived test book.",
        )

        response = self.client.delete(f"/api/admin/books/{book.id}")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Book.objects.filter(id=book.id).exists())

    def test_admin_book_delete_with_persona_success(self):
        book = Book.objects.create(
            isbn="9780000000006",
            title="Delete Me With Persona",
            author="Story Keeper",
            publisher="Cleanup Press",
            description="A test book with a persona.",
        )
        character = Character.objects.create(book=book, name="Delete Character")
        Persona.objects.create(book=book, character=character)

        response = self.client.delete(f"/api/admin/books/{book.id}")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Book.objects.filter(id=book.id).exists())
        self.assertFalse(Persona.objects.filter(book_id=book.id).exists())

    def test_admin_book_required_field_missing_returns_400(self):
        response = self.client.post(
            "/api/admin/books",
            self.payload(title=""),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)

    def test_user_books_search_success(self):
        Book.objects.create(
            isbn="9780000000003",
            title="The Little Prince",
            author="Antoine de Saint-Exupery",
            publisher="Star Press",
            description="A story about a prince and a fox.",
        )

        response = self.client.get("/api/books", {"search": "Exupery"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "The Little Prince")

    def test_admin_books_search_success(self):
        Book.objects.create(
            isbn="9780000000004",
            title="Red Riding Hood",
            author="Brothers Grimm",
            publisher="Forest Press",
            description="A story with a red hood and a forest path.",
        )

        response = self.client.get("/api/admin/books", {"search": "Riding"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["publisher"], "Forest Press")
