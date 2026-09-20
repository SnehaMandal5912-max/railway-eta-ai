from fastapi import APIRouter

router = APIRouter(
    prefix="/trains",
    tags=["Destination Information"]
)


@router.get("/{train_number}/destination")
def get_destination_info(train_number: str):
    return {
        "train_number": train_number,
        "destination": "New Delhi",
        "arrival_time": "22:30",
        "platform": "5",
        "city": "New Delhi",
        "state": "Delhi",
        "important_places": [
            "India Gate",
            "Red Fort",
            "Connaught Place"
        ],
        "message": "Destination information fetched successfully"
    }