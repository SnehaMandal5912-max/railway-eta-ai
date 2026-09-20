from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.route import Route

router = APIRouter(
    prefix="/database/routes",
    tags=["Database - Routes"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{train_number}")
def get_train_route(
    train_number: str,
    db: Session = Depends(get_db)
):
    routes = (
        db.query(Route)
        .filter(Route.train_number == train_number)
        .order_by(Route.sequence)
        .all()
    )

    return {
        "train_number": train_number,
        "route": [
            {
                "route_id": route.id,
                "station_code": route.station_code,
                "station_name": route.station_name,
                "sequence": route.sequence
            }
            for route in routes
        ]
    }