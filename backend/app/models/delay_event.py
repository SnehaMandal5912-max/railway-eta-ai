from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class DelayEvent(Base):
    __tablename__ = "delay_events"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String, nullable=False, index=True)
    station_code = Column(String, nullable=False)
    delay_minutes = Column(Integer, nullable=False)
    delay_reason = Column(String, nullable=False)
    status = Column(String, nullable=False)
    recorded_at = Column(DateTime, nullable=False)