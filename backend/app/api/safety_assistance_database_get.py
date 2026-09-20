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


@router.get("/{train_number}")
def get_safety_assistance_requests(
    train_number: str,
    db: Session = Depends(get_db)
):
    requests = (
        db.query(SafetyAssistance)
        .filter(SafetyAssistance.train_number == train_number)
        .order_by(SafetyAssistance.requested_at.desc())
        .all()
    )

    return {
        "train_number": train_number,
        "safety_assistance_requests": [
            {
                "request_id": request.id,
                "passenger_name": request.passenger_name,
                "coach": request.coach,
                "station": request.station,
                "request_type": request.request_type,
                "status": request.status,
                "requested_at": request.requested_at
            }
            for request in requests
        ]
    }