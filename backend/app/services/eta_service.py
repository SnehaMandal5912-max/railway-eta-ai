def calculate_eta(distance_km: float, speed_kmph: float, delay_minutes: int = 0):
    if speed_kmph <= 0:
        return None

    travel_time_hours = distance_km / speed_kmph
    travel_time_minutes = travel_time_hours * 60

    eta_minutes = round(travel_time_minutes + delay_minutes)

    return eta_minutes