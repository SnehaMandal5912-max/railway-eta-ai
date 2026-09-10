from fastapi import FastAPI

app = FastAPI(
    title="Railway ETA AI Backend",
    description="Backend API for Dynamic Forecast of Expected Time of Arrival",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "Railway ETA AI Backend is running"
    }
@app.get("/trains/search")
def search_train(train_number: str):
    return {
        "train_number": train_number,
        "train_name": "Demo Express",
        "status": "Running",
        "message": "Train found successfully"
    }