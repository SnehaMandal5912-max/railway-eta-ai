from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.delay_event import DelayEvent

router = APIRouter(
    prefix="/database/delay-events",
    tags=["Database - Delay Events"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def add_delay_event(
    train_number: str,
    station_code: str,
    delay_minutes: int,
    delay_reason: str,
    status: str,
    db: Session = Depends(get_db)
):
    delay_event = DelayEvent(
        train_number=train_number,
        station_code=station_code,
        delay_minutes=delay_minutes,
        delay_reason=delay_reason,
        status=status,
        recorded_at=datetime.utcnow()
    )

    db.add(delay_event)
    db.commit()
    db.refresh(delay_event)

    return {
        "message": "Delay event added successfully",
        "delay_event_id": delay_event.id,
        "train_number": delay_event.train_number,
        "station_code": delay_event.station_code,
        "delay_minutes": delay_event.delay_minutes,
        "delay_reason": delay_event.delay_reason,
        "status": delay_event.status,
        "recorded_at": delay_event.recorded_at
    }