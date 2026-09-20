from fastapi import APIRouter, Depends, HTTPException
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


@router.patch("/{request_id}/status")
def update_assistance_status(
    request_id: int,
    status: str,
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

    allowed_statuses = [
        "REQUESTED",
        "ASSIGNED",
        "IN_PROGRESS",
        "COMPLETED"
    ]

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    request.status = status
    db.commit()
    db.refresh(request)

    return {
        "message": "Safety assistance status updated successfully",
        "request_id": request.id,
        "status": request.status
    }