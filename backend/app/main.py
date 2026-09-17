from fastapi import FastAPI

from app.api.train import router as train_router
from app.api.train_details import router as train_details_router
from app.api.train_status import router as train_status_router
from app.api.upcoming_stations import router as upcoming_stations_router
from app.api.eta_prediction import router as eta_prediction_router
from app.api.delay_prediction import router as delay_prediction_router
from app.api.delay_reason import router as delay_reason_router
from app.api.route_info import router as route_info_router
from app.api.station_info import router as station_info_router
from app.api.assistance import router as assistance_router
from app.api.hazard_alert import router as hazard_router
from app.api.destination_info import router as destination_router
from app.database import Base, engine
from app.models.train import Train
from app.api.train_database import router as train_database_router
from app.api.train_database_get import router as train_database_get_router
from app.models.station import Station
from app.api.station_database import router as station_database_router
from app.api.station_database_get import router as station_database_get_router

Base.metadata.create_all(bind=engine)

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
app.include_router(delay_prediction_router)
app.include_router(delay_reason_router)
app.include_router(route_info_router)
app.include_router(station_info_router)
app.include_router(assistance_router)
app.include_router(hazard_router)
app.include_router(destination_router)
app.include_router(train_database_router)
app.include_router(train_database_get_router)
app.include_router(station_database_router)
app.include_router(station_database_get_router)

@app.get("/")
def root():
    return {
        "message": "Railway ETA AI Backend is running"
    }