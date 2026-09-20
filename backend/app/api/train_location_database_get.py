from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.train_location import TrainLocation

router = APIRouter(
    prefix="/database/train-locations",
    tags=["Database - Train Location"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{train_number}")
def get_latest_train_location(
    train_number: str,
    db: Session = Depends(get_db)
):
    location = (
        db.query(TrainLocation)
        .filter(TrainLocation.train_number == train_number)
        .order_by(TrainLocation.recorded_at.desc())
        .first()
    )

    if location is None:
        return {
            "message": "Train location not found"
        }

    return {
        "location_id": location.id,
        "train_number": location.train_number,
        "station_code": location.station_code,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "speed": location.speed,
        "recorded_at": location.recorded_at
    }