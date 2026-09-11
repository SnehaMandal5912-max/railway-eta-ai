from fastapi import APIRouter

router = APIRouter(
    prefix="/trains",
    tags=["Upcoming Stations"]
)


@router.get("/{train_number}/upcoming-stations")
def get_upcoming_stations(train_number: str):
    return {
        "train_number": train_number,
        "current_station": "Asansol",
        "upcoming_stations": [
            {
                "station_code": "DHN",
                "station_name": "Dhanbad",
                "expected_arrival": "16:00"
            },
            {
                "station_code": "GMO",
                "station_name": "Gomoh",
                "expected_arrival": "17:10"
            },
            {
                "station_code": "KQR",
                "station_name": "Koderma",
                "expected_arrival": "18:45"
            }
        ],
        "message": "Upcoming stations fetched successfully"
    }