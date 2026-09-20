from sqlalchemy import Column, Integer, String
from app.database import Base


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String, nullable=False, index=True)
    station_code = Column(String, nullable=False)
    station_name = Column(String, nullable=False)
    sequence = Column(Integer, nullable=False)