from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./resume_screener.db"
    ANTHROPIC_API_KEY: str = ""
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: list = ["pdf", "doc", "docx"]
    UPLOAD_DIR: str = "uploads"

    # Email settings
    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USER: str = "ashokjamagondiashok@gmail.com"
    EMAIL_PASSWORD: str = "vrnruoplfqxjdshz"
    EMAIL_FROM_NAME: str = "RecruitAI HR Team"
    STRONG_FIT_THRESHOLD: float = 70.0

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()