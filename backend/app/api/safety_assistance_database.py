from datetime import datetime
import random

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


def generate_otp():
    return str(random.randint(100000, 999999))


@router.post("/")
def create_safety_assistance(
    passenger_name: str,
    train_number: str,
    coach: str,
    station: str,
    request_type: str,
    db: Session = Depends(get_db)
):
    start_otp = generate_otp()
    end_otp = generate_otp()

    request = SafetyAssistance(
        passenger_name=passenger_name,
        train_number=train_number,
        coach=coach,
        station=station,
        request_type=request_type,
        status="REQUESTED",
        start_otp=start_otp,
        end_otp=end_otp,
        start_otp_verified="NO",
        end_otp_verified="NO",
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
        "start_otp": request.start_otp,
        "end_otp": request.end_otp,
        "start_otp_verified": request.start_otp_verified,
        "end_otp_verified": request.end_otp_verified,
        "requested_at": request.requested_at
    }