from fastapi import APIRouter

router = APIRouter(
    prefix="/trains",
    tags=["Train Route"]
)


@router.get("/{train_number}/route")
def get_train_route(train_number: str):
    return {
        "train_number": train_number,
        "route": [
            {
                "sequence": 1,
                "station_code": "KOAA",
                "station_name": "Kolkata",
                "lat": 22.5726,
                "lng": 88.3639
            },
            {
                "sequence": 2,
                "station_code": "ASN",
                "station_name": "Asansol",
                "lat": 23.6739,
                "lng": 87.1480
            },
            {
                "sequence": 3,
                "station_code": "DHN",
                "station_name": "Dhanbad",
                "lat": 23.7957,
                "lng": 86.4304
            },
            {
                "sequence": 4,
                "station_code": "GMO",
                "station_name": "Gomoh",
                "lat": 23.8730,
                "lng": 86.1510
            },
            {
                "sequence": 5,
                "station_code": "KQR",
                "station_name": "Koderma",
                "lat": 24.4674,
                "lng": 85.5930
            },
            {
                "sequence": 6,
                "station_code": "NDLS",
                "station_name": "New Delhi",
                "lat": 28.6139,
                "lng": 77.2090
            }
        ],
        "message": "Train route fetched successfully"
    }