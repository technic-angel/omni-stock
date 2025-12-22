from django.core.management.base import BaseCommand

from backend.org.models import Store, Vendor


class Command(BaseCommand):
    help = "Create a default store for vendors that do not have one yet."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would be created without writing to the database.",
        )

    def handle(self, *, dry_run: bool, **options):
        created = 0
        for vendor in Vendor.objects.all().order_by("id"):
            if vendor.stores.exists():
                continue
            if dry_run:
                created += 1
                self.stdout.write(f"[DRY-RUN] Would create default store for {vendor}")
                continue
            Store.objects.create(
                vendor=vendor,
                name="Default Store",
                metadata={"auto_created": True},
            )
            created += 1
            self.stdout.write(f"Created default store for {vendor}")

        suffix = " (dry-run)" if dry_run else ""
        self.stdout.write(self.style.SUCCESS(f"Default store creation complete{suffix}. {created} stores."))
