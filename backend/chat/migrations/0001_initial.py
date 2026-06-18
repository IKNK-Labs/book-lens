import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("characters", "0004_character_profile_image_url_textfield"),
    ]

    operations = [
        migrations.CreateModel(
            name="AppUser",
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
                ("email", models.CharField(max_length=255)),
                ("auth_user_id", models.UUIDField(unique=True)),
                ("nickname", models.CharField(max_length=50)),
                ("created_at", models.DateTimeField()),
            ],
            options={
                "db_table": "app_user",
                "managed": False,
            },
        ),
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
                (
                    "user",
                    models.ForeignKey(
                        db_column="user_id",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conversation_logs",
                        to="chat.appuser",
                    ),
                ),
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
