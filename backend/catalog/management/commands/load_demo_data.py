import random
from decimal import Decimal

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Load demo vendor and sample collectibles for local development and frontend testing"

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=20, help='Number of collectibles to create')
        parser.add_argument('--overwrite', action='store_true', help='Overwrite existing demo vendor if present')

    def handle(self, *args, **options):
        from django.contrib.auth import get_user_model

        from backend.catalog.models import CardMetadata, CatalogItem
        from backend.users.models import UserProfile
        from backend.org.models import Vendor
        from backend.org.services.memberships import ensure_owner_membership
        from backend.org.services.store_defaults import ensure_default_store

        try:
            from faker import Faker
            fake = Faker()
            use_faker = True
        except ImportError:
            fake = None
            use_faker = False
            self.stdout.write(self.style.WARNING('Faker not installed. Using simple demo data. Install with: pip install faker'))

        User = get_user_model()

        count = options['count']
        overwrite = options['overwrite']

        demo_username = 'demo_vendor'
        demo_email = 'demo@example.com'
        demo_password = 'demo'

        # Realistic categories for collectibles
        CATEGORIES = [
            "Trading Cards",
            "Video Games",
            "Vinyl Records",
            "Action Figures",
            "Comics",
            "Sports Memorabilia",
            "Vintage Toys",
            "Board Games"
        ]

        CONDITIONS = ["Mint", "Near Mint", "Excellent", "Good", "Fair", "Played"]
        
        # Card-specific data
        CARD_LANGUAGES = ["English", "Japanese", "Korean", "German", "French", "Spanish"]
        PRINT_RUNS = ["First Edition", "Limited Edition", "Unlimited", "Promo", "Special Release"]

        user, created = User.objects.get_or_create(username=demo_username, defaults={'email': demo_email})
        if created:
            user.set_password(demo_password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created demo user: {demo_username}'))

        vendor, vcreated = Vendor.objects.get_or_create(
            name='Demo Vendor', 
            defaults={'contact_info': 'demo@omnistock.example.com'}
        )
        default_store = ensure_default_store(vendor)
        
        # Ensure user has profile and vendor membership
        UserProfile.objects.get_or_create(user=user)
        ensure_owner_membership(vendor=vendor, user=user)
        
        if overwrite and not vcreated:
            deleted_count = CatalogItem.objects.filter(vendor=vendor).delete()[0]
            self.stdout.write(self.style.WARNING(f'Deleted {deleted_count} existing demo collectibles'))

        # Create sample collectibles with realistic data
        created_items = []
        for i in range(count):
            sku = f"DEMO-{i+1:03d}"
            category = random.choice(CATEGORIES)
            condition = random.choice(CONDITIONS)
            
            # Generate realistic names based on category
            if use_faker:
                if category == "Trading Cards":
                    name = f"{fake.first_name()} {fake.word().title()} Card"
                elif category == "Video Games":
                    name = f"{fake.word().title()} {fake.word().title()}"
                elif category == "Vinyl Records":
                    name = f"{fake.last_name()} - {fake.catch_phrase()}"
                else:
                    name = f"{fake.word().title()} {fake.word().title()} {category}"
                description = fake.text(max_nb_chars=150)
            else:
                name = f'Demo {category} Item {i+1}'
                description = f'Demo item for testing frontend. Category: {category}'

            # Realistic pricing
            intake_price = Decimal(random.uniform(5.00, 100.00)).quantize(Decimal('0.01'))
            markup = Decimal(random.uniform(1.2, 2.5))
            price = (intake_price * markup).quantize(Decimal('0.01'))
            projected_price = (price * Decimal(random.uniform(1.05, 1.3))).quantize(Decimal('0.01'))

            c, item_created = CatalogItem.objects.get_or_create(sku=sku, defaults={
                'name': name,
                'user': user,
                'vendor': vendor,
                'store': default_store,
                'quantity': random.randint(1, 15),
                'category': category,
                'condition': condition,
                'intake_price': intake_price,
                'price': price,
                'projected_price': projected_price,
                'description': description,
                'image_url': f'https://picsum.photos/seed/{sku}/400/300',  # Placeholder images
            })
            
            if item_created:
                created_items.append(c)
            elif c.store_id is None:
                c.store = default_store
                c.save(update_fields=["store"])

            # Create card details for Trading Cards category when missing
            has_card_metadata = False
            try:
                if getattr(c, "card_metadata", None):
                    has_card_metadata = True
            except (CardMetadata.DoesNotExist, AttributeError):
                has_card_metadata = False

            if category == "Trading Cards" and not has_card_metadata:
                CardMetadata.objects.create(
                    item=c,
                    psa_grade=Decimal(random.choice([8.0, 8.5, 9.0, 9.5, 10.0])) if random.random() > 0.3 else None,
                    condition=condition,
                    language=random.choice(CARD_LANGUAGES),
                    print_run=random.choice(PRINT_RUNS),
                    notes=f"Demo card details for {name}" if use_faker else "Demo card for testing"
                )

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Demo Data Loaded Successfully!\n'
            f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
            f'Created/updated: {len(created_items)} collectibles\n'
            f'Vendor: Demo Vendor\n'
            f'Username: {demo_username}\n'
            f'Password: {demo_password}\n'
            f'Categories: {", ".join(CATEGORIES)}\n'
            f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
            f'Use these credentials to test the frontend!\n'
        ))
