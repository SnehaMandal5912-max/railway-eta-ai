from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.train import Train


router = APIRouter(
    prefix="/trains",
    tags=["Destination Information"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/{train_number}/destination")
def get_destination_info(
    train_number: str,
    db: Session = Depends(get_db)
):
    train = (
        db.query(Train)
        .filter(Train.train_number == train_number)
        .first()
    )

    if not train:
        raise HTTPException(
            status_code=404,
            detail=f"Train {train_number} not found in database"
        )

    return {
        "train_number": train.train_number,
        "destination": train.destination,
        "arrival_time": None,
        "platform": None,
        "city": None,
        "state": None,
        "important_places": [],
        "message": "Destination information fetched from database"
    }