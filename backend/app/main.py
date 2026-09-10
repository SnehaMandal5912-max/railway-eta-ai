from fastapi import FastAPI
from app.api.train import router as train_router

app = FastAPI(
    title="Railway ETA AI Backend",
    description="Backend API for Dynamic Forecast of Expected Time of Arrival",
    version="1.0.0"
)


# Register Train APIs
app.include_router(train_router)


@app.get("/")
def root():
    return {
        "message": "Railway ETA AI Backend is running"
    }