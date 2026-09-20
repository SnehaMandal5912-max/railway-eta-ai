from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base


class HazardAlert(Base):
    __tablename__ = "hazard_alerts"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String, nullable=False, index=True)
    risk_type = Column(String, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    severity = Column(String, nullable=False)
    status = Column(String, nullable=False)
    message = Column(String, nullable=False)
    detected_at = Column(DateTime, nullable=False)