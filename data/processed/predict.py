import pandas as pd
import joblib


# =========================
# Load trained model
# =========================

MODEL_PATH = "data/processed/eta_model.pkl"

model = joblib.load(MODEL_PATH)

print("ETA model loaded successfully!")


# =========================
# Prediction function
# =========================

def predict_delay(train_data):

    input_data = pd.DataFrame([train_data])

    prediction = model.predict(input_data)[0]

    prediction = max(0, prediction)

    return prediction


# =========================
# Example prediction
# =========================

train_data = {
    "train_number": 12536,
    "train_type": "Superfast Express",
    "year": 2024,
    "month": 9,
    "day_of_week": 2,
    "departure_hour": 8,
    "is_weekend": 0,
    "is_night_departure": 0,
    "is_peak_hour": 1,
    "is_festival_season": 0,
    "season": "Monsoon",
    "zone": "North Western Railway (NWR)",
    "zone_abbr": "NWR",
    "source_station_category": "A",
    "destination_station_category": "B",
    "distance_km": 620,
    "num_scheduled_stops": 12,
    "scheduled_travel_hours": 10.33,
    "track_doubled": 1,
    "is_hdn_route": 0,
    "traction_type": "Dual",
    "is_electrified": 1,
    "psr_count": 3,
    "is_circular_route": 0,
    "is_monsoon_season": 1,
    "is_fog_risk": 0,
    "fog_risk_score": 0.0,
    "zone_fog_index": 0.58,
    "zone_congestion_index": 0.75,
    "season_severity_score": 0.78,
    "loco_age_years": 16.7,
    "coach_age_years": 7.8,
    "has_lhb_coaches": 0,
    "is_rake_shared": 1,
    "maintenance_score": 5.5,
    "seat_utilisation_pct": 88.8,
    "is_overloaded": 0,
    "late_incoming_rake": 0,
    "is_special_train": 0,
    "route_historical_ontime_pct": 67.8
}


# =========================
# Make prediction
# =========================

predicted_delay = predict_delay(train_data)


# =========================
# Display result
# =========================

print("\n==============================")
print("       TRAIN ETA PREDICTION")
print("==============================")

print(f"Train Number    : {train_data['train_number']}")
print(f"Predicted Delay : {predicted_delay:.0f} minutes")

if predicted_delay < 5:
    status = "On Time"
elif predicted_delay < 30:
    status = "Slightly Delayed"
elif predicted_delay < 60:
    status = "Delayed"
else:
    status = "Highly Delayed"

print(f"Train Status    : {status}")

print("==============================")