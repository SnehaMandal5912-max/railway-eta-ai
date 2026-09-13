import trainData from "../trainData";

const API_BASE_URL = "http://localhost:8000";
const TRAIN_NUMBER = trainData.trainNumber || "12345";

const endpointSources = {};

function updateEndpointSource(endpoint, source) {
  endpointSources[endpoint] = source;
}

export function getApiSourceStatus() {
  const sources = Object.values(endpointSources);

  if (sources.length === 0) {
    return "UNKNOWN";
  }

  if (sources.every((source) => source === "BACKEND")) {
    return "BACKEND";
  }

  if (sources.every((source) => source === "MOCK")) {
    return "MOCK";
  }

  return "MIXED";
}

async function fetchAPI(endpoint, fallback) {
  try {
    const response = await fetch(
      `${API_BASE_URL}${endpoint}`
    );

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status}`
      );
    }

    const data = await response.json();

    updateEndpointSource(endpoint, "BACKEND");

    return data;
  } catch (error) {
    console.warn(
      `Backend unavailable for ${endpoint}. Using fallback data.`
    );

    updateEndpointSource(endpoint, "MOCK");

    return fallback;
  }
}

/* =====================================================
   TRAIN SEARCH
===================================================== */

export async function searchTrain(trainNumber) {
  const query = String(trainNumber || "").trim();

  if (!query) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/trains/search?train_number=${encodeURIComponent(
        query
      )}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    updateEndpointSource(
      "/trains/search",
      "BACKEND"
    );

    return {
      ...data,

      trainNumber:
        data.train_number ??
        data.trainNumber ??
        query,

      trainName:
        data.train_name ??
        data.trainName ??
        "Unknown Train",

      status:
        data.status ??
        "Unknown",
    };
  } catch (error) {
    console.warn(
      "Train search backend unavailable."
    );

    updateEndpointSource(
      "/trains/search",
      "MOCK"
    );

    return null;
  }
}

/* =====================================================
   TRAIN DETAILS
===================================================== */

export async function getTrainDetails() {
  const data = await fetchAPI(
    `/trains/${TRAIN_NUMBER}`,
    trainData
  );

  return {
    ...data,

    trainNumber:
      data.train_number ??
      data.trainNumber ??
      trainData.trainNumber,

    trainName:
      data.train_name ??
      data.trainName ??
      trainData.trainName,

    source:
      data.source ??
      trainData.source,

    finalDestination:
      data.destination ??
      data.final_destination ??
      data.finalDestination ??
      trainData.finalDestination,

    status:
      data.status ??
      trainData.status,

    currentStation:
      data.current_station ??
      data.currentStation ??
      trainData.currentStation,

    nextStation:
      data.next_station ??
      data.nextStation ??
      trainData.nextStation,
  };
}

/* =====================================================
   TRAIN STATUS
===================================================== */

export async function getTrainStatus() {
  const fallback = {
    train_number: TRAIN_NUMBER,
    status: trainData.status,
    current_station:
      trainData.currentStation,
    next_station:
      trainData.nextStation,
    delay_minutes:
      trainData.delay,
    delay_reason:
      trainData.delayReason,
    destination:
      trainData.finalDestination,
    train_name:
      trainData.trainName,
  };

  const data = await fetchAPI(
    `/trains/${TRAIN_NUMBER}/status`,
    fallback
  );

  return {
    ...data,

    trainNumber:
      data.train_number ??
      data.trainNumber ??
      TRAIN_NUMBER,

    trainName:
      data.train_name ??
      data.trainName ??
      trainData.trainName,

    status:
      data.status ??
      trainData.status,

    currentStation:
      data.current_station ??
      data.currentStation ??
      trainData.currentStation,

    nextStation:
      data.next_station ??
      data.nextStation ??
      trainData.nextStation,

    delay:
      data.delay_minutes ??
      data.delay ??
      trainData.delay,

    delayReason:
      data.delay_reason ??
      data.delayReason ??
      trainData.delayReason,

    finalDestination:
      data.destination ??
      data.final_destination ??
      data.finalDestination ??
      trainData.finalDestination,

    predictionConfidence:
      data.prediction_confidence !== undefined
        ? Number(data.prediction_confidence) * 100
        : Number(
            trainData.predictionConfidence
          ),
  };
}

/* =====================================================
   ETA
===================================================== */

export async function getETA() {
  const fallback = {
    train_number: TRAIN_NUMBER,
    current_station:
      trainData.currentStation,
    destination:
      trainData.finalDestination,
    predicted_arrival:
      trainData.predictedEta,
    delay_minutes:
      trainData.etaDifference,
    prediction_confidence:
      Number(
        trainData.predictionConfidence
      ) / 100,
  };

  const data = await fetchAPI(
    `/trains/${TRAIN_NUMBER}/eta`,
    fallback
  );

  return {
    ...data,

    trainNumber:
      data.train_number ??
      data.trainNumber ??
      TRAIN_NUMBER,

    currentStation:
      data.current_station ??
      data.currentStation ??
      trainData.currentStation,

    finalDestination:
      data.destination ??
      data.final_destination ??
      data.finalDestination ??
      trainData.finalDestination,

    predictedEta:
      data.predicted_arrival ??
      data.predictedEta ??
      trainData.predictedEta,

    etaDifference:
      data.delay_minutes ??
      data.etaDifference ??
      trainData.etaDifference,

    predictionConfidence:
      data.prediction_confidence !== undefined
        ? Number(data.prediction_confidence) * 100
        : Number(
            trainData.predictionConfidence
          ),

    scheduledEta:
      data.scheduled_arrival ??
      data.scheduledEta ??
      trainData.scheduledEta,
  };
}

/* =====================================================
   DELAY PREDICTION
===================================================== */

export async function getDelayPrediction() {
  const fallback = {
    train_number: TRAIN_NUMBER,
    current_station:
      trainData.currentStation,
    destination:
      trainData.finalDestination,
    predicted_delay_minutes:
      trainData.delay,
    delay_probability: 0,
    delay_reason:
      trainData.delayReason,
  };

  const data = await fetchAPI(
    `/trains/${TRAIN_NUMBER}/delay`,
    fallback
  );

  return {
    ...data,

    trainNumber:
      data.train_number ??
      data.trainNumber ??
      TRAIN_NUMBER,

    currentStation:
      data.current_station ??
      data.currentStation ??
      trainData.currentStation,

    finalDestination:
      data.destination ??
      data.final_destination ??
      data.finalDestination ??
      trainData.finalDestination,

    predictedDelay:
      data.predicted_delay_minutes ??
      data.predictedDelay ??
      trainData.delay,

    delayProbability:
      data.delay_probability ??
      data.delayProbability ??
      0,

    delayReason:
      data.delay_reason ??
      data.delayReason ??
      trainData.delayReason,
  };
}

/* =====================================================
   DELAY REASON
===================================================== */

export async function getDelayReason() {
  const fallback = {
    train_number: TRAIN_NUMBER,
    delay_status:
      trainData.delay > 0
        ? "Delayed"
        : "On Time",
    delay_minutes:
      trainData.delay,
    delay_reason:
      trainData.delayReason,
    last_updated: null,
  };

  const data = await fetchAPI(
    `/trains/${TRAIN_NUMBER}/delay-reason`,
    fallback
  );

  return {
    ...data,

    trainNumber:
      data.train_number ??
      data.trainNumber ??
      TRAIN_NUMBER,

    delayStatus:
      data.delay_status ??
      data.delayStatus ??
      "Unknown",

    delayMinutes:
      data.delay_minutes ??
      data.delayMinutes ??
      trainData.delay,

    delayReason:
      data.delay_reason ??
      data.delayReason ??
      trainData.delayReason,

    lastUpdated:
      data.last_updated ??
      data.lastUpdated ??
      null,
  };
}

/* =====================================================
   TRAIN ROUTE
===================================================== */

export async function getTrainRoute() {
  const fallback = {
    train_number: TRAIN_NUMBER,
    source:
      trainData.source,
    destination:
      trainData.finalDestination,
    total_stations:
      Array.isArray(trainData.upcomingStations)
        ? trainData.upcomingStations.length
        : 0,
    route: [],
  };

  const data = await fetchAPI(
    `/trains/${TRAIN_NUMBER}/route`,
    fallback
  );

  const backendRoute =
    Array.isArray(data.route)
      ? data.route
      : [];

  return {
    ...data,

    trainNumber:
      data.train_number ??
      data.trainNumber ??
      TRAIN_NUMBER,

    source:
      data.source ??
      trainData.source,

    finalDestination:
      data.destination ??
      data.final_destination ??
      data.finalDestination ??
      trainData.finalDestination,

    totalStations:
      data.total_stations ??
      data.totalStations ??
      backendRoute.length,

    route:
      backendRoute.map((station) => ({
        ...station,

        stationCode:
          station.station_code ??
          station.stationCode ??
          "",

        stationName:
          station.station_name ??
          station.stationName ??
          "Unknown Station",

        sequence:
          station.sequence ?? 0,
      })),
  };
}

/* =====================================================
   UPCOMING STATIONS
===================================================== */

export async function getUpcomingStations() {
  const fallback = {
    train_number: TRAIN_NUMBER,
    current_station:
      trainData.currentStation,
    upcoming_stations:
      trainData.upcomingStations || [],
  };

  const data = await fetchAPI(
    `/trains/${TRAIN_NUMBER}/upcoming-stations`,
    fallback
  );

  return {
    ...data,

    trainNumber:
      data.train_number ??
      data.trainNumber ??
      TRAIN_NUMBER,

    currentStation:
      data.current_station ??
      data.currentStation ??
      trainData.currentStation,

    upcomingStations:
      Array.isArray(data.upcoming_stations)
        ? data.upcoming_stations
        : Array.isArray(data.upcomingStations)
        ? data.upcomingStations
        : trainData.upcomingStations || [],
  };
}

/* =====================================================
   ALERTS
===================================================== */

export async function getAlerts() {
  return fetchAPI(
    "/alerts",
    trainData.alerts || []
  );
}

/* =====================================================
   RISK ZONES
===================================================== */

export async function getRiskZones() {
  return fetchAPI(
    "/risk-zones",
    trainData.riskZones || []
  );
}

/* =====================================================
   PASSENGER SAFETY
===================================================== */

export async function getSafetyRequests() {
  return fetchAPI(
    "/safety-requests",
    []
  );
}