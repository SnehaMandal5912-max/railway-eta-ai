from fastapi import APIRouter

router = APIRouter(
    prefix="/trains",
    tags=["Trains"]
)


@router.get("/search")
def search_train(train_number: str):
    return {
        "train_number": train_number,
        "train_name": "Demo Express",
        "status": "Running",
        "message": "Train found successfully"
    }