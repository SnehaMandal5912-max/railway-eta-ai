from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.services.train_service import create_train

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


@router.post("/")
def add_train(
    train_number: str,
    train_name: str,
    source: str,
    destination: str,
    db: Session = Depends(get_db)
):
    train = create_train(
        db,
        train_number,
        train_name,
        source,
        destination
    )

    return {
        "message": "Train added successfully",
        "train_id": train.id,
        "train_number": train.train_number,
        "train_name": train.train_name,
        "source": train.source,
        "destination": train.destination
    }