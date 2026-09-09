import { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import trainData from "./trainData";

// =========================
// SIMULATION CONFIGURATION
// =========================

const TICK_SECONDS = 0.5;
const SIMULATION_TIME_SCALE = 30;

// =========================
// ROUTE
// =========================

const ROUTE = [
  [22.5839, 88.3428], // Howrah
  [22.68, 88.345],
  [22.78, 88.346],
  [22.88, 88.347],
  [23.0071, 88.3484], // Bandel
  [23.08, 88.25],
  [23.15, 88.05],
  [23.2324, 87.8615], // Barddhaman
];

// =========================
// STATIONS
// =========================

const STATIONS = [
  {
    name: "Howrah Junction",
    routeIndex: 0,
    type: "origin",
    dwellSeconds: 4,
  },
  {
    name: "Bandel Junction",
    routeIndex: 4,
    type: "major",
    dwellSeconds: 5,
  },
  {
    name: "Barddhaman Junction",
    routeIndex: 7,
    type: "destination",
    dwellSeconds: 0,
  },
];

// =========================
// DEFAULT RISK ZONES
// =========================

const DEFAULT_RISKS = [
  {
    id: 1,
    name: "Bandel Track Zone",
    type: "Track Risk",
    severity: "High",
    lat: 22.88,
    lng: 88.347,
    radius: 900,
    impact: "Possible speed restriction",
  },
  {
    id: 2,
    name: "Wildlife Sensitive Zone",
    type: "Wildlife Risk",
    severity: "Medium",
    lat: 23.08,
    lng: 88.25,
    radius: 1200,
    impact: "Wildlife crossing possibility",
  },
  {
    id: 3,
    name: "Barddhaman Approach",
    type: "Track Risk",
    severity: "Low",
    lat: 23.15,
    lng: 88.05,
    radius: 800,
    impact: "Operational caution required",
  },
];

// =========================
// HELPERS
// =========================

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistance(pointA, pointB) {
  const R = 6371000;

  const lat1 = toRadians(pointA[0]);
  const lat2 = toRadians(pointB[0]);

  const dLat = toRadians(pointB[0] - pointA[0]);
  const dLng = toRadians(pointB[1] - pointA[1]);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

function interpolatePoint(pointA, pointB, ratio) {
  const safeRatio = Math.max(0, Math.min(1, ratio));

  return [
    pointA[0] + (pointB[0] - pointA[0]) * safeRatio,
    pointA[1] + (pointB[1] - pointA[1]) * safeRatio,
  ];
}

function getSeverityRank(severity) {
  if (severity === "High") return 3;
  if (severity === "Medium") return 2;
  if (severity === "Low") return 1;
  return 0;
}

function getRiskSpeedLimit(severity) {
  if (severity === "High") return 28;
  if (severity === "Medium") return 38;
  if (severity === "Low") return 48;

  return 60;
}

// =========================
// STATION ICON
// =========================

function createStationIcon(type, isCurrent = false) {
  let background = "#2563eb";

  if (type === "origin") {
    background = "#16a34a";
  }

  if (type === "destination") {
    background = "#dc2626";
  }

  if (isCurrent) {
    background = "#f59e0b";
  }

  return L.divIcon({
    className: "station-marker-wrapper",
    html: `
      <div
        style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${background};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        "
      ></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// =========================
// TRAIN ICON
// =========================

const trainIcon = L.divIcon({
  className: "train-marker-wrapper",
  html: `
    <div class="train-live-marker">
      <div class="train-live-glow"></div>
      <div class="train-live-icon">🚆</div>
    </div>
  `,
  iconSize: [46, 46],
  iconAnchor: [23, 23],
});

// =========================
// MAP RESIZE FIX
// =========================

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

// =========================
// RAILWAY MAP
// =========================

function RailwayMap({
  riskZones = DEFAULT_RISKS,
  onProgressUpdate,
  onLocationUpdate,
  onStationUpdate,
  onRiskUpdate,
}) {
  const [trainPosition, setTrainPosition] = useState(ROUTE[0]);
  const [speed, setSpeed] = useState(0);
  const [movement, setMovement] = useState("HALTED AT STATION");
  const [activeRisks, setActiveRisks] = useState([]);

  const simulation = useRef({
    distance: 0,
    phase: "HALT",
    dwellRemaining: STATIONS[0].dwellSeconds,
    destinationHold: false,
  });

  // =========================
  // ROUTE DISTANCES
  // =========================

  const routeDistances = useMemo(() => {
    const distances = [0];

    for (let i = 1; i < ROUTE.length; i++) {
      const segmentDistance = haversineDistance(
        ROUTE[i - 1],
        ROUTE[i]
      );

      distances.push(distances[i - 1] + segmentDistance);
    }

    return distances;
  }, []);

  const totalRouteDistance =
    routeDistances[routeDistances.length - 1];

  // =========================
  // STATION DISTANCES
  // =========================

  const stationDistances = useMemo(() => {
    return STATIONS.map((station) => ({
      ...station,
      distance: routeDistances[station.routeIndex],
    }));
  }, [routeDistances]);

  // =========================
  // POSITION FROM DISTANCE
  // =========================

  const getPositionFromDistance = (distance) => {
    const safeDistance = Math.max(
      0,
      Math.min(distance, totalRouteDistance)
    );

    for (let i = 1; i < routeDistances.length; i++) {
      if (safeDistance <= routeDistances[i]) {
        const segmentStart = routeDistances[i - 1];
        const segmentEnd = routeDistances[i];

        const ratio =
          (safeDistance - segmentStart) /
          (segmentEnd - segmentStart);

        return interpolatePoint(
          ROUTE[i - 1],
          ROUTE[i],
          ratio
        );
      }
    }

    return ROUTE[ROUTE.length - 1];
  };

  // =========================
  // CURRENT STATION INFO
  // =========================

  const getCurrentStationInfo = (distance) => {
    const tolerance = 120;

    let currentStation = null;
    let nextStation = null;

    for (let i = 0; i < stationDistances.length; i++) {
      const station = stationDistances[i];

      if (
        Math.abs(distance - station.distance) <= tolerance
      ) {
        currentStation = station;
        break;
      }

      if (station.distance > distance) {
        nextStation = station;
        break;
      }
    }

    if (!currentStation && !nextStation) {
      currentStation =
        stationDistances[stationDistances.length - 1];
    }

    return {
      currentStation,
      nextStation,
    };
  };

  // =========================
  // RISK DETECTION
  // =========================

  const calculateActiveRisks = (position) => {
    return riskZones.filter((risk) => {
      const distance = haversineDistance(
        position,
        [risk.lat, risk.lng]
      );

      return distance <= risk.radius;
    });
  };

  // =========================
  // MAIN SIMULATION
  // =========================

  useEffect(() => {
    const interval = setInterval(() => {
      const state = simulation.current;

      // -------------------------
      // DESTINATION HOLD
      // -------------------------

      if (state.destinationHold) {
        setSpeed(0);
        setMovement("DESTINATION");

        setTrainPosition(
          ROUTE[ROUTE.length - 1]
        );

        onProgressUpdate?.(100);

        onLocationUpdate?.({
          lat: ROUTE[ROUTE.length - 1][0],
          lng: ROUTE[ROUTE.length - 1][1],
          type: "Destination",
          description:
            "Train has reached the destination station.",
        });

        onStationUpdate?.({
          currentStation: "Barddhaman Junction",
          nextStation: "—",
          movement: "DESTINATION",
        });

        return;
      }

      // -------------------------
      // CURRENT POSITION
      // -------------------------

      const currentPosition = getPositionFromDistance(
        state.distance
      );

      const risks = calculateActiveRisks(
        currentPosition
      );

      setActiveRisks(risks);

      // -------------------------
      // RISK SPEED LIMIT
      // -------------------------

      const highestRisk = risks.reduce(
        (highest, risk) => {
          if (
            getSeverityRank(risk.severity) >
            getSeverityRank(highest?.severity)
          ) {
            return risk;
          }

          return highest;
        },
        null
      );

      const riskSpeedLimit = highestRisk
        ? getRiskSpeedLimit(highestRisk.severity)
        : 60;

      // -------------------------
      // HALT LOGIC
      // IMPORTANT FIX
      // -------------------------

      if (state.phase === "HALT") {
        setSpeed(0);
        setMovement("HALTED AT STATION");

        state.dwellRemaining -= TICK_SECONDS;

        const stationInfo =
          getCurrentStationInfo(state.distance);

        const station =
          stationInfo.currentStation ||
          stationDistances.find(
            (item) =>
              Math.abs(item.distance - state.distance) <
              200
          );

        if (station) {
          setTrainPosition(
            getPositionFromDistance(station.distance)
          );

          onStationUpdate?.({
            currentStation: station.name,
            nextStation:
              stationDistances[
                stationDistances.indexOf(station) + 1
              ]?.name || "—",
            movement: "HALTED AT STATION",
          });

          onLocationUpdate?.({
            lat: station.lat ?? ROUTE[station.routeIndex][0],
            lng: station.lng ?? ROUTE[station.routeIndex][1],
            type: "At Station",
            description: `Train is currently halted at ${station.name}.`,
          });
        }

        if (state.dwellRemaining <= 0) {
          if (
            station?.type === "destination" ||
            state.distance >= totalRouteDistance
          ) {
            state.destinationHold = true;
            return;
          }

          state.phase = "ACCELERATE";
        }

        onProgressUpdate?.(
          Math.min(
            100,
            Math.max(
              0,
              (state.distance / totalRouteDistance) * 100
            )
          )
        );

        return;
      }

      // =========================
      // MOVEMENT
      // =========================

      const normalSpeed = 60;

      let targetSpeed = normalSpeed;

      if (highestRisk) {
        targetSpeed = Math.min(
          normalSpeed,
          riskSpeedLimit
        );
      }

      // -------------------------
      // ACCELERATION
      // -------------------------

      if (state.phase === "ACCELERATE") {
        const acceleration = 10;

        setSpeed((previousSpeed) => {
          const newSpeed = Math.min(
            previousSpeed + acceleration,
            targetSpeed
          );

          return newSpeed;
        });

        state.phase = "CRUISE";
      }

      // -------------------------
      // CRUISE / DECELERATE
      // -------------------------

      const distanceToDestination =
        totalRouteDistance - state.distance;

      const destinationBrakeDistance = 900;

      if (
        distanceToDestination <
        destinationBrakeDistance
      ) {
        state.phase = "DECELERATE";
      }

      // -------------------------
      // APPROACH STATION
      // -------------------------

      let approachingStation = null;

      for (const station of stationDistances) {
        const distanceToStation =
          station.distance - state.distance;

        if (
          distanceToStation > 0 &&
          distanceToStation < 1000
        ) {
          approachingStation = station;
          break;
        }
      }

      if (approachingStation) {
        state.phase = "DECELERATE";
      }

      // -------------------------
      // SPEED CALCULATION
      // -------------------------

      let currentSpeed = speed;

      if (state.phase === "DECELERATE") {
        currentSpeed = Math.max(
          12,
          Math.min(currentSpeed || targetSpeed, targetSpeed)
        );
      } else {
        currentSpeed = Math.max(
          20,
          Math.min(currentSpeed || targetSpeed, targetSpeed)
        );
      }

      // -------------------------
      // CONVERT KM/H TO M/S
      // -------------------------

      const speedMetersPerSecond =
        (currentSpeed * 1000) / 3600;

      const distanceStep =
        speedMetersPerSecond *
        TICK_SECONDS *
        SIMULATION_TIME_SCALE;

      state.distance += distanceStep;

      // -------------------------
      // STATION ARRIVAL CHECK
      // -------------------------

      const arrivedStation =
        stationDistances.find(
          (station) =>
            Math.abs(
              state.distance - station.distance
            ) < 90
        );

      if (arrivedStation) {
        state.distance =
          arrivedStation.distance;

        state.phase = "HALT";
        state.dwellRemaining =
          arrivedStation.dwellSeconds;

        setSpeed(0);
        setMovement("HALTED AT STATION");

        setTrainPosition(
          getPositionFromDistance(state.distance)
        );

        onStationUpdate?.({
          currentStation: arrivedStation.name,
          nextStation:
            stationDistances[
              stationDistances.indexOf(arrivedStation) + 1
            ]?.name || "—",
          movement: "HALTED AT STATION",
        });

        onLocationUpdate?.({
          lat: ROUTE[arrivedStation.routeIndex][0],
          lng: ROUTE[arrivedStation.routeIndex][1],
          type: "At Station",
          description: `Train has arrived at ${arrivedStation.name}.`,
        });

        onProgressUpdate?.(
          (state.distance / totalRouteDistance) * 100
        );

        return;
      }

      // -------------------------
      // DESTINATION CHECK
      // -------------------------

      if (state.distance >= totalRouteDistance) {
        state.distance = totalRouteDistance;
        state.destinationHold = true;

        setTrainPosition(
          ROUTE[ROUTE.length - 1]
        );

        setSpeed(0);
        setMovement("DESTINATION");

        onProgressUpdate?.(100);

        return;
      }

      // -------------------------
      // UPDATE POSITION
      // -------------------------

      const newPosition =
        getPositionFromDistance(state.distance);

      setTrainPosition(newPosition);
      setSpeed(currentSpeed);

      // -------------------------
      // MOVEMENT STATUS
      // -------------------------

      let movementStatus = "IN TRANSIT";

      if (approachingStation) {
        movementStatus = "APPROACHING";
      }

      if (state.phase === "DECELERATE") {
        movementStatus =
          approachingStation
            ? "APPROACHING"
            : "DECELERATING";
      }

      setMovement(movementStatus);

      // -------------------------
      // STATION CALLBACK
      // -------------------------

      const stationInfo =
        getCurrentStationInfo(state.distance);

      onStationUpdate?.({
        currentStation:
          stationInfo.currentStation?.name ||
          "In Transit",

        nextStation:
          stationInfo.nextStation?.name ||
          "Barddhaman Junction",

        movement: movementStatus,
      });

      // -------------------------
      // LOCATION CALLBACK
      // -------------------------

      let locationType = "In Transit";
      let locationDescription =
        "Train is moving along the scheduled route.";

      if (approachingStation) {
        locationType = "Approaching Station";

        locationDescription = `Train is approaching ${approachingStation.name}.`;
      }

      onLocationUpdate?.({
        lat: newPosition[0],
        lng: newPosition[1],
        type: locationType,
        description: locationDescription,
      });

      // -------------------------
      // PROGRESS CALLBACK
      // -------------------------

      const progress =
        (state.distance / totalRouteDistance) * 100;

      onProgressUpdate?.(
        Math.min(100, Math.max(0, progress))
      );

      // -------------------------
      // RISK CALLBACK
      // -------------------------

      const highestSeverity =
        risks.length > 0
          ? risks.reduce((highest, risk) =>
              getSeverityRank(risk.severity) >
              getSeverityRank(highest.severity)
                ? risk
                : highest
            )
          : null;

      onRiskUpdate?.({
        activeRisks: risks,
        highestSeverity:
          highestSeverity?.severity || "Normal",
        totalActive: risks.length,
      });
    }, TICK_SECONDS * 1000);

    return () => clearInterval(interval);
  }, [
    riskZones,
    speed,
    routeDistances,
    totalRouteDistance,
    stationDistances,
    onProgressUpdate,
    onLocationUpdate,
    onStationUpdate,
    onRiskUpdate,
  ]);

  // =========================
  // ROUTE COMPLETION
  // =========================

  const completedRoute = useMemo(() => {
    const progress =
      (simulation.current.distance /
        totalRouteDistance) *
      100;

    return [
      ROUTE[0],
      ...ROUTE.slice(
        1,
        Math.max(
          1,
          Math.ceil((progress / 100) * ROUTE.length)
        )
      ),
      trainPosition,
    ];
  }, [
    trainPosition,
    totalRouteDistance,
  ]);

  // =========================
  // RISK STATUS
  // =========================

  const highestActiveRisk = useMemo(() => {
    if (!activeRisks.length) return null;

    return activeRisks.reduce((highest, risk) =>
      getSeverityRank(risk.severity) >
      getSeverityRank(highest.severity)
        ? risk
        : highest
    );
  }, [activeRisks]);

  // =========================
  // RENDER
  // =========================

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "500px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
      }}
    >
      <MapContainer
        center={[22.85, 88.2]}
        zoom={9}
        scrollWheelZoom={true}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "500px",
        }}
      >
        <MapResizeHandler />

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* =========================
            FULL ROUTE
        ========================= */}

        <Polyline
          positions={ROUTE}
          pathOptions={{
            color: "#64748b",
            weight: 5,
            opacity: 0.55,
          }}
        />

        {/* =========================
            COMPLETED ROUTE
        ========================= */}

        <Polyline
          positions={completedRoute}
          pathOptions={{
            color: "#2563eb",
            weight: 7,
            opacity: 0.95,
          }}
        />

        {/* =========================
            RISK ZONES
        ========================= */}

        {riskZones.map((risk) => {
          let fillOpacity = 0.12;

          if (risk.severity === "High") {
            fillOpacity = 0.22;
          }

          if (risk.severity === "Medium") {
            fillOpacity = 0.16;
          }

          return (
            <Circle
              key={risk.id}
              center={[risk.lat, risk.lng]}
              radius={risk.radius}
              pathOptions={{
                color:
                  risk.severity === "High"
                    ? "#dc2626"
                    : risk.severity === "Medium"
                    ? "#f59e0b"
                    : "#2563eb",

                fillOpacity,
                weight: 2,
              }}
            >
              <Popup>
                <strong>{risk.name}</strong>

                <br />

                Type: {risk.type}

                <br />

                Severity: {risk.severity}

                <br />

                Impact: {risk.impact}
              </Popup>
            </Circle>
          );
        })}

        {/* =========================
            STATIONS
        ========================= */}

        {STATIONS.map((station) => {
          const position =
            ROUTE[station.routeIndex];

          const isCurrent =
            Math.abs(
              simulation.current.distance -
                routeDistances[station.routeIndex]
            ) < 150;

          return (
            <Marker
              key={station.name}
              position={position}
              icon={createStationIcon(
                station.type,
                isCurrent
              )}
            >
              <Popup>
                <strong>{station.name}</strong>

                <br />

                Status:{" "}
                {station.type === "origin"
                  ? "Origin"
                  : station.type === "destination"
                  ? "Destination"
                  : "Major Station"}
              </Popup>
            </Marker>
          );
        })}

        {/* =========================
            LIVE TRAIN
        ========================= */}

        <Marker
          position={trainPosition}
          icon={trainIcon}
          zIndexOffset={1000}
        >
          <Popup>
            <strong>
              {trainData.trainNumber} —{" "}
              {trainData.trainName}
            </strong>

            <br />

            Status: {movement}

            <br />

            Speed: {Math.round(speed)} km/h

            <br />

            Route Progress:{" "}
            {Math.round(
              (simulation.current.distance /
                totalRouteDistance) *
                100
            )}
            %
          </Popup>
        </Marker>
      </MapContainer>

      {/* =========================
          OPERATIONAL TELEMETRY
      ========================= */}

      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          zIndex: 1000,
          background: "rgba(15, 23, 42, 0.92)",
          color: "white",
          padding: "12px 16px",
          borderRadius: "12px",
          boxShadow:
            "0 4px 18px rgba(0,0,0,0.25)",
          minWidth: "190px",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            opacity: 0.7,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Operational Telemetry
        </div>

        <div
          style={{
            fontSize: "18px",
            fontWeight: 700,
            marginTop: "3px",
          }}
        >
          {movement}
        </div>

        <div
          style={{
            marginTop: "6px",
            fontSize: "13px",
            opacity: 0.85,
          }}
        >
          Speed: {Math.round(speed)} km/h
        </div>
      </div>

      {/* =========================
          LIVE BADGE
      ========================= */}

      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          zIndex: 1000,
          background: "white",
          padding: "8px 12px",
          borderRadius: "999px",
          fontWeight: 700,
          fontSize: "12px",
          boxShadow:
            "0 3px 12px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          gap: "7px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#22c55e",
            display: "inline-block",
            animation:
              "railwayPulse 1.2s infinite",
          }}
        />

        LIVE SIMULATION
      </div>

      {/* =========================
          RISK INDICATOR
      ========================= */}

      {highestActiveRisk && (
        <div
          style={{
            position: "absolute",
            right: "16px",
            bottom: "60px",
            zIndex: 1000,
            background: "rgba(255,255,255,0.96)",
            padding: "10px 14px",
            borderRadius: "10px",
            boxShadow:
              "0 3px 14px rgba(0,0,0,0.2)",
            fontSize: "12px",
          }}
        >
          <strong>
            Active Risk
          </strong>

          <br />

          {highestActiveRisk.name}

          <br />

          Severity:{" "}
          {highestActiveRisk.severity}
        </div>
      )}

      {/* =========================
          MAP LEGEND
      ========================= */}

      <div
        style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          zIndex: 1000,
          background: "rgba(255,255,255,0.95)",
          padding: "10px 12px",
          borderRadius: "10px",
          boxShadow:
            "0 3px 12px rgba(0,0,0,0.18)",
          fontSize: "11px",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: "7px",
          }}
        >
          MAP LEGEND
        </div>

        <div
          style={{
            display: "flex",
            gap: "7px",
            alignItems: "center",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              width: "18px",
              height: "4px",
              background: "#2563eb",
              display: "inline-block",
            }}
          />

          Active Route
        </div>

        <div
          style={{
            display: "flex",
            gap: "7px",
            alignItems: "center",
          }}
        >
          <span>🚆</span>

          Live Train
        </div>
      </div>

      {/* =========================
          BOTTOM NOTICE
      ========================= */}

      <div
        style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          zIndex: 1000,
          background: "rgba(15,23,42,0.9)",
          color: "white",
          padding: "7px 11px",
          borderRadius: "8px",
          fontSize: "10px",
          opacity: 0.9,
        }}
      >
        Prototype simulation • Railway Control Room
      </div>

      {/* =========================
          ANIMATION CSS
      ========================= */}

      <style>
        {`
          @keyframes railwayPulse {
            0% {
              opacity: 1;
              transform: scale(1);
            }

            50% {
              opacity: 0.4;
              transform: scale(1.35);
            }

            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          .train-live-marker {
            width: 46px;
            height: 46px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .train-live-glow {
            position: absolute;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(37, 99, 235, 0.22);
            animation: trainGlow 1.2s infinite;
          }

          .train-live-icon {
            position: relative;
            z-index: 2;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: white;
            border: 3px solid #2563eb;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 3px 12px rgba(0,0,0,0.3);
          }

          @keyframes trainGlow {
            0% {
              transform: scale(0.8);
              opacity: 0.9;
            }

            50% {
              transform: scale(1.25);
              opacity: 0.25;
            }

            100% {
              transform: scale(0.8);
              opacity: 0.9;
            }
          }
        `}
      </style>
    </div>
  );
}

export default RailwayMap;