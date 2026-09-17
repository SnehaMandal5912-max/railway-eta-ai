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


@router.post("/")
def add_route(
    train_number: str,
    station_code: str,
    station_name: str,
    sequence: int,
    db: Session = Depends(get_db)
):
    route = Route(
        train_number=train_number,
        station_code=station_code,
        station_name=station_name,
        sequence=sequence
    )

    db.add(route)
    db.commit()
    db.refresh(route)

    return {
        "message": "Route station added successfully",
        "route_id": route.id,
        "train_number": route.train_number,
        "station_code": route.station_code,
        "station_name": route.station_name,
        "sequence": route.sequence
    }