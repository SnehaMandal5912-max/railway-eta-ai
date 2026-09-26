from sqlalchemy import Column, Integer, String
from app.database import Base


class DestinationInfo(Base):
    __tablename__ = "destination_info"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String, nullable=False, index=True)
    destination = Column(String, nullable=False)
    arrival_time = Column(String, nullable=False)
    platform = Column(String, nullable=True)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    important_places = Column(String, nullable=True)