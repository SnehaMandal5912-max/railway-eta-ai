from fastapi import FastAPI

from app.api.train import router as train_router
from app.api.train_details import router as train_details_router
from app.api.train_status import router as train_status_router
from app.api.upcoming_stations import router as upcoming_stations_router
from app.api.eta_prediction import router as eta_prediction_router

app = FastAPI(
    title="Railway ETA AI Backend",
    description="Backend API for Dynamic Forecast of Expected Time of Arrival",
    version="1.0.0"
)

app.include_router(train_router)
app.include_router(train_details_router)
app.include_router(train_status_router)
app.include_router(upcoming_stations_router)
app.include_router(eta_prediction_router)

@app.get("/")
def root():
    return {
        "message": "Railway ETA AI Backend is running"
    }