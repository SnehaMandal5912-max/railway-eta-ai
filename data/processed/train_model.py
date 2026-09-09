import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ==========================================
# 1. LOAD DATA
# ==========================================

DATA_PATH = "data/processed/clean_train.csv"

print("Loading dataset...")

df = pd.read_csv(DATA_PATH)

print("Dataset loaded:", df.shape)


# ==========================================
# 2. SELECT FEATURES
# ==========================================

features = [
    "train_number",
    "train_type",
    "year",
    "month",
    "day_of_week",
    "departure_hour",
    "is_weekend",
    "is_night_departure",
    "is_peak_hour",
    "is_festival_season",
    "season",
    "zone",
    "zone_abbr",
    "source_station_category",
    "destination_station_category",
    "distance_km",
    "num_scheduled_stops",
    "scheduled_travel_hours",
    "track_doubled",
    "is_hdn_route",
    "traction_type",
    "is_electrified",
    "psr_count",
    "is_circular_route",
    "is_monsoon_season",
    "is_fog_risk",
    "fog_risk_score",
    "zone_fog_index",
    "zone_congestion_index",
    "season_severity_score",
    "loco_age_years",
    "coach_age_years",
    "has_lhb_coaches",
    "is_rake_shared",
    "maintenance_score",
    "seat_utilisation_pct",
    "is_overloaded",
    "late_incoming_rake",
    "is_special_train",
    "route_historical_ontime_pct"
]

target = "delay_minutes"


# ==========================================
# 3. CREATE X AND Y
# ==========================================

X = df[features]
y = df[target]


# ==========================================
# 4. CATEGORICAL FEATURES
# ==========================================

categorical_features = [
    "train_type",
    "season",
    "zone",
    "zone_abbr",
    "source_station_category",
    "destination_station_category",
    "traction_type"
]

numeric_features = [
    col for col in features
    if col not in categorical_features
]


# ==========================================
# 5. USE A SMALLER TRAINING SAMPLE
# ==========================================
# 1.5 million rows is unnecessarily heavy
# for local training.
#
# We use 300,000 rows for training.
# Test set remains separate.

print("\nPreparing dataset...")

X_train_full, X_test, y_train_full, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

# Sample 300,000 training rows
SAMPLE_SIZE = 300000

if len(X_train_full) > SAMPLE_SIZE:

    sample_indices = X_train_full.sample(
        n=SAMPLE_SIZE,
        random_state=42
    ).index

    X_train = X_train_full.loc[sample_indices]
    y_train = y_train_full.loc[sample_indices]

else:

    X_train = X_train_full
    y_train = y_train_full


print("Training rows:", len(X_train))
print("Testing rows:", len(X_test))


# ==========================================
# 6. PREPROCESSING
# ==========================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=False
            ),
            categorical_features
        ),
        (
            "numeric",
            "passthrough",
            numeric_features
        )
    ]
)


# ==========================================
# 7. MODEL
# ==========================================

model = HistGradientBoostingRegressor(
    max_iter=150,
    learning_rate=0.08,
    max_leaf_nodes=31,
    l2_regularization=1.0,
    random_state=42
)


# ==========================================
# 8. PIPELINE
# ==========================================

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model)
    ]
)


# ==========================================
# 9. TRAIN MODEL
# ==========================================

print("\n===================================")
print("Training model...")
print("===================================\n")

pipeline.fit(X_train, y_train)

print("\nTraining completed!")


# ==========================================
# 10. PREDICTION
# ==========================================

print("\nMaking predictions...")

predictions = pipeline.predict(X_test)


# ==========================================
# 11. EVALUATION
# ==========================================

mae = mean_absolute_error(
    y_test,
    predictions
)

mse = mean_squared_error(
    y_test,
    predictions
)

rmse = mse ** 0.5

r2 = r2_score(
    y_test,
    predictions
)


print("\n===================================")
print("       MODEL PERFORMANCE")
print("===================================")

print(f"MAE  : {mae:.2f} minutes")
print(f"RMSE : {rmse:.2f} minutes")
print(f"R²   : {r2:.4f}")


# ==========================================
# 12. SAVE MODEL
# ==========================================

MODEL_PATH = "data/processed/eta_model.pkl"

joblib.dump(
    pipeline,
    MODEL_PATH
)

print("\n===================================")
print("Model saved successfully!")
print("===================================")

print(MODEL_PATH)