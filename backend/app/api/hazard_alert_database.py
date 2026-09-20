from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.hazard_alert import HazardAlert

router = APIRouter(
    prefix="/database/hazard-alerts",
    tags=["Database - Hazard Alerts"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def add_hazard_alert(
    train_number: str,
    risk_type: str,
    location: str,
    severity: str,
    status: str,
    message: str,
    latitude: float = None,
    longitude: float = None,
    db: Session = Depends(get_db)
):
    alert = HazardAlert(
        train_number=train_number,
        risk_type=risk_type,
        location=location,
        latitude=latitude,
        longitude=longitude,
        severity=severity,
        status=status,
        message=message,
        detected_at=datetime.utcnow()
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    return {
        "message": "Hazard alert added successfully",
        "alert_id": alert.id,
        "train_number": alert.train_number,
        "risk_type": alert.risk_type,
        "location": alert.location,
        "latitude": alert.latitude,
        "longitude": alert.longitude,
        "severity": alert.severity,
        "status": alert.status,
        "message": alert.message,
        "detected_at": alert.detected_at
    }