"""Configuration settings for the photogrammetry service."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""
    
    # Supabase
    supabase_url: str = "http://localhost:54321"
    supabase_service_role_key: str = "test-key"
    
    # Service
    service_port: int = 8001
    service_host: str = "0.0.0.0"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )


settings = Settings()
