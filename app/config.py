from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Plagiarism Detector API"
    version: str = "1.0.0"
    database_url: str = "sqlite:///./plagiarism.db"
    ngram_size: int = 5
    window_size: int = 4
    similarity_threshold: float = 0.10  # min similarity to include in results

    model_config = {"env_file": ".env"}


settings = Settings()
