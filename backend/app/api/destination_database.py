from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.destination_info import DestinationInfo

router = APIRouter(
    prefix="/database/destinations",
    tags=["Database - Destination Info"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{train_number}")
def get_destination_info(
    train_number: str,
    db: Session = Depends(get_db)
):
    destination = (
        db.query(DestinationInfo)
        .filter(DestinationInfo.train_number == train_number)
        .first()
    )

    if destination is None:
        return {
            "message": "Destination information not found"
        }

    return {
        "train_number": destination.train_number,
        "destination": destination.destination,
        "city": destination.city,
        "state": destination.state,
        "arrival_time": destination.arrival_time,
        "platform": destination.platform,
        "description": destination.description,
        "history": destination.history,
        "culture": destination.culture,
        "important_places": destination.important_places,
        "local_food": destination.local_food,
        "local_experience": destination.local_experience,
        "best_time": destination.best_time,
        "transport": destination.transport,
        "travel_tips": destination.travel_tips
    }