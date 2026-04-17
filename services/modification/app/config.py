"""Configuration for Modification Service."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Settings for modification service."""

    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    service_host: str = "0.0.0.0"
    service_port: int = 8002

    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
