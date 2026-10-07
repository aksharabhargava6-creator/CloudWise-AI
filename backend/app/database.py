from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings

engine = create_engine(
    "mssql+pyodbc:///?odbc_connect=" + quote_plus(settings.odbc_connection),
    pool_pre_ping=True,
    fast_executemany=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Creates the cloud_resources table automatically if it doesn't exist
    Base.metadata.create_all(engine)