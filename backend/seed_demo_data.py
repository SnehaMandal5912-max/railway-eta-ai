from datetime import datetime, timedelta

from app.database import SessionLocal, Base, engine
from app.models.historical_delay import HistoricalDelay
from app.models.train_location import TrainLocation


# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

TRAIN_NUMBER = "12345"

try:
    # -------------------------------------------------
    # Synthetic Historical Delay Data
    # -------------------------------------------------

    historical_delays = [
        ("HWH", 5, "Operational delay"),
        ("BDC", 8, "Congestion"),
        ("BWN", 12, "Signal delay"),
        ("ASN", 18, "Operational delay"),
        ("DHN", 22, "Congestion"),
        ("GMO", 15, "Signal delay"),
        ("KQR", 25, "Operational delay"),
        ("NDLS", 20, "Network delay"),
    ]

    for index, (station_code, delay_minutes, reason) in enumerate(
        historical_delays
    ):
        record = HistoricalDelay(
            train_number=TRAIN_NUMBER,
            station_code=station_code,
            delay_minutes=delay_minutes,
            delay_reason=reason,
            recorded_at=datetime.utcnow() - timedelta(days=30 - index),
        )

        db.add(record)

    # -------------------------------------------------
    # Synthetic Current Train Location Data
    # -------------------------------------------------

    locations = [
        ("HWH", 22.5839, 88.3428, 45.0),
        ("BDC", 23.0071, 88.3484, 52.0),
        ("BWN", 23.2324, 87.8615, 48.0),
        ("ASN", 23.6739, 87.1480, 50.0),
        ("DHN", 23.7957, 86.4304, 46.0),
    ]

    for index, (station_code, latitude, longitude, speed) in enumerate(
        locations
    ):
        record = TrainLocation(
            train_number=TRAIN_NUMBER,
            station_code=station_code,
            latitude=latitude,
            longitude=longitude,
            speed=speed,
            recorded_at=datetime.utcnow() - timedelta(minutes=20 - index * 5),
        )

        db.add(record)

    db.commit()

    print("Demo data inserted successfully.")
    print("Historical delay records:", len(historical_delays))
    print("Train location records:", len(locations))

except Exception as error:
    db.rollback()
    print("Error inserting demo data:")
    print(error)

finally:
    db.close()