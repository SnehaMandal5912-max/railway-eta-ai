from fastapi import APIRouter

router = APIRouter(
    prefix="/trains",
    tags=["Destination Information"]
)


@router.get("/{train_number}/destination")
def get_destination_info(train_number: str):

    return {
        "train_number": train_number,

        "destination": {
            "name": "New Delhi",
            "city": "New Delhi",
            "state": "Delhi",
            "description": "Capital city of India and a major historical and cultural destination."
        },

        "arrival_information": {
            "arrival_time": "22:30",
            "platform": "5"
        },

        "history_and_culture": {
            "history": "New Delhi is known for its rich history, monuments and heritage.",
            "culture": "The city has a diverse mix of Indian cultures, food and traditions."
        },

        "nearby_attractions": [
            {
                "name": "India Gate",
                "description": "A famous war memorial and landmark of New Delhi."
            },
            {
                "name": "Red Fort",
                "description": "A historic Mughal-era fort and UNESCO World Heritage Site."
            },
            {
                "name": "Connaught Place",
                "description": "A major commercial and shopping area in central Delhi."
            }
        ],

        "local_experience": {
            "food": [
                "Chole Bhature",
                "Paratha",
                "Chaat"
            ],
            "culture": [
                "Local markets",
                "Historical monuments",
                "Delhi street food"
            ]
        },

        "travel_information": {
            "best_time": "October to March",
            "transport": "Metro, bus, taxi and auto-rickshaw",
            "tips": [
                "Keep personal belongings safe.",
                "Use official transport services when possible.",
                "Carry sufficient water during outdoor visits."
            ]
        },

        "message": "Destination information fetched successfully"
    }