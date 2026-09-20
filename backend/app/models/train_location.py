from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base


class TrainLocation(Base):
    __tablename__ = "train_locations"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String, nullable=False, index=True)
    station_code = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    recorded_at = Column(DateTime, nullable=False)