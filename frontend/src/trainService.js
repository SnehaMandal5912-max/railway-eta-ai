// Train service layer
// This file will connect the dashboard with the backend API later.

const API_BASE_URL = "http://localhost:8000";

// Get train information
export const getTrainData = async (trainNumber) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/train/${trainNumber}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch train data");
    }

    return await response.json();
  } catch (error) {
    console.error("Train API Error:", error);

    return null;
  }
};

// Get dynamic ETA prediction
export const getETAPrediction = async (trainNumber) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/train/${trainNumber}/eta`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch ETA prediction");
    }

    return await response.json();
  } catch (error) {
    console.error("ETA API Error:", error);

    return null;
  }
};

// Get live train location
export const getTrainLocation = async (trainNumber) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/train/${trainNumber}/location`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch train location");
    }

    return await response.json();
  } catch (error) {
    console.error("Location API Error:", error);

    return null;
  }
};