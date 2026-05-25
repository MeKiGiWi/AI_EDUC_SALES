from contextlib import asynccontextmanager
import json
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import router as simulator_router
from app.api_reports import router as reports_router
from app.database import initialize_database
from app.render_mermaid_graph import render_graph_artifacts

OPENAPI_PATH = Path(__file__).resolve().parents[1] / "openapi.json"


def write_openapi_contract(application: FastAPI) -> None:
    OPENAPI_PATH.write_text(
        json.dumps(application.openapi(), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

@asynccontextmanager
async def lifespan(application: FastAPI):
    initialize_database()
    if os.getenv("WRITE_RUNTIME_ARTIFACTS", "false").lower() == "true":
        try:
            render_graph_artifacts()
            write_openapi_contract(application)
        except Exception as e:
            print(f"Failed to write runtime artifacts: {e}")
    yield


def create_app() -> FastAPI:
    application = FastAPI(
        title="AI Sales Academy Backend",
        version="0.2.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?:\/\/(localhost|127\.0\.0\.1):\d+$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.get("/health", tags=["system"])
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok", "message": "Сервис работает стабильно."}

    application.include_router(simulator_router)
    application.include_router(reports_router)
    return application


app = create_app()
