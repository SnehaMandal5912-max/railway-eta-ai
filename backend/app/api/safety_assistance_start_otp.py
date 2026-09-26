from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.safety_assistance import SafetyAssistance

router = APIRouter(
    prefix="/database/safety-assistance",
    tags=["Safety Assistance OTP"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.patch("/{request_id}/start-otp")
def verify_start_otp(
    request_id: int,
    otp: str,
    db: Session = Depends(get_db)
):
    request = (
        db.query(SafetyAssistance)
        .filter(SafetyAssistance.id == request_id)
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Safety assistance request not found"
        )

    if request.start_otp != otp:
        raise HTTPException(
            status_code=400,
            detail="Invalid start OTP"
        )

    request.start_otp_verified = "YES"
    request.status = "IN_PROGRESS"

    db.commit()
    db.refresh(request)

    return {
        "message": "Start OTP verified successfully",
        "request_id": request.id,
        "status": request.status,
        "start_otp_verified": request.start_otp_verified
    }