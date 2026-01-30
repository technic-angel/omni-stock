from datetime import date

from django.core.management.base import BaseCommand

from backend.catalog.models import Era, Product, Set


class Command(BaseCommand):
    help = 'Seeds catalog reference data (Eras, Sets, Products)'

    def handle(self, *args, **options):
        self.stdout.write("Checking catalog reference data...")
        
        # 1. Eras
        swsh, _ = Era.objects.get_or_create(
            name="Sword & Shield",
            defaults={
                "slug": "swsh",
                "start_year": 2020,
                "end_year": 2023
            }
        )
        sv, _ = Era.objects.get_or_create(
            name="Scarlet & Violet",
            defaults={
                "slug": "sv",
                "start_year": 2023,
                "end_year": 2025
            }
        )

        # 2. Sets
        es, _ = Set.objects.get_or_create(
            code="SWSH07",
            defaults={
                "name": "Evolving Skies",
                "era": swsh,
                "release_date": date(2021, 8, 27),
                "card_count": 203
            }
        )
        
        sf, _ = Set.objects.get_or_create(
             code="SWSH045",
             defaults={
                 "name": "Shining Fates",
                 "era": swsh,
                 "release_date": date(2021, 2, 19),
                 "card_count": 73
             }
        )

        obf, _ = Set.objects.get_or_create(
             code="SV03",
             defaults={
                 "name": "Obsidian Flames",
                 "era": sv,
                 "release_date": date(2023, 8, 11),
                 "card_count": 190
             }
        )

        # 3. Products
        # Evolving Skies Products
        Product.objects.get_or_create(
            name="Evolving Skies Booster Box",
            set=es,
            defaults={
                "type": "booster_box",
                "configuration": {"packs": 36},
                "release_date": date(2021, 8, 27)
            }
        )
        Product.objects.get_or_create(
            name="Evolving Skies Elite Trainer Box",
            set=es,
            defaults={
                "type": "etb",
                "configuration": {"packs": 8},
                "release_date": date(2021, 8, 27)
            }
        )
        
        # Shining Fates Products
        Product.objects.get_or_create(
            name="Shining Fates Elite Trainer Box",
            set=sf,
            defaults={
                "type": "etb",
                "configuration": {"packs": 10},
                "release_date": date(2021, 2, 19)
            }
        )

        # Obsidian Flames Products
        Product.objects.get_or_create(
            name="Obsidian Flames Booster Pack",
            set=obf,
            defaults={
                "type": "booster_pack",
                "configuration": {"packs": 1},
                "release_date": date(2023, 8, 11)
            }
        )

        self.stdout.write(self.style.SUCCESS("✅ Catalog reference data seeded successfully."))
