from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.historical_delay import HistoricalDelay

router = APIRouter(
    prefix="/database/historical-delays",
    tags=["Database - Historical Delays"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def add_historical_delay(
    train_number: str,
    station_code: str,
    delay_minutes: int,
    delay_reason: str,
    db: Session = Depends(get_db)
):
    delay = HistoricalDelay(
        train_number=train_number,
        station_code=station_code,
        delay_minutes=delay_minutes,
        delay_reason=delay_reason,
        recorded_at=datetime.utcnow()
    )

    db.add(delay)
    db.commit()
    db.refresh(delay)

    return {
        "message": "Historical delay added successfully",
        "delay_id": delay.id,
        "train_number": delay.train_number,
        "station_code": delay.station_code,
        "delay_minutes": delay.delay_minutes,
        "delay_reason": delay.delay_reason,
        "recorded_at": delay.recorded_at
    }