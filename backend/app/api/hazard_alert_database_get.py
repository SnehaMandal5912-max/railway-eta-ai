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


@router.get("/{train_number}")
def get_hazard_alerts(
    train_number: str,
    db: Session = Depends(get_db)
):
    alerts = (
        db.query(HazardAlert)
        .filter(HazardAlert.train_number == train_number)
        .order_by(HazardAlert.detected_at.desc())
        .all()
    )

    return {
        "train_number": train_number,
        "hazard_alerts": [
            {
                "alert_id": alert.id,
                "risk_type": alert.risk_type,
                "location": alert.location,
                "latitude": alert.latitude,
                "longitude": alert.longitude,
                "severity": alert.severity,
                "status": alert.status,
                "message": alert.message,
                "detected_at": alert.detected_at
            }
            for alert in alerts
        ]
    }