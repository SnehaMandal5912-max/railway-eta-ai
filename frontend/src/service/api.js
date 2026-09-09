import trainData from "../trainData";

const API_BASE_URL = "http://localhost:5000/api";

async function fetchAPI(endpoint, fallback) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log(
      `Backend unavailable. Using mock data for ${endpoint}`
    );

    return fallback;
  }
}

export async function getTrainStatus() {
  return fetchAPI("/train-status", trainData);
}

export async function getETA() {
  return fetchAPI("/eta", {
    scheduledEta: trainData.scheduledEta,
    predictedEta: trainData.predictedEta,
    etaDifference: trainData.etaDifference,
  });
}

export async function getAlerts() {
  return fetchAPI(
    "/alerts",
    trainData.alerts || []
  );
}

export async function getRiskZones() {
  return fetchAPI(
    "/risk-zones",
    trainData.riskZones || []
  );
}