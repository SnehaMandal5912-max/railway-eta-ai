from datetime import datetime

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


@router.post("/")
def add_train_location(
    train_number: str,
    station_code: str,
    latitude: float,
    longitude: float,
    speed: float,
    db: Session = Depends(get_db)
):
    location = TrainLocation(
        train_number=train_number,
        station_code=station_code,
        latitude=latitude,
        longitude=longitude,
        speed=speed,
        recorded_at=datetime.utcnow()
    )

    db.add(location)
    db.commit()
    db.refresh(location)

    return {
        "message": "Train location added successfully",
        "location_id": location.id,
        "train_number": location.train_number,
        "station_code": location.station_code,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "speed": location.speed,
        "recorded_at": location.recorded_at
    }