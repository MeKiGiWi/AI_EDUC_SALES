from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.render_graph import render_graph_artifacts
from app.simulator_api import router as simulator_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    render_graph_artifacts()
    yield


def create_app() -> FastAPI:
    application = FastAPI(
        title="AI Sales Academy Backend",
        version="0.2.0",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:8081",
            "http://127.0.0.1:8081",
        ],
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
