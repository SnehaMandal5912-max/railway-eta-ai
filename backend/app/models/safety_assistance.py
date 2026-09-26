from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class SafetyAssistance(Base):
    __tablename__ = "safety_assistance_requests"

    id = Column(Integer, primary_key=True, index=True)
    passenger_name = Column(String, nullable=False)
    train_number = Column(String, nullable=False, index=True)
    coach = Column(String, nullable=False)
    station = Column(String, nullable=False)
    request_type = Column(String, nullable=False)

    status = Column(String, nullable=False)

    start_otp = Column(String, nullable=False)
    end_otp = Column(String, nullable=False)

    start_otp_verified = Column(String, nullable=False, default="NO")
    end_otp_verified = Column(String, nullable=False, default="NO")

    requested_at = Column(DateTime, nullable=False)