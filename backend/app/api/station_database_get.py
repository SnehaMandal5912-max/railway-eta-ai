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


@router.get("/")
def get_all_stations(db: Session = Depends(get_db)):
    stations = db.query(Station).all()

    return {
        "stations": [
            {
                "station_id": station.id,
                "station_code": station.station_code,
                "station_name": station.station_name,
                "city": station.city,
                "state": station.state,
                "platforms": station.platforms
            }
            for station in stations
        ]
    }