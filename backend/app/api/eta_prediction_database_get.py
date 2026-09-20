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


@router.get("/{train_number}")
def get_eta_predictions(
    train_number: str,
    db: Session = Depends(get_db)
):
    predictions = (
        db.query(ETAPrediction)
        .filter(ETAPrediction.train_number == train_number)
        .order_by(ETAPrediction.predicted_at.desc())
        .all()
    )

    return {
        "train_number": train_number,
        "eta_predictions": [
            {
                "prediction_id": prediction.id,
                "current_station": prediction.current_station,
                "destination": prediction.destination,
                "predicted_arrival": prediction.predicted_arrival,
                "delay_minutes": prediction.delay_minutes,
                "prediction_confidence": prediction.prediction_confidence,
                "predicted_at": prediction.predicted_at
            }
            for prediction in predictions
        ]
    }