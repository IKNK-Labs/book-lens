import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("books", "0003_bookcontentchunk"),
        ("chat", "0002_userpreference"),
    ]

    operations = [
        migrations.CreateModel(
            name="ConversationFeedback",
            fields=[
                ("id", models.UUIDField(primary_key=True, serialize=False)),
                (
                    "feedback_type",
                    models.CharField(
                        choices=[
                            ("like", "Like"),
                            ("dislike", "Dislike"),
                            ("report", "Report"),
                        ],
                        max_length=20,
                    ),
                ),
                ("reason", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField()),
                (
                    "book",
                    models.ForeignKey(
                        db_column="book_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conversation_feedback",
                        to="books.book",
                    ),
                ),
                (
                    "character",
                    models.ForeignKey(
                        db_column="character_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conversation_feedback",
                        to="characters.character",
                    ),
                ),
                (
                    "conversation_log",
                    models.ForeignKey(
                        db_column="conversation_log_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="feedback",
                        to="chat.conversationlog",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        db_column="user_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conversation_feedback",
                        to="chat.appuser",
                    ),
                ),
            ],
            options={
                "db_table": "conversation_feedback",
                "managed": False,
            },
        ),
        migrations.AddConstraint(
            model_name="conversationfeedback",
            constraint=models.UniqueConstraint(
                fields=("conversation_log", "user"),
                name="conversation_feedback_one_per_user",
            ),
        ),
    ]
