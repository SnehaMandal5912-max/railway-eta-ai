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


@router.get("/{train_number}")
def get_historical_delays(
    train_number: str,
    db: Session = Depends(get_db)
):
    delays = (
        db.query(HistoricalDelay)
        .filter(HistoricalDelay.train_number == train_number)
        .order_by(HistoricalDelay.recorded_at.desc())
        .all()
    )

    return {
        "train_number": train_number,
        "historical_delays": [
            {
                "delay_id": delay.id,
                "station_code": delay.station_code,
                "delay_minutes": delay.delay_minutes,
                "delay_reason": delay.delay_reason,
                "recorded_at": delay.recorded_at
            }
            for delay in delays
        ]
    }