from fastapi import APIRouter

router = APIRouter(
    prefix="/stations",
    tags=["Station Information"]
)


@router.get("/{station_code}")
def get_station_info(station_code: str):
    return {
        "station_code": station_code,
        "station_name": "Asansol Junction",
        "city": "Asansol",
        "state": "West Bengal",
        "platforms": 7,
        "message": "Station information fetched successfully"
    }