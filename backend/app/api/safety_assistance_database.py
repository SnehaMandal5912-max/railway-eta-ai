from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.safety_assistance import SafetyAssistance

router = APIRouter(
    prefix="/database/safety-assistance",
    tags=["Database - Safety Assistance"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_safety_assistance(
    passenger_name: str,
    train_number: str,
    coach: str,
    station: str,
    request_type: str,
    db: Session = Depends(get_db)
):
    request = SafetyAssistance(
        passenger_name=passenger_name,
        train_number=train_number,
        coach=coach,
        station=station,
        request_type=request_type,
        status="REQUESTED",
        requested_at=datetime.utcnow()
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    return {
        "message": "Safety assistance request created successfully",
        "request_id": request.id,
        "passenger_name": request.passenger_name,
        "train_number": request.train_number,
        "coach": request.coach,
        "station": request.station,
        "request_type": request.request_type,
        "status": request.status,
        "requested_at": request.requested_at
    }