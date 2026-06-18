from pathlib import Path
from pydantic_settings import BaseSettings

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    OPENAI_API_KEY: str = "ollama"
    OPENAI_API_BASE: str = "http://localhost:11434/v1"   # new
    OLLAMA_MODEL: str = "llama3.2"                       # new
    TAVILY_API_KEY: str
    SMTP_HOST: str
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str
    FROM_EMAIL: str
    FRONTEND_URL: str = "http://localhost:3000"
    GEMINI_API_KEY : str 

    class Config:
        env_file = str(ENV_FILE)


settings = Settings()