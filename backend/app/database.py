from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DEFAULT_SQLITE_PATH = Path(__file__).resolve().parents[1] / "data" / "reports.db"


class Base(DeclarativeBase):
    pass


def get_database_url() -> str:
    configured = os.getenv("DATABASE_URL", "").strip()
    if configured:
        return configured

    DEFAULT_SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{DEFAULT_SQLITE_PATH}"


@lru_cache(maxsize=1)
def get_engine():
    database_url = get_database_url()
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    return create_engine(
        database_url,
        future=True,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


@lru_cache(maxsize=1)
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), autoflush=False, autocommit=False, expire_on_commit=False)


def get_db_session() -> Generator[Session, None, None]:
    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()


def initialize_database() -> None:
    from app import lead_entities  # noqa: F401
    from app import report_entities  # noqa: F401

    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    ensure_reports_schema(engine)


def ensure_reports_schema(engine) -> None:
    inspector = inspect(engine)
    if "reports" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("reports")}
    missing_column_statements = {
        "scenario_id": "ALTER TABLE reports ADD COLUMN scenario_id VARCHAR(200)",
        "status": "ALTER TABLE reports ADD COLUMN status VARCHAR(24)",
        "source_label": "ALTER TABLE reports ADD COLUMN source_label VARCHAR(120)",
        "session_id": "ALTER TABLE reports ADD COLUMN session_id VARCHAR(200)",
        "report_v2_payload": "ALTER TABLE reports ADD COLUMN report_v2_payload JSON",
    }

    with engine.begin() as connection:
        for column_name, statement in missing_column_statements.items():
            if column_name not in existing_columns:
                connection.execute(text(statement))


def reset_database_state() -> None:
    get_session_factory.cache_clear()
    get_engine.cache_clear()
