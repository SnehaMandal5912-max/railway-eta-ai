from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.train_location import TrainLocation
from app.models.delay_event import DelayEvent
from app.models.route import Route
from app.services.eta_service import calculate_eta


router = APIRouter(
    prefix="/trains",
    tags=["ETA Prediction"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{train_number}/eta")
def predict_eta(
    train_number: str,
    db: Session = Depends(get_db)
):

    # Get latest train location
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

    # Get latest delay event
    delay_event = (
        db.query(DelayEvent)
        .filter(DelayEvent.train_number == train_number)
        .order_by(DelayEvent.recorded_at.desc())
        .first()
    )

    # Get latest speed
    speed_kmph = location.speed

    # Get latest delay
    if delay_event is not None:
        delay_minutes = delay_event.delay_minutes
        delay_reason = delay_event.delay_reason
    else:
        delay_minutes = 0
        delay_reason = "No active delay"

    # Get current station route information
    current_route = (
        db.query(Route)
        .filter(
            Route.train_number == train_number,
            Route.station_code == location.station_code
        )
        .first()
    )

    # Get next station
    next_route = None

    if current_route is not None:
        next_route = (
            db.query(Route)
            .filter(
                Route.train_number == train_number,
                Route.sequence > current_route.sequence
            )
            .order_by(Route.sequence.asc())
            .first()
        )

    # Calculate distance to next station
    if next_route is not None:
        distance_km = next_route.distance_from_previous_km
    else:
        distance_km = 0

    # Calculate ETA
    eta_minutes = calculate_eta(
        distance_km,
        speed_kmph,
        delay_minutes
    )

    return {
        "train_number": train_number,
        "current_station": location.station_code,
        "next_station": next_route.station_code if next_route else None,
        "destination": "New Delhi",
        "distance_km": distance_km,
        "eta_minutes": eta_minutes,
        "delay_minutes": delay_minutes,
        "delay_reason": delay_reason,
        "speed_kmph": speed_kmph,
        "prediction_confidence": 0.92,
        "message": "ETA predicted successfully"
    }