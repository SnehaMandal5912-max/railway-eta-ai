"""Interactive railway ETA calculator for eta_schedule.csv.

The CSV is deliberately read row-by-row because the supplied schedule file is
large.  No third-party package is required to run this program.
"""

import csv
import pickle
from datetime import datetime, time, timedelta
from pathlib import Path


CSV_FILE = Path(__file__).with_name("eta_schedule.csv")
PICKLE_FILE = Path(__file__).with_name("eta_schedule.pkl")
_SCHEDULE_INDEX = None


def clean(value):
    """Return a normalized value suitable for user-input comparisons."""
    return " ".join((value or "").strip().casefold().split())


def parse_clock(value):
    """Parse a CSV clock value such as 07:10 or 07:10:00."""
    value = (value or "").strip()
    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            return datetime.strptime(value, fmt).time()
        except ValueError:
            pass
    raise ValueError("time must be in HH:MM or HH:MM:SS format")


def parse_input_datetime(value, fallback):
    """Parse HH:MM or YYYY-MM-DD HH:MM, using fallback when blank."""
    value = value.strip()
    if not value:
        return fallback
    formats = ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%H:%M:%S", "%H:%M")
    for fmt in formats:
        try:
            parsed = datetime.strptime(value, fmt)
            if fmt.startswith("%H"):
                return datetime.combine(fallback.date(), parsed.time())
            return parsed
        except ValueError:
            pass
    raise ValueError("use HH:MM, or YYYY-MM-DD HH:MM")


