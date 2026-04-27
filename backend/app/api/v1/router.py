from fastapi import APIRouter

from app.api.v1.simulator import router as simulator_router

api_router = APIRouter()
api_router.include_router(simulator_router, prefix="/simulator", tags=["simulator"])

