from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# =====================================================
# EXISTING API ROUTES
# =====================================================

from app.api.train import router as train_router
from app.api.train_details import router as train_details_router
from app.api.train_status import router as train_status_router
from app.api.upcoming_stations import router as upcoming_stations_router
from app.api.eta_prediction import router as eta_prediction_router
from app.api.delay_prediction import router as delay_prediction_router
from app.api.route import router as route_router


# =====================================================
# OPERATIONAL API ROUTES
# =====================================================

from app.api.delay_reason import router as delay_reason_router
from app.api.station_info import router as station_info_router
from app.api.assistance import router as assistance_router
from app.api.hazard_alert import router as hazard_alert_router
from app.api.destination_info import router as destination_info_router


# =====================================================
# DATABASE
# =====================================================

from app.database import engine, Base

from app.models.train import Train
from app.models.station import Station
from app.models.route import Route
from app.models.train_location import TrainLocation
from app.models.historical_delay import HistoricalDelay


# =====================================================
# DATABASE API ROUTES
# =====================================================

from app.api.train_database import router as train_database_router
from app.api.train_database_get import router as train_database_get_router

from app.api.station_database import router as station_database_router
from app.api.station_database_get import router as station_database_get_router

from app.api.route_database import router as route_database_router
from app.api.route_database_get import router as route_database_get_router

from app.api.train_location_database import router as train_location_database_router
from app.api.train_location_database_get import router as train_location_database_get_router

from app.api.historical_delay_database import router as historical_delay_database_router
from app.api.historical_delay_database_get import router as historical_delay_database_get_router


# =====================================================
# FASTAPI APPLICATION
# =====================================================

app = FastAPI(
    title="Railway ETA AI Backend",
    description="Backend API for Dynamic Forecast of Expected Time of Arrival",
    version="1.0.0"
)


# =====================================================
# CORS CONFIGURATION
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# EXISTING API ROUTES
# =====================================================

app.include_router(train_router)
app.include_router(train_details_router)
app.include_router(train_status_router)
app.include_router(upcoming_stations_router)
app.include_router(eta_prediction_router)
app.include_router(delay_prediction_router)
app.include_router(route_router)


# =====================================================
# OPERATIONAL API ROUTES
# =====================================================

app.include_router(delay_reason_router)
app.include_router(station_info_router)
app.include_router(assistance_router)
app.include_router(hazard_alert_router)
app.include_router(destination_info_router)


# =====================================================
# DATABASE API ROUTES
# =====================================================

app.include_router(train_database_router)
app.include_router(train_database_get_router)

app.include_router(station_database_router)
app.include_router(station_database_get_router)

app.include_router(route_database_router)
app.include_router(route_database_get_router)

app.include_router(train_location_database_router)
app.include_router(train_location_database_get_router)

app.include_router(historical_delay_database_router)
app.include_router(historical_delay_database_get_router)


# =====================================================
# CREATE DATABASE TABLES
# =====================================================

Base.metadata.create_all(bind=engine)


# =====================================================
# ROOT
# =====================================================

@app.get("/")
def root():
    return {
        "message": "Railway ETA AI Backend is running"
    }