from fastapi import APIRouter

router = APIRouter(
    prefix="/hazards",
    tags=["Hazard Alerts"]
)


@router.get("/{train_number}")
def get_hazard_alerts(train_number: str):
    return {
        "train_number": train_number,
        "hazards": [
            {
                "risk_type": "Elephant Crossing",
                "location": "Asansol Section",
                "severity": "HIGH",
                "status": "ACTIVE",
                "message": "Wildlife movement detected near railway track"
            }
        ],
        "message": "Hazard alerts fetched successfully"
    }