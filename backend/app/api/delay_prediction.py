from fastapi import APIRouter

router = APIRouter(
    prefix="/trains",
    tags=["Delay Prediction"]
)


@router.get("/{train_number}/delay")
def predict_delay(train_number: str):
    return {
        "train_number": train_number,
        "current_station": "Asansol",
        "destination": "New Delhi",
        "predicted_delay_minutes": 25,
        "delay_probability": 0.78,
        "delay_reason": "Operational delay",
        "message": "Delay predicted successfully"
    }