from fastapi import APIRouter

router = APIRouter(
    prefix="/trains",
    tags=["Train Status"]
)


@router.get("/{train_number}/status")
def get_train_status(train_number: str):
    return {
        "train_number": train_number,
        "status": "Running",
        "current_station": "Asansol",
        "next_station": "Dhanbad",
        "delay_minutes": 15,
        "delay_reason": "Operational delay",
        "destination": "Howrah Junction",
        "message": "Current train status fetched successfully"
    }