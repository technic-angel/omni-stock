from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Load demo vendor and sample collectibles for local development"

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=5, help='Number of collectibles to create')
        parser.add_argument('--overwrite', action='store_true', help='Overwrite existing demo vendor if present')

    def handle(self, *args, **options):
        from collectibles.models import Vendor, Collectible, CardDetails
        from django.contrib.auth import get_user_model
        User = get_user_model()

        count = options['count']
        overwrite = options['overwrite']

        demo_username = 'demo_vendor'
        demo_email = 'demo@example.com'
        demo_password = 'demo'

        user, created = User.objects.get_or_create(username=demo_username, defaults={'email': demo_email})
        if created:
            user.set_password(demo_password)
            user.save()

        vendor, vcreated = Vendor.objects.get_or_create(name='Demo Vendor', defaults={'contact_info': ''})
        if overwrite and not vcreated:
            # optional: wipe existing demo collectibles
            Collectible.objects.filter(vendor=vendor).delete()

        # create sample collectibles
        for i in range(count):
            sku = f"DEMO-{i+1:03d}"
            c, _ = Collectible.objects.get_or_create(sku=sku, defaults={
                'name': f'Demo Card {i+1}',
                'user': user,
                'vendor': vendor,
                'quantity': 1,
                'description': 'Demo item created by load_demo_data',
            })
            # create card details if missing
            if not hasattr(c, 'card_details'):
                CardDetails.objects.create(collectible=c)

        self.stdout.write(self.style.SUCCESS(f'Created/updated demo vendor and {count} collectibles. Username: {demo_username} Password: {demo_password}'))
