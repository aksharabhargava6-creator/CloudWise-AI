from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    odbc_connection: str
    cors_origins: str = "http://localhost:3000"
    seed_data: bool = True


settings = Settings()