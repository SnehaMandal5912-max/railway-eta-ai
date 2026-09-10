from fastapi import FastAPI

from app.api.train import router as train_router
from app.api.train_details import router as train_details_router


app = FastAPI(
    title="Railway ETA AI Backend",
    description="Backend API for Dynamic Forecast of Expected Time of Arrival",
    version="1.0.0"
)


# Train Search API
app.include_router(train_router)

# Train Details API
app.include_router(train_details_router)


@app.get("/")
def root():
    return {
        "message": "Railway ETA AI Backend is running"
    }