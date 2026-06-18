from __future__ import annotations

import os
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any, Iterator

from django.conf import settings
from django.db import DatabaseError, connection

from books.embeddings import get_embedding
from characters.models import Character, Persona
from moderation.models import ForbiddenRule


DEFAULT_FORBIDDEN_FALLBACK = "미안해요. 그 이야기는 도와줄 수 없어요. 다른 이야기를 함께 해볼까요?"


@dataclass(frozen=True)
class RAGChunk:
    content: str
    distance: float
    chunk_index: int


class ChatbotRepository:
    def load_persona(self, character_id: int) -> dict[str, Any]:
        character = Character.objects.select_related("book").get(id=character_id)
        persona = (
            Persona.objects.select_related("character", "book")
            .filter(character_id=character_id)
            .order_by("id")
            .first()
        )
        data: dict[str, Any] = {
            "character_id": character.id,
            "character_name": character.name,
            "character_role": character.role or "",
            "character_gender": character.gender or "",
            "character_description": character.description or "",
            "book_id": character.book_id,
            "book_title": character.book.title,
        }
        if persona is None:
            return data

        for field in (
            "greeting_open",
            "greeting_close",
            "personality",
            "speech_style",
            "catchphrase",
            "bio",
            "tags",
            "opening_scene",
            "era",
            "background",
            "user_role",
            "user_relationship",
            "system_prompt",
            "approved_status",
        ):
            data[field] = getattr(persona, field)
        return data

    def load_forbidden_rules(self) -> list[dict[str, Any]]:
        return [
            {
                "pattern": rule.pattern,
                "rule_type": rule.rule_type,
                "target": rule.target,
                "severity": rule.severity,
                "category": rule.category,
            }
            for rule in ForbiddenRule.objects.filter(is_active=True)
        ]

    def get_forbidden_fallback(self) -> str:
        return os.environ.get(
            "BOOKLENS_FORBIDDEN_FALLBACK_RESPONSE",
            DEFAULT_FORBIDDEN_FALLBACK,
        )

    def load_user_preference(self, user_id: int | str | None) -> dict[str, Any]:
        if user_id in (None, ""):
            return {}

        sql = """
            SELECT difficulty_level, response_length, age_group,
                   explanation_style, interests, instruction
            FROM user_preference
            WHERE user_id = %s
            LIMIT 1
        """
        try:
            with connection.cursor() as cursor:
                cursor.execute(sql, [user_id])
                row = cursor.fetchone()
        except DatabaseError:
            return {}

        if row is None:
            return {}

        return {
            "difficulty_level": row[0],
            "response_length": row[1],
            "age_group": row[2],
            "explanation_style": row[3],
            "interests": row[4],
            "instruction": row[5],
        }

    def search_character_chunks(
        self,
        *,
        character_id: int,
        query: str,
        top_k: int,
    ) -> list[RAGChunk]:
        try:
            query_embedding = get_embedding(query)
            vector_literal = "[" + ",".join(str(float(value)) for value in query_embedding) + "]"
        except Exception:
            return []

        sql = """
            SELECT bcc.content, (bcc.embedding <=> %s::vector) AS distance, bcc.chunk_index
            FROM book_content_chunk AS bcc
            JOIN book_content AS bc ON bc.id = bcc.book_content_id
            JOIN character AS c ON c.book_id = bc.book_id
            WHERE c.id = %s AND bcc.embedding IS NOT NULL
            ORDER BY bcc.embedding <=> %s::vector, bcc.id
            LIMIT %s
        """
        try:
            with psycopg_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(sql, (vector_literal, character_id, vector_literal, top_k))
                    rows = cursor.fetchall()
        except Exception:
            return []

        return [
            RAGChunk(content=row[0], distance=float(row[1]), chunk_index=int(row[2]))
            for row in rows
        ]

    def save_conversation(
        self,
        *,
        user_id: int | str | None,
        character_id: int,
        user_message: str,
        assistant_message: str,
        is_flagged: bool,
    ) -> None:
        sql = """
            INSERT INTO conversation_log (user_id, character_id, role, message, is_flagged, created_at)
            VALUES (%s, %s, %s, %s, %s, NOW()),
                   (%s, %s, %s, %s, %s, NOW())
        """
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    sql,
                    [
                        user_id,
                        character_id,
                        "user",
                        user_message,
                        is_flagged,
                        user_id,
                        character_id,
                        "assistant",
                        assistant_message,
                        is_flagged,
                    ],
                )
        except DatabaseError:
            return


@contextmanager
def psycopg_connection() -> Iterator[Any]:
    params = settings.DATABASES["default"]
    kwargs = {
        "dbname": params.get("NAME"),
        "user": params.get("USER"),
        "password": params.get("PASSWORD"),
        "host": params.get("HOST"),
        "port": params.get("PORT"),
    }

    try:
        import psycopg2

        conn = psycopg2.connect(**kwargs)
    except ImportError:
        import psycopg

        conn = psycopg.connect(**kwargs)

    try:
        yield conn
    finally:
        conn.close()
