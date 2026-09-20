from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.train import Train

router = APIRouter(
    prefix="/database/trains",
    tags=["Database - Trains"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_all_trains(db: Session = Depends(get_db)):
    trains = db.query(Train).all()

    return {
        "trains": [
            {
                "train_id": train.id,
                "train_number": train.train_number,
                "train_name": train.train_name,
                "source": train.source,
                "destination": train.destination
            }
            for train in trains
        ]
    }