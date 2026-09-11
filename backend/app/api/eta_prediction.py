from fastapi import APIRouter

router = APIRouter(
    prefix="/trains",
    tags=["ETA Prediction"]
)


@router.get("/{train_number}/eta")
def predict_eta(train_number: str):
    return {
        "train_number": train_number,
        "current_station": "Asansol",
        "destination": "New Delhi",
        "predicted_arrival": "22:30",
        "delay_minutes": 20,
        "prediction_confidence": 0.92,
        "message": "ETA predicted successfully"
    }