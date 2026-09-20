from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base


class ETAPrediction(Base):
    __tablename__ = "eta_predictions"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String, nullable=False, index=True)
    current_station = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    predicted_arrival = Column(String, nullable=False)
    delay_minutes = Column(Integer, nullable=False)
    prediction_confidence = Column(Float, nullable=True)
    predicted_at = Column(DateTime, nullable=False)