from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('collectibles', '0020_catalog_variant'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='userprofile',
            name='vendor',
        ),
        migrations.AddField(
            model_name='vendormember',
            name='is_primary',
            field=models.BooleanField(default=False, help_text="Marks this membership as the user's currently selected vendor."),
        ),
    ]
