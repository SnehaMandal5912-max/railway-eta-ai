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


@router.patch("/{request_id}/end-otp")
def verify_end_otp(
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

    if request.status != "IN_PROGRESS":
        raise HTTPException(
            status_code=400,
            detail="Assistance is not currently in progress"
        )

    if request.end_otp != otp:
        raise HTTPException(
            status_code=400,
            detail="Invalid end OTP"
        )

    request.end_otp_verified = "YES"
    request.status = "COMPLETED"

    db.commit()
    db.refresh(request)

    return {
        "message": "End OTP verified successfully",
        "request_id": request.id,
        "status": request.status,
        "end_otp_verified": request.end_otp_verified
    }