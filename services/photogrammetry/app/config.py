"""Configuration settings for the photogrammetry service."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    # PostgreSQL
    database_url: str = (
        "postgresql://app_user:password@localhost:5432/reality_digitizer_3d"
    )

    # Yandex Object Storage
    yc_storage_region: str = "ru-central1"
    yc_storage_endpoint: str = "https://storage.yandexcloud.net"
    yc_storage_bucket: str = ""
    yc_storage_access_key: str = ""
    yc_storage_secret_key: str = ""
    yc_storage_public_url: str = ""

    # Service
    service_port: int = 8001
    service_host: str = "0.0.0.0"

    # Photogrammetry runtime
    colmap_bin: str = "colmap"
    photogrammetry_matcher: str = "exhaustive"
    photogrammetry_timeout_seconds: int = 1800
    photogrammetry_max_image_size: int = 2000
    photogrammetry_keep_temp_files: bool = False

    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=False, extra="ignore"
    )


settings = Settings()
