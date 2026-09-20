from fastapi import APIRouter

router = APIRouter(
    prefix="/trains",
    tags=["Delay Reason"]
)


@router.get("/{train_number}/delay-reason")
def get_delay_reason(train_number: str):
    return {
        "train_number": train_number,
        "delay_status": "Delayed",
        "delay_minutes": 25,
        "delay_reason": "Operational delay",
        "last_updated": "15:30",
        "message": "Delay reason fetched successfully"
    }