from fastapi import APIRouter

router = APIRouter(
    prefix="/trains",
    tags=["Train Details"]
)


@router.get("/{train_number}")
def get_train_details(train_number: str):
    return {
        "train_number": train_number,
        "train_name": "Demo Express",
        "source": "Kolkata",
        "destination": "New Delhi",
        "status": "Running",
        "current_station": "Asansol",
        "next_station": "Dhanbad",
        "message": "Train details fetched successfully"
    }