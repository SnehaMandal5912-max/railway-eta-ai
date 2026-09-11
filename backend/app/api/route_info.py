from fastapi import APIRouter

router = APIRouter(
    prefix="/trains",
    tags=["Route Information"]
)


@router.get("/{train_number}/route")
def get_train_route(train_number: str):
    return {
        "train_number": train_number,
        "source": "Kolkata",
        "destination": "New Delhi",
        "total_stations": 6,
        "route": [
            {
                "station_code": "KOAA",
                "station_name": "Kolkata",
                "sequence": 1
            },
            {
                "station_code": "ASN",
                "station_name": "Asansol",
                "sequence": 2
            },
            {
                "station_code": "DHN",
                "station_name": "Dhanbad",
                "sequence": 3
            },
            {
                "station_code": "GMO",
                "station_name": "Gomoh",
                "sequence": 4
            },
            {
                "station_code": "KQR",
                "station_name": "Koderma",
                "sequence": 5
            },
            {
                "station_code": "NDLS",
                "station_name": "New Delhi",
                "sequence": 6
            }
        ],
        "message": "Train route fetched successfully"
    }