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


@router.get("/{train_number}")
def get_delay_events(
    train_number: str,
    db: Session = Depends(get_db)
):
    events = (
        db.query(DelayEvent)
        .filter(DelayEvent.train_number == train_number)
        .order_by(DelayEvent.recorded_at.desc())
        .all()
    )

    return {
        "train_number": train_number,
        "delay_events": [
            {
                "event_id": event.id,
                "station_code": event.station_code,
                "delay_minutes": event.delay_minutes,
                "delay_reason": event.delay_reason,
                "status": event.status,
                "recorded_at": event.recorded_at
            }
            for event in events
        ]
    }