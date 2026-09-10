import trainData from "../trainData";

const API_BASE_URL = "http://localhost:5000/api";

/* =====================================================
   API DATA SOURCE TRACKING
   ===================================================== */

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

/* =====================================================
   COMMON API FETCH
   ===================================================== */

async function fetchAPI(endpoint, fallback) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    updateEndpointSource(endpoint, "BACKEND");

    return data;
  } catch (error) {
    console.log(
      `Backend unavailable. Using mock data for ${endpoint}`
    );

    updateEndpointSource(endpoint, "MOCK");

    return fallback;
  }
}

/* =====================================================
   TRAIN STATUS
   ===================================================== */

export async function getTrainStatus() {
  return fetchAPI("/train-status", trainData);
}

/* =====================================================
   DYNAMIC ETA
   ===================================================== */

export async function getETA() {
  return fetchAPI("/eta", {
    scheduledEta: trainData.scheduledEta,
    predictedEta: trainData.predictedEta,
    etaDifference: trainData.etaDifference,
  });
}

/* =====================================================
   OPERATIONAL ALERTS
   ===================================================== */

export async function getAlerts() {
  return fetchAPI(
    "/alerts",
    trainData.alerts || []
  );
}

/* =====================================================
   ROUTE / WILDLIFE RISK ZONES
   ===================================================== */

export async function getRiskZones() {
  return fetchAPI(
    "/risk-zones",
    trainData.riskZones || []
  );
}

/* =====================================================
   PASSENGER SAFETY ASSISTANCE
   ===================================================== */

export async function getSafetyRequests() {
  return fetchAPI(
    "/safety-requests",
    []
  );
}