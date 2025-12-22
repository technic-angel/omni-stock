from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('collectibles', '0019_catalog_model_renames'),
    ]

    operations = [
        migrations.CreateModel(
            name='CatalogVariant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('condition', models.CharField(blank=True, help_text='Condition label for this variant (e.g., PSA 10, Raw).', max_length=100, null=True)),
                ('grade', models.CharField(blank=True, help_text='Optional grading authority label.', max_length=50, null=True)),
                ('quantity', models.PositiveIntegerField(default=0)),
                ('price_adjustment', models.DecimalField(decimal_places=2, default=0, help_text='Adjustment applied relative to the base item price.', max_digits=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('item', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='variants', to='collectibles.catalogitem')),
            ],
            options={
                'db_table': 'catalog_variant',
                'unique_together': {('item', 'condition', 'grade')},
            },
        ),
    ]