def build_schedule_index():
    """Create a train-number index from the CSV using one pass."""
    index = {}
    try:
        with CSV_FILE.open("r", encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.DictReader(csv_file)
            for row in reader:
                train_number = clean(row.get("Train No."))
                if train_number:
                    index.setdefault(train_number, []).append(row)
    except FileNotFoundError:
        raise RuntimeError(f"CSV file was not found: {CSV_FILE}")
    except (OSError, csv.Error) as exc:
        raise RuntimeError(f"could not read {CSV_FILE}: {exc}") from exc

    for train_number, rows in index.items():
        index[train_number] = deduplicate_rows(rows)
    return index


def deduplicate_rows(rows):
    """Remove repeated schedule blocks found in some CSV exports."""
    # Some exports repeat the same route block many times for one train.
    # Keep the first occurrence of each schedule row so repeated blocks do not
    # become artificial extra days in the journey.
    unique_rows = []
    seen = set()
    for row in rows:
        key = (
            row.get("islno"),
            row.get("station Code"),
            row.get("Arrival time"),
            row.get("Departure time"),
        )
        if key not in seen:
            seen.add(key)
            unique_rows.append(row)
    return unique_rows


def load_schedule_index():
    """Load the generated pickle, or build an in-memory index as a fallback."""
    global _SCHEDULE_INDEX
    if _SCHEDULE_INDEX is not None:
        return _SCHEDULE_INDEX
    try:
        with PICKLE_FILE.open("rb") as pickle_file:
            index = pickle.load(pickle_file)
        if not isinstance(index, dict):
            raise ValueError("pickle does not contain a schedule index")
        _SCHEDULE_INDEX = index
    except (FileNotFoundError, EOFError, ValueError, pickle.UnpicklingError):
        _SCHEDULE_INDEX = build_schedule_index()
    except OSError as exc:
        raise RuntimeError(f"could not read {PICKLE_FILE}: {exc}") from exc
    return _SCHEDULE_INDEX


def load_train(train_number):
    """Find one train using the generated index."""
    return load_schedule_index().get(clean(train_number), [])


def station_index(rows, station_input):
    """Return the first row matching a station code or station name."""
    wanted = clean(station_input)
    for index, row in enumerate(rows):
        if wanted in (clean(row.get("station Code")), clean(row.get("Station Name"))):
            return index
    return None


def build_schedule_datetimes(rows, schedule_date):
    """Convert time-only CSV values into datetimes, handling midnight rollover."""
    events = []
    previous = datetime.combine(schedule_date, time.min)
    for row in rows:
        arrival = datetime.combine(schedule_date, parse_clock(row["Arrival time"]))
        departure = datetime.combine(schedule_date, parse_clock(row["Departure time"]))
        while arrival < previous:
            arrival += timedelta(days=1)
        while departure < arrival:
            departure += timedelta(days=1)
        events.append((arrival, departure))
        previous = departure
    return events


def format_duration(delta):
    seconds = max(0, int(delta.total_seconds()))
    days, remainder = divmod(seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes = remainder // 60
    parts = []
    if days:
        parts.append(f"{days} day{'s' if days != 1 else ''}")
    if hours:
        parts.append(f"{hours} hour{'s' if hours != 1 else ''}")
    if minutes or not parts:
        parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")
    return ", ".join(parts)


def calculate_eta(rows, start_index, destination_index, now, observed_time):
    """Calculate scheduled and estimated destination arrival values."""
    events = build_schedule_datetimes(rows, now.date())
    scheduled_start = events[start_index][1]

    # A schedule can be after midnight relative to today's current time.
    if scheduled_start < now - timedelta(hours=12):
        events = build_schedule_datetimes(rows, now.date() + timedelta(days=1))
        scheduled_start = events[start_index][1]

    scheduled_arrival = events[destination_index][0]
    delay = timedelta(0)
    if observed_time is not None:
        actual = observed_time
        while actual - scheduled_start > timedelta(hours=12):
            actual -= timedelta(days=1)
        while scheduled_start - actual > timedelta(hours=12):
            actual += timedelta(days=1)
        delay = actual - scheduled_start

    estimated_arrival = scheduled_arrival + delay
    return scheduled_start, scheduled_arrival, estimated_arrival, delay


def print_result(rows, start_index, destination_index, now, values):
    scheduled_start, scheduled_arrival, estimated_arrival, delay = values
    start = rows[start_index]
    destination = rows[destination_index]
    delay_minutes = round(delay.total_seconds() / 60)

    print("\n" + "=" * 58)
    print(f"Train: {rows[0]['Train No.']} - {rows[0]['train Name']}")
    print(f"Route: {start['Station Name']} -> {destination['Station Name']}")
    print(f"Scheduled departure from current station: {scheduled_start:%Y-%m-%d %H:%M}")
    print(f"Scheduled arrival:                     {scheduled_arrival:%Y-%m-%d %H:%M}")
    print(f"Estimated arrival (with delay):       {estimated_arrival:%Y-%m-%d %H:%M}")

    if delay_minutes > 0:
        print(f"Delay: {delay_minutes} minute(s) late")
    elif delay_minutes < 0:
        print(f"Early arrival: {-delay_minutes} minute(s) early")
    else:
        print("Delay: on time")

    remaining = estimated_arrival - now
    if remaining.total_seconds() > 0:
        print(f"Time remaining until estimated arrival: {format_duration(remaining)}")
    else:
        print("The estimated arrival time has already passed.")
    print("=" * 58)


def main():
    print("Railway ETA, delay and early-arrival calculator")
    print("Press Ctrl+C to exit.")
    while True:
        try:
            train_number = input("\nTrain number: ").strip()
            if not train_number:
                print("Train number is required.")
                continue
            rows = load_train(train_number)
            if not rows:
                print("No matching train was found in eta_schedule.csv.")
                continue

            first = rows[0]
            last = rows[-1]
            station = input(
                f"Current station code/name [{first['station Code']}]: "
            ).strip() or first["station Code"]
            start_index = station_index(rows, station)
            if start_index is None:
                print("That station is not present on this train.")
                continue

            destination = input(
                f"Destination code/name [{last['station Code']}]: "
            ).strip() or last["station Code"]
            destination_index = station_index(rows, destination)
            if destination_index is None or destination_index <= start_index:
                print("Destination must be a later station on this train.")
                continue

            now = datetime.now().replace(second=0, microsecond=0)
            current_value = input(
                f"Current date/time [now: {now:%Y-%m-%d %H:%M}]: "
            )
            now = parse_input_datetime(current_value, now)
            observed = input(
                "Actual departure/arrival time at current station "
                "(blank means on time): "
            ).strip()
            observed_time = parse_input_datetime(observed, now) if observed else None

            values = calculate_eta(
                rows, start_index, destination_index, now, observed_time
            )
            print_result(rows, start_index, destination_index, now, values)
        except (ValueError, RuntimeError) as exc:
            print(f"Input error: {exc}")
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye.")
            return


if __name__ == "__main__":
    main()