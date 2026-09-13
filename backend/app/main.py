from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.train import router as train_router
from app.api.train_details import router as train_details_router
from app.api.train_status import router as train_status_router
from app.api.upcoming_stations import router as upcoming_stations_router
from app.api.eta_prediction import router as eta_prediction_router
from app.api.delay_prediction import router as delay_prediction_router
from app.api.route import router as route_router


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
# API ROUTES
# =====================================================

app.include_router(train_router)
app.include_router(train_details_router)
app.include_router(train_status_router)
app.include_router(upcoming_stations_router)
app.include_router(eta_prediction_router)
app.include_router(delay_prediction_router)
app.include_router(route_router)


# =====================================================
# ROOT
# =====================================================

@app.get("/")
def root():
    return {
        "message": "Railway ETA AI Backend is running"
    }