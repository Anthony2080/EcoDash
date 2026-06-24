from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("usuarios", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="usuario",
            name="password",
            field=models.CharField(default="pbkdf2_sha256$", max_length=128),
            preserve_default=False,
        ),
    ]
