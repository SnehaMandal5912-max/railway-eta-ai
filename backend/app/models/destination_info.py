from sqlalchemy import Column, Integer, String, Text
from app.database import Base


class DestinationInfo(Base):
    __tablename__ = "destination_info"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Train information
    train_number = Column(String, nullable=False, index=True)

    # Destination information
    destination = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)

    # Arrival information
    arrival_time = Column(String, nullable=False)
    platform = Column(String, nullable=True)

    # Destination description
    description = Column(Text, nullable=True)

    # History and culture
    history = Column(Text, nullable=True)
    culture = Column(Text, nullable=True)

    # Nearby attractions
    important_places = Column(Text, nullable=True)

    # Local experience
    local_food = Column(Text, nullable=True)
    local_experience = Column(Text, nullable=True)

    # Travel information
    best_time = Column(String, nullable=True)
    transport = Column(Text, nullable=True)
    travel_tips = Column(Text, nullable=True)