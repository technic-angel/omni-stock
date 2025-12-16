from django.core.management.base import BaseCommand

from backend.inventory.models import Collectible
from backend.vendors.models import Store, Vendor


class Command(BaseCommand):
    help = "Assign collectibles to their vendor's default store when missing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report planned updates without writing to the database.",
        )

    def handle(self, *, dry_run: bool, **options):
        updated = 0
        missing_store = 0
        store_cache: dict[int, Store] = {}

        qs = Collectible.objects.filter(store__isnull=True, vendor__isnull=False).select_related(
            "vendor"
        )
        for collectible in qs.iterator():
            vendor_id = collectible.vendor_id
            if vendor_id is None:
                continue
            store = store_cache.get(vendor_id)
            if store is None:
                store = Vendor.objects.get(id=vendor_id).stores.order_by("id").first()
                store_cache[vendor_id] = store
            if store is None:
                missing_store += 1
                self.stdout.write(
                    self.style.WARNING(f"Vendor {vendor_id} has no store for collectible {collectible.id}")
                )
                continue
            if dry_run:
                updated += 1
                continue
            collectible.store = store
            collectible.save(update_fields=["store"])
            updated += 1

        status = "DRY-RUN " if dry_run else ""
        self.stdout.write(self.style.SUCCESS(f"{status}Backfill complete. {updated} collectibles processed."))
        if missing_store:
            self.stdout.write(self.style.WARNING(f"{missing_store} collectibles skipped because vendor has no store."))
