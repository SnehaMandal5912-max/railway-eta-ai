from fastapi import APIRouter

router = APIRouter(
    prefix="/assistance",
    tags=["Safety Assistance"]
)


@router.post("/request")
def request_assistance(
    passenger_name: str,
    train_number: str,
    coach: str,
    station: str,
    request_type: str
):
    return {
        "passenger_name": passenger_name,
        "train_number": train_number,
        "coach": coach,
        "station": station,
        "request_type": request_type,
        "status": "REQUESTED",
        "message": "Safety assistance request submitted successfully"
    }