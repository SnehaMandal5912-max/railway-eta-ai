from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.eta_prediction import ETAPrediction

router = APIRouter(
    prefix="/database/eta-predictions",
    tags=["Database - ETA Predictions"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def add_eta_prediction(
    train_number: str,
    current_station: str,
    destination: str,
    predicted_arrival: str,
    delay_minutes: int,
    prediction_confidence: float,
    db: Session = Depends(get_db)
):
    prediction = ETAPrediction(
        train_number=train_number,
        current_station=current_station,
        destination=destination,
        predicted_arrival=predicted_arrival,
        delay_minutes=delay_minutes,
        prediction_confidence=prediction_confidence,
        predicted_at=datetime.utcnow()
    )

    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    return {
        "message": "ETA prediction added successfully",
        "prediction_id": prediction.id,
        "train_number": prediction.train_number,
        "current_station": prediction.current_station,
        "destination": prediction.destination,
        "predicted_arrival": prediction.predicted_arrival,
        "delay_minutes": prediction.delay_minutes,
        "prediction_confidence": prediction.prediction_confidence,
        "predicted_at": prediction.predicted_at
    }