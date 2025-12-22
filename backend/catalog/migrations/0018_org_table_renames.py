from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('collectibles', '0017_vendormember_active_store'),
    ]

    operations = [
        migrations.AlterModelTable(
            name='vendor',
            table='org_vendor',
        ),
        migrations.AlterModelTable(
            name='vendormember',
            table='org_membership',
        ),
        migrations.AlterModelTable(
            name='store',
            table='org_store',
        ),
        migrations.AlterModelTable(
            name='storeaccess',
            table='org_store_access',
        ),
    ]
