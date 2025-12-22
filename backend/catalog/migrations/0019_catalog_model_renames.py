from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('collectibles', '0018_org_table_renames'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Collectible',
            new_name='CatalogItem',
        ),
        migrations.RenameModel(
            old_name='CardDetails',
            new_name='CardMetadata',
        ),
        migrations.RenameModel(
            old_name='InventoryMedia',
            new_name='CatalogMedia',
        ),
        migrations.RenameField(
            model_name='cardmetadata',
            old_name='collectible',
            new_name='item',
        ),
        migrations.RenameField(
            model_name='stockledger',
            old_name='collectible',
            new_name='item',
        ),
        migrations.AlterModelTable(
            name='catalogitem',
            table='catalog_item',
        ),
        migrations.AlterModelTable(
            name='cardmetadata',
            table='catalog_card_metadata',
        ),
        migrations.AlterModelTable(
            name='catalogmedia',
            table='catalog_media',
        ),
    ]
