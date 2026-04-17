"""Configuration for Style Analysis Service."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Google Gemini API
    gemini_api_key: str
    gemini_model: str = "gemini-pro-vision"
    
    # Service settings
    service_host: str = "0.0.0.0"
    service_port: int = 8001
    
    # Database
    database_url: str
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
