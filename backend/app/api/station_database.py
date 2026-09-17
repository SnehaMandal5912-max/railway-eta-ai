from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.station import Station

router = APIRouter(
    prefix="/database/stations",
    tags=["Database - Stations"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def add_station(
    station_code: str,
    station_name: str,
    city: str,
    state: str,
    platforms: int,
    db: Session = Depends(get_db)
):
    station = Station(
        station_code=station_code,
        station_name=station_name,
        city=city,
        state=state,
        platforms=platforms
    )

    db.add(station)
    db.commit()
    db.refresh(station)

    return {
        "message": "Station added successfully",
        "station_id": station.id,
        "station_code": station.station_code,
        "station_name": station.station_name,
        "city": station.city,
        "state": station.state,
        "platforms": station.platforms
    }