import { useState, useEffect } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  Tooltip,
} from "react-leaflet";

import L from "leaflet";
import trainData from "./trainData";

const trainIcon = L.divIcon({
  className: "train-marker",
  html: `
    <div style="
      background: white;
      border: 3px solid #ef4444;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      box-shadow: 0 0 15px rgba(239,68,68,0.8);
    ">
      🚆
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

const createStationIcon = (type) => {
  let background = "#3b82f6";
  let size = 18;

  if (type === "current") {
    background = "#10b981";
    size = 24;
  }

  if (type === "destination") {
    background = "#a855f7";
    size = 20;
  }

  return L.divIcon({
    className: "station-marker",
    html: `
      <div style="
        background: ${background};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 10px ${background};
      ">
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function RailwayMap({
  onStationChange,
  onProgressChange,
  onLocationChange,
}) {
  const route = [
    [22.5839, 88.3428],
    [22.68, 88.3450],
    [22.78, 88.3460],
    [22.88, 88.3470],
    [23.0071, 88.3484],
    [23.08, 88.25],
    [23.15, 88.05],
    [23.2324, 87.8615],
  ];

  const stations = [
    {
      name: "Howrah Junction",
      position: [22.5839, 88.3428],
      type: "start",
      label: "START",
    },
    {
      name: "Bandel Junction",
      position: [23.0071, 88.3484],
      type: "next",
      label: "NEXT",
    },
    {
      name: "Barddhaman Junction",
      position: [23.2324, 87.8615],
      type: "destination",
      label: "DESTINATION",
    },
  ];

  const [trainPosition, setTrainPosition] = useState([
    trainData.currentLocation.lat,
    trainData.currentLocation.lng,
  ]);

  const getRoutePosition = (progress) => {
    const totalSegments = route.length - 1;

    const exactPosition = progress * totalSegments;

    const segmentIndex = Math.min(
      Math.floor(exactPosition),
      totalSegments - 1
    );

    const segmentProgress =
      exactPosition - segmentIndex;

    const start = route[segmentIndex];
    const end = route[segmentIndex + 1];

    const lat =
      start[0] +
      (end[0] - start[0]) * segmentProgress;

    const lng =
      start[1] +
      (end[1] - start[1]) * segmentProgress;

    return [lat, lng];
  };

  const calculateProgress = (position) => {
    const start = route[0];
    const end = route[route.length - 1];

    const totalDistance = Math.sqrt(
      Math.pow(end[0] - start[0], 2) +
        Math.pow(end[1] - start[1], 2)
    );

    const currentDistance = Math.sqrt(
      Math.pow(position[0] - start[0], 2) +
        Math.pow(position[1] - start[1], 2)
    );

    let progress =
      (currentDistance / totalDistance) * 100;

    progress = Math.max(
      0,
      Math.min(100, progress)
    );

    return Math.round(progress);
  };

  // ---------------------------------------
  // Simulated live train movement
  // ---------------------------------------

  useEffect(() => {
    let progress = 0;

    const interval = setInterval(() => {
      progress += 0.002;

      if (progress > 1) {
        progress = 0;
      }

      const newPosition =
        getRoutePosition(progress);

      setTrainPosition(newPosition);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------
  // Update journey progress
  // ---------------------------------------

  useEffect(() => {
    const progress =
      calculateProgress(trainPosition);

    if (onProgressChange) {
      onProgressChange(progress);
    }
  }, [
    trainPosition,
    onProgressChange,
  ]);

  // ---------------------------------------
  // Determine live station information
  // ---------------------------------------

  useEffect(() => {
    const [lat] = trainPosition;

    let currentStation;
    let nextStation;
    let upcomingStation;
    let locationType;
    let locationDescription;

    if (lat < 22.60) {
      currentStation = "Howrah Junction";
      nextStation = "Bandel Junction";
      upcomingStation = "Barddhaman Junction";

      locationType = "At Station";

      locationDescription =
        "Train is currently at Howrah Junction";
    } else if (lat < 22.98) {
      currentStation = "Between Stations";
      nextStation = "Bandel Junction";
      upcomingStation = "Barddhaman Junction";

      locationType = "Between Stations";

      locationDescription =
        "Train is currently between Howrah Junction and Bandel Junction";
    } else if (lat < 23.03) {
      currentStation = "Bandel Junction";
      nextStation = "Barddhaman Junction";
      upcomingStation = "Barddhaman Junction";

      locationType = "At Station";

      locationDescription =
        "Train is currently at Bandel Junction";
    } else if (lat < 23.20) {
      currentStation = "Between Stations";
      nextStation = "Barddhaman Junction";
      upcomingStation = "Destination";

      locationType = "Between Stations";

      locationDescription =
        "Train is currently between Bandel Junction and Barddhaman Junction";
    } else {
      currentStation = "Barddhaman Junction";
      nextStation = "Destination";
      upcomingStation = "End of Route";

      locationType = "At Station";

      locationDescription =
        "Train has reached Barddhaman Junction";
    }

    if (onStationChange) {
      onStationChange({
        currentStation,
        nextStation,
        upcomingStation,
      });
    }

    if (onLocationChange) {
      onLocationChange({
        type: locationType,
        description: locationDescription,
        latitude: trainPosition[0],
        longitude: trainPosition[1],
      });
    }
  }, [
    trainPosition,
    onStationChange,
    onLocationChange,
  ]);

  // ---------------------------------------
  // Determine station marker status
  // ---------------------------------------

  const getStationType = (stationName) => {
    const [lat] = trainPosition;

    if (
      stationName === "Howrah Junction" &&
      lat < 22.98
    ) {
      return "current";
    }

    if (
      stationName === "Bandel Junction" &&
      lat >= 22.98 &&
      lat < 23.20
    ) {
      return "current";
    }

    if (
      stationName === "Bandel Junction" &&
      lat < 22.98
    ) {
      return "next";
    }

    if (
      stationName === "Barddhaman Junction" &&
      lat >= 23.20
    ) {
      return "current";
    }

    if (
      stationName === "Barddhaman Junction" &&
      lat < 23.20
    ) {
      return "next";
    }

    return "next";
  };

  // ---------------------------------------
  // LIVE station information for map panel
  // ---------------------------------------

  const [lat] = trainPosition;

  let liveCurrentStation;
  let liveNextStation;

  if (lat < 22.60) {
    liveCurrentStation = "Howrah Junction";
    liveNextStation = "Bandel Junction";
  } else if (lat < 22.98) {
    liveCurrentStation = "Between Stations";
    liveNextStation = "Bandel Junction";
  } else if (lat < 23.03) {
    liveCurrentStation = "Bandel Junction";
    liveNextStation = "Barddhaman Junction";
  } else if (lat < 23.20) {
    liveCurrentStation = "Between Stations";
    liveNextStation = "Barddhaman Junction";
  } else {
    liveCurrentStation = "Barddhaman Junction";
    liveNextStation = "Destination";
  }

  const currentProgress =
    calculateProgress(trainPosition);

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
      }}
    >
      <MapContainer
        center={[22.9, 88.2]}
        zoom={9}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Railway Route */}
        <Polyline
          positions={route}
          pathOptions={{
            color: "red",
            weight: 5,
            opacity: 0.8,
          }}
        />

        {/* Live Train Marker */}
        <Marker
          position={trainPosition}
          icon={trainIcon}
        >
          <Popup>
            <strong>
              🚆 Train {trainData.trainNumber}
            </strong>

            <br />

            {trainData.trainName}

            <br />
            <br />

            <strong>
              Current Location
            </strong>

            <br />

            Latitude:{" "}
            {trainPosition[0].toFixed(4)}

            <br />

            Longitude:{" "}
            {trainPosition[1].toFixed(4)}

            <br />
            <br />

            <strong>
              Journey Progress:
            </strong>{" "}
            {currentProgress}%
          </Popup>
        </Marker>

        {/* Station Markers */}
        {stations.map((station) => (
          <Marker
            key={station.name}
            position={station.position}
            icon={createStationIcon(
              getStationType(station.name)
            )}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -10]}
            >
              <span
                style={{
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
              >
                {station.name}
              </span>
            </Tooltip>

            <Popup>
              <strong>
                📍 {station.name}
              </strong>

              <br />
              <br />

              {station.label}
            </Popup>
          </Marker>
        ))}

        {/* Train Accuracy / Movement Circle */}
        <CircleMarker
          center={trainPosition}
          radius={12}
          pathOptions={{
            color: "#10b981",
            fillColor: "#10b981",
            fillOpacity: 0.15,
            weight: 2,
          }}
        />
      </MapContainer>

      {/* -----------------------------------
          LIVE TRAIN STATUS PANEL
          ----------------------------------- */}

      <div
        style={{
          position: "absolute",
          top: "15px",
          right: "15px",
          zIndex: 1000,
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid #334155",
          borderRadius: "12px",
          padding: "14px 16px",
          minWidth: "220px",
          color: "white",
          boxShadow:
            "0 8px 25px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            color: "#94a3b8",
            marginBottom: "5px",
          }}
        >
          🚆 LIVE TRAIN STATUS
        </div>

        <div
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "8px",
          }}
        >
          Train {trainData.trainNumber}
        </div>

        <div
          style={{
            fontSize: "13px",
            marginBottom: "6px",
          }}
        >
          📍 {liveCurrentStation}
        </div>

        <div
          style={{
            fontSize: "13px",
            marginBottom: "8px",
          }}
        >
          ➡️ Next: {liveNextStation}
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "#34d399",
            marginBottom: "5px",
          }}
        >
          Journey Progress:{" "}
          <strong>
            {currentProgress}%
          </strong>
        </div>

        <div
          style={{
            fontSize: "11px",
            color: "#64748b",
            marginTop: "8px",
          }}
        >
          ● Live simulation
        </div>
      </div>
    </div>
  );
}

export default RailwayMap;