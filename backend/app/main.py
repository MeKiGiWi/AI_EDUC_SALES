from contextlib import asynccontextmanager
import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.render_mermaid_graph import render_graph_artifacts
from app.api import router as simulator_router

OPENAPI_PATH = Path(__file__).resolve().parents[1] / "openapi.json"


def write_openapi_contract(application: FastAPI) -> None:
    OPENAPI_PATH.write_text(
        json.dumps(application.openapi(), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


@asynccontextmanager
async def lifespan(application: FastAPI):
    render_graph_artifacts()
    write_openapi_contract(application)
    yield


def create_app() -> FastAPI:
    application = FastAPI(
        title="AI Sales Academy Backend",
        version="0.2.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?:\/\/.*:(3000|8081|19006)$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.get("/health", tags=["system"])
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok", "message": "Сервис работает стабильно."}

    application.include_router(simulator_router)
    return application


app = create_app()
