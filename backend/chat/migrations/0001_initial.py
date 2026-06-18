import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("characters", "0004_character_profile_image_url_textfield"),
    ]

    operations = [
        migrations.CreateModel(
            name="ConversationLog",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("user_id", models.UUIDField(blank=True, null=True)),
                (
                    "character",
                    models.ForeignKey(
                        db_column="character_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conversation_logs",
                        to="characters.character",
                    ),
                ),
                (
                    "role",
                    models.CharField(
                        choices=[("user", "User"), ("assistant", "Assistant")],
                        max_length=20,
                    ),
                ),
                ("message", models.TextField()),
                ("is_flagged", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "conversation_log",
                "managed": False,
                "ordering": ["created_at"],
            },
        ),
    ]
