from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("characters", "0003_persona_cascade"),
    ]

    operations = [
        migrations.AlterField(
            model_name="character",
            name="profile_image_url",
            field=models.TextField(blank=True, null=True),
        ),
    ]
