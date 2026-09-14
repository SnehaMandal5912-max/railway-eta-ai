
import argparse
from pathlib import Path

import joblib
import pandas as pd


DEFAULT_DATASET = "Train_details_22122017.csv"
LEGACY_DATASET = "isl_wise_train_detail_03082015_v1.csv"
DEFAULT_MODEL = "railway_eta_model.pkl"


def normalize_train_number(value):
	value = str(value).strip().strip("'")
	if value.lower() in {"", "nan", "none", "null"} or not value.isdigit():
		return ""
	return value.zfill(5)


def normalize_dataset(data):
	column_aliases = {
		"Train No": "Train No.",
		"Train Name": "train Name",
		"SEQ": "islno",
		"Station Code": "station Code",
		"Station Name": "Station Name",
		"Departure Time": "Departure time",
		"Arrival Time": "Arrival time",
		"Source Station": "Source Station Code",
		"Source Station Name": "source Station Name",
		"Destination Station": "Destination station Code",
		"Destination Station Name": "Destination Station Name",
	}
	data = data.rename(columns=column_aliases)
	data["Train No."] = data["Train No."].map(normalize_train_number)
	data["islno"] = pd.to_numeric(data["islno"], errors="coerce")
	return data


def clock_minutes(value):
	"""Convert a CSV time such as '23:40:00' into minutes after midnight."""
	value = str(value).strip().strip("'")
	if value.lower() in {"", "na", "nan", "none", "null"}:
		return None
	try:
		return int(value[:2]) * 60 + int(value[3:5])
	except (TypeError, ValueError):
		return None


def next_occurrence(clock_value, previous_minutes):
	"""Place a clock time on the first day after the previous event."""
	minutes = clock_minutes(clock_value)
	if minutes is None:
		return previous_minutes
	while minutes < previous_minutes:
		minutes += 24 * 60
	return minutes


def load_route(dataset_path, train_number, data=None):
	if data is None:
		data = normalize_dataset(pd.read_csv(dataset_path, dtype=str))
	else:
		data = normalize_dataset(data)
	train_number = normalize_train_number(train_number)
	route = data[data["Train No."] == train_number].copy()
	if route.empty:
		raise ValueError(f"Train {train_number} was not found in {dataset_path}")

	route["Distance"] = pd.to_numeric(route["Distance"], errors="coerce")
	route = route.sort_values(["Distance", "islno"], kind="stable")
	route = route.drop_duplicates(["station Code", "Distance"], keep="first")
	route = route.reset_index(drop=True)

	start = None
	for _, row in route.iterrows():
		start = clock_minutes(row["Departure time"])
		if start is None:
			start = clock_minutes(row["Arrival time"])
		if start is not None:
			break
	if start is None:
		raise ValueError(f"Train {train_number} has no usable starting time")
	previous = start
	arrivals = []
	departures = []
	for index, row in route.iterrows():
		arrival = start if index == 0 else next_occurrence(row["Arrival time"], previous)
		departure = arrival if index == len(route) - 1 else next_occurrence(
			row["Departure time"], arrival
		)
		arrivals.append(arrival)
		departures.append(departure)
		previous = departure

	route["scheduled_arrival"] = [minute - start for minute in arrivals]
	route["scheduled_departure"] = [minute - start for minute in departures]
	route["station Code"] = route["station Code"].str.strip()
	route["Station Name"] = route["Station Name"].str.strip()
	return route


def build_model(dataset_path):
	"""Build a serializable route model for all trains in the timetable."""
	data = normalize_dataset(pd.read_csv(dataset_path, dtype=str))
	train_numbers = (
		data["Train No."]
		.dropna()
		.loc[lambda values: values != ""]
		.unique()
	)
	return {
		"type": "schedule_eta_model",
		"source": str(dataset_path),
		"routes": {
			train_number: load_route(dataset_path, train_number, data)
			for train_number in train_numbers
		},
	}


def actual_elapsed_minutes(actual_time, start_clock, scheduled_elapsed):
	"""Convert an observed clock time to the trip day nearest its schedule."""
	observed = clock_minutes(actual_time)
	schedule_clock = (start_clock + scheduled_elapsed) % (24 * 60)
	while observed < schedule_clock:
		observed += 24 * 60
	return observed - schedule_clock + scheduled_elapsed


def print_eta(route, station, actual_time):
	station_matches = route[route["station Code"].str.upper() == station.upper()]
	if station_matches.empty:
		raise ValueError(f"Station code {station} is not on this train")

	current_index = station_matches.index[0]
	current = route.loc[current_index]
	start_clock = clock_minutes(route.loc[0, "Departure time"])
	elapsed = actual_elapsed_minutes(actual_time, start_clock, current["scheduled_arrival"])
	delay = elapsed - current["scheduled_arrival"]

	print(f"Train {route.loc[0, 'Train No.']} - {route.loc[0, 'train Name'].strip()}")
	print(f"Current station: {current['station Code']} ({current['Station Name']})")
	print(f"Observed time: {actual_time} | Delay: {delay:+d} minutes")
	print("\nEstimated downstream arrivals:")
	for _, stop in route.loc[current_index + 1 :].iterrows():
		eta_minutes = stop["scheduled_arrival"] + delay
		eta_clock = f"{int(eta_minutes // 60) % 24:02d}:{int(eta_minutes % 60):02d}"
		print(f"{stop['station Code']:5s} {stop['Station Name']:<20s} ETA {eta_clock}")


def main():
	parser = argparse.ArgumentParser(description="Calculate train delay and ETA.")
	parser.add_argument("--train", help="Train number, for example 00851")
	parser.add_argument("--station", help="Current station code, for example VSKP")
	parser.add_argument("--actual-time", help="Observed arrival time, for example 05:35")
	parser.add_argument("--data", default=DEFAULT_DATASET, help="Path to the timetable CSV")
	parser.add_argument(
		"--build-model",
		action="store_true",
		help="Build and save the serialized ETA model",
	)
	parser.add_argument("--output", default=DEFAULT_MODEL, help="Output .pkl path")
	args = parser.parse_args()

	dataset_path = Path(args.data)
	if not dataset_path.exists() and args.data == DEFAULT_DATASET:
		dataset_path = Path(LEGACY_DATASET)
	if not dataset_path.exists():
		raise SystemExit(f"Dataset not found: {dataset_path}")
	if args.build_model:
		model = build_model(dataset_path)
		joblib.dump(model, args.output)
		print(f"Saved {len(model['routes'])} train routes to {args.output}")
		return
	if not all((args.train, args.station, args.actual_time)):
		parser.error("--train, --station, and --actual-time are required unless --build-model is used")
	try:
		route = load_route(dataset_path, args.train)
		print_eta(route, args.station, args.actual_time)
	except (KeyError, ValueError) as error:
		raise SystemExit(f"Error: {error}") from error


if __name__ == "__main__":
	main()