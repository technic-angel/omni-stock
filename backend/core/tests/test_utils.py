from backend.core import utils


def test_build_supabase_media_path_defaults(settings):
    settings.AWS_STORAGE_BUCKET_NAME = "demo-bucket"
    settings.AWS_S3_CUSTOM_DOMAIN = None
    metadata = utils.build_supabase_media_path(entity="avatars", identifier=1, filename="photo.png")

    assert metadata["bucket"] == "demo-bucket"
    assert metadata["path"].startswith("avatars/1/")
    assert metadata["path"].endswith(".png")
    assert "public_url" not in metadata


def test_build_supabase_media_path_with_domain(settings):
    settings.AWS_STORAGE_BUCKET_NAME = "demo"
    settings.AWS_S3_CUSTOM_DOMAIN = "cdn.supabase.co/storage/v1/object/public/demo"

    metadata = utils.build_supabase_media_path(entity="avatars", identifier=None, filename="photo.jpg")
    assert metadata["path"].startswith("avatars/shared/")
    assert metadata["public_url"].startswith("https://cdn.supabase.co/")
