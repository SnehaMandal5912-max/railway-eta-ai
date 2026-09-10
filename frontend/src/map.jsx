import { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import trainData from "./trainData";

const TICK_SECONDS = 0.5;
const SIMULATION_TIME_SCALE = 30;

/* =====================================================
   ROUTE
   ===================================================== */

const ROUTE = [
  [22.5839, 88.3428],
  [22.68, 88.345],
  [22.78, 88.346],
  [22.88, 88.347],
  [23.0071, 88.3484],
  [23.08, 88.25],
  [23.15, 88.05],
  [23.2324, 87.8615],
];

/* =====================================================
   STATIONS
   ===================================================== */

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

/* =====================================================
   DEFAULT RISK ZONES
   ===================================================== */

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

/* =====================================================
   GEO FUNCTIONS
   ===================================================== */

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

/* =====================================================
   RISK FUNCTIONS
   ===================================================== */

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

/* =====================================================
   STATION ICON
   ===================================================== */

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

/* =====================================================
   TRAIN ICON
   ===================================================== */

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

/* =====================================================
   MAP RESIZE
   ===================================================== */

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

/* =====================================================
   RAILWAY MAP
   ===================================================== */

function RailwayMap({
  riskZones = DEFAULT_RISKS,

  onProgressUpdate,
  onLocationUpdate,

  onStationUpdate,
  onRiskUpdate,

  onStationInfo,
  onRiskInfo,
}) {
  const [trainPosition, setTrainPosition] = useState(ROUTE[0]);

  const [speed, setSpeed] = useState(0);

  const [movement, setMovement] = useState(
    "HALTED AT STATION"
  );

  const [activeRisks, setActiveRisks] = useState([]);

  const callbacksRef = useRef({
    onProgressUpdate,
    onLocationUpdate,

    onStationUpdate:
      onStationUpdate || onStationInfo,

    onRiskUpdate:
      onRiskUpdate || onRiskInfo,
  });

  useEffect(() => {
    callbacksRef.current = {
      onProgressUpdate,
      onLocationUpdate,

      onStationUpdate:
        onStationUpdate || onStationInfo,

      onRiskUpdate:
        onRiskUpdate || onRiskInfo,
    };
  }, [
    onProgressUpdate,
    onLocationUpdate,
    onStationUpdate,
    onRiskUpdate,
    onStationInfo,
    onRiskInfo,
  ]);

  const speedRef = useRef(0);

  const simulation = useRef({
    distance: 0,
    phase: "HALT",
    dwellRemaining: STATIONS[0].dwellSeconds,
    destinationHold: false,
    lastArrivedStationIndex: 0,
  });

  const routeDistances = useMemo(() => {
    const distances = [0];

    for (let i = 1; i < ROUTE.length; i++) {
      distances.push(
        distances[i - 1] +
          haversineDistance(
            ROUTE[i - 1],
            ROUTE[i]
          )
      );
    }

    return distances;
  }, []);

  const totalRouteDistance =
    routeDistances[routeDistances.length - 1];

  const stationDistances = useMemo(() => {
    return STATIONS.map((station) => ({
      ...station,

      distance:
        routeDistances[station.routeIndex],
    }));
  }, [routeDistances]);

  const getPositionFromDistance = (distance) => {
    const safeDistance = Math.max(
      0,
      Math.min(distance, totalRouteDistance)
    );

    for (let i = 1; i < ROUTE.length; i++) {
      if (safeDistance <= routeDistances[i]) {
        const segmentStart =
          routeDistances[i - 1];

        const segmentEnd =
          routeDistances[i];

        const segmentLength =
          segmentEnd - segmentStart;

        const ratio =
          segmentLength === 0
            ? 0
            : (safeDistance - segmentStart) /
              segmentLength;

        return interpolatePoint(
          ROUTE[i - 1],
          ROUTE[i],
          ratio
        );
      }
    }

    return ROUTE[ROUTE.length - 1];
  };

  const getCurrentStationInfo = (distance, phase) => {
    const tolerance = 120;

    if (
      distance >=
      totalRouteDistance - tolerance
    ) {
      return {
        currentStation:
          stationDistances[
            stationDistances.length - 1
          ],

        nextStation: null,
      };
    }

    if (phase === "HALT") {
      for (
        let i = 0;
        i < stationDistances.length;
        i++
      ) {
        const station = stationDistances[i];

        if (
          Math.abs(
            distance - station.distance
          ) <= tolerance
        ) {
          return {
            currentStation: station,

            nextStation:
              stationDistances[i + 1] ||
              null,
          };
        }
      }
    }

    for (
      let i = 0;
      i < stationDistances.length;
      i++
    ) {
      if (
        stationDistances[i].distance >
        distance + tolerance
      ) {
        return {
          currentStation: null,
          nextStation: stationDistances[i],
        };
      }
    }

    return {
      currentStation: null,
      nextStation: null,
    };
  };

  const calculateActiveRisks = (position) => {
    return riskZones.filter((risk) => {
      const distance = haversineDistance(
        position,
        [risk.lat, risk.lng]
      );

      return distance <= risk.radius;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const state = simulation.current;

      const callbacks =
        callbacksRef.current;

      if (state.destinationHold) {
        speedRef.current = 0;

        setSpeed(0);

        setMovement("DESTINATION");

        setTrainPosition(
          ROUTE[ROUTE.length - 1]
        );

        callbacks.onProgressUpdate?.(100);

        callbacks.onLocationUpdate?.({
          lat:
            ROUTE[ROUTE.length - 1][0],

          lng:
            ROUTE[ROUTE.length - 1][1],

          type: "Destination",

          description:
            "Train has reached the destination station.",
        });

        callbacks.onStationUpdate?.({
          currentStation:
            "Barddhaman Junction",

          nextStation: "—",

          movement: "DESTINATION",
        });

        callbacks.onRiskUpdate?.({
          activeRisks: [],

          highestSeverity: "Normal",

          totalActive: 0,
        });

        return;
      }

      const currentPosition =
        getPositionFromDistance(
          state.distance
        );

      const risks =
        calculateActiveRisks(
          currentPosition
        );

      setActiveRisks(risks);

      const highestRisk =
        risks.reduce(
          (highest, risk) => {
            if (
              getSeverityRank(
                risk.severity
              ) >
              getSeverityRank(
                highest?.severity
              )
            ) {
              return risk;
            }

            return highest;
          },
          null
        );

      callbacks.onRiskUpdate?.({
        activeRisks: risks,

        highestSeverity:
          highestRisk?.severity ||
          "Normal",

        totalActive: risks.length,
      });

      if (state.phase === "HALT") {
        speedRef.current = 0;

        setSpeed(0);

        setMovement(
          "HALTED AT STATION"
        );

        state.dwellRemaining -=
          TICK_SECONDS;

        const stationInfo =
          getCurrentStationInfo(
            state.distance,
            state.phase
          );

        const station =
          stationInfo.currentStation;

        if (station) {
          setTrainPosition(
            getPositionFromDistance(
              station.distance
            )
          );

          const stationIndex =
            stationDistances.indexOf(
              station
            );

          callbacks.onStationUpdate?.({
            currentStation:
              station.name,

            nextStation:
              stationDistances[
                stationIndex + 1
              ]?.name || "—",

            movement:
              "HALTED AT STATION",
          });

          callbacks.onLocationUpdate?.({
            lat:
              ROUTE[
                station.routeIndex
              ][0],

            lng:
              ROUTE[
                station.routeIndex
              ][1],

            type: "At Station",

            description:
              `Train is currently halted at ${station.name}.`,
          });
        }

        callbacks.onProgressUpdate?.(
          Math.min(
            100,
            Math.max(
              0,
              (state.distance /
                totalRouteDistance) *
                100
            )
          )
        );

        if (
          state.dwellRemaining <= 0
        ) {
          if (
            state.lastArrivedStationIndex ===
            stationDistances.length - 1
          ) {
            state.destinationHold =
              true;

            return;
          }

          state.phase =
            "ACCELERATE";

          speedRef.current = 0;

          if (station) {
            state.lastArrivedStationIndex =
              stationDistances.indexOf(
                station
              );
          }
        }

        return;
      }

      const normalSpeed = 60;

      const riskSpeedLimit =
        highestRisk
          ? getRiskSpeedLimit(
              highestRisk.severity
            )
          : normalSpeed;

      const targetSpeed =
        Math.min(
          normalSpeed,
          riskSpeedLimit
        );

      let approachingStation = null;

      for (
        let i = 0;
        i < stationDistances.length;
        i++
      ) {
        const station =
          stationDistances[i];

        const distanceToStation =
          station.distance -
          state.distance;

        if (
          distanceToStation > 0 &&
          distanceToStation < 1000 &&
          i >
            state.lastArrivedStationIndex
        ) {
          approachingStation =
            station;

          break;
        }
      }

      if (approachingStation) {
        state.phase =
          "DECELERATE";
      }

      const distanceToDestination =
        totalRouteDistance -
        state.distance;

      if (
        distanceToDestination < 900
      ) {
        state.phase =
          "DECELERATE";
      }

      if (
        state.phase ===
        "ACCELERATE"
      ) {
        speedRef.current =
          Math.min(
            speedRef.current + 10,
            targetSpeed
          );

        state.phase = "CRUISE";
      }

      let currentSpeed =
        speedRef.current;

      if (
        state.phase ===
        "DECELERATE"
      ) {
        currentSpeed =
          Math.max(
            12,

            Math.min(
              currentSpeed ||
                targetSpeed,

              targetSpeed
            )
          );
      } else {
        currentSpeed =
          Math.max(
            20,

            Math.min(
              currentSpeed ||
                targetSpeed,

              targetSpeed
            )
          );
      }

      speedRef.current =
        currentSpeed;

      setSpeed(currentSpeed);

      const speedMetersPerSecond =
        (currentSpeed * 1000) /
        3600;

      const distanceStep =
        speedMetersPerSecond *
        TICK_SECONDS *
        SIMULATION_TIME_SCALE;

      state.distance +=
        distanceStep;

      let arrivedStation = null;

      let arrivedStationIndex = -1;

      for (
        let i = 0;
        i < stationDistances.length;
        i++
      ) {
        const station =
          stationDistances[i];

        if (
          i <=
          state.lastArrivedStationIndex
        ) {
          continue;
        }

        const distanceFromStation =
          Math.abs(
            state.distance -
              station.distance
          );

        if (
          distanceFromStation < 90
        ) {
          arrivedStation =
            station;

          arrivedStationIndex =
            i;

          break;
        }
      }

      if (arrivedStation) {
        state.distance =
          arrivedStation.distance;

        state.phase = "HALT";

        state.dwellRemaining =
          arrivedStation.dwellSeconds;

        state.lastArrivedStationIndex =
          arrivedStationIndex;

        speedRef.current = 0;

        setSpeed(0);

        setMovement(
          "HALTED AT STATION"
        );

        setTrainPosition(
          getPositionFromDistance(
            state.distance
          )
        );

        callbacks.onStationUpdate?.({
          currentStation:
            arrivedStation.name,

          nextStation:
            stationDistances[
              arrivedStationIndex + 1
            ]?.name || "—",

          movement:
            "HALTED AT STATION",
        });

        callbacks.onLocationUpdate?.({
          lat:
            ROUTE[
              arrivedStation
                .routeIndex
            ][0],

          lng:
            ROUTE[
              arrivedStation
                .routeIndex
            ][1],

          type: "At Station",

          description:
            `Train has arrived at ${arrivedStation.name}.`,
        });

        callbacks.onProgressUpdate?.(
          Math.min(
            100,
            Math.max(
              0,
              (state.distance /
                totalRouteDistance) *
                100
            )
          )
        );

        if (
          arrivedStation.type ===
          "destination"
        ) {
          state.destinationHold =
            true;

          state.phase = "HALT";

          return;
        }

        return;
      }

      if (
        state.distance >=
        totalRouteDistance
      ) {
        state.distance =
          totalRouteDistance;

        state.destinationHold =
          true;

        speedRef.current = 0;

        setTrainPosition(
          ROUTE[ROUTE.length - 1]
        );

        setSpeed(0);

        setMovement(
          "DESTINATION"
        );

        callbacks.onProgressUpdate?.(
          100
        );

        return;
      }

      const newPosition =
        getPositionFromDistance(
          state.distance
        );

      setTrainPosition(
        newPosition
      );

      let movementStatus =
        "IN TRANSIT";

      if (
        approachingStation
      ) {
        movementStatus =
          "APPROACHING";
      }

      if (
        state.phase ===
        "DECELERATE"
      ) {
        movementStatus =
          approachingStation
            ? "APPROACHING"
            : "DECELERATING";
      }

      setMovement(
        movementStatus
      );

      const stationInfo =
        getCurrentStationInfo(
          state.distance,
          state.phase
        );

      callbacks.onStationUpdate?.({
        currentStation:
          stationInfo
            .currentStation
            ?.name ||
          "In Transit",

        nextStation:
          stationInfo
            .nextStation
            ?.name ||
          "—",

        movement:
          movementStatus,
      });

      let locationType =
        "In Transit";

      let locationDescription =
        "Train is moving along the scheduled route.";

      if (
        approachingStation
      ) {
        locationType =
          "Approaching Station";

        locationDescription =
          `Train is approaching ${approachingStation.name}.`;
      }

      callbacks.onLocationUpdate?.({
        lat:
          newPosition[0],

        lng:
          newPosition[1],

        type:
          locationType,

        description:
          locationDescription,
      });

      const progress =
        (state.distance /
          totalRouteDistance) *
        100;

      callbacks.onProgressUpdate?.(
        Math.min(
          100,
          Math.max(
            0,
            progress
          )
        )
      );
    }, TICK_SECONDS * 1000);

    return () =>
      clearInterval(interval);
  }, []);

  const completedRoute =
    useMemo(() => {
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
            Math.ceil(
              (progress / 100) *
                ROUTE.length
            )
          )
        ),

        trainPosition,
      ];
    }, [
      trainPosition,
      totalRouteDistance,
    ]);

  const highestActiveRisk =
    useMemo(() => {
      if (!activeRisks.length) {
        return null;
      }

      return activeRisks.reduce(
        (highest, risk) =>
          getSeverityRank(
            risk.severity
          ) >
          getSeverityRank(
            highest.severity
          )
            ? risk
            : highest
      );
    }, [activeRisks]);

  const currentProgress =
    Math.min(
      100,
      Math.max(
        0,
        (simulation.current.distance /
          totalRouteDistance) *
          100
      )
    );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "450px",
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
          minHeight: "450px",
        }}
      >
        <MapResizeHandler />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline
          positions={ROUTE}
          pathOptions={{
            color: "#64748b",
            weight: 5,
            opacity: 0.55,
          }}
        />

        <Polyline
          positions={completedRoute}
          pathOptions={{
            color: "#2563eb",
            weight: 7,
            opacity: 0.95,
          }}
        />

        {riskZones.map((risk) => {
          const isActive =
            activeRisks.some(
              (activeRisk) =>
                activeRisk.id ===
                risk.id
            );

          let fillOpacity = 0.12;

          if (
            risk.severity === "High"
          ) {
            fillOpacity =
              isActive
                ? 0.32
                : 0.22;
          }

          if (
            risk.severity ===
            "Medium"
          ) {
            fillOpacity =
              isActive
                ? 0.24
                : 0.16;
          }

          return (
            <Circle
              key={risk.id}
              center={[
                risk.lat,
                risk.lng,
              ]}
              radius={
                risk.radius
              }
              pathOptions={{
                color:
                  risk.severity ===
                  "High"
                    ? "#dc2626"
                    : risk.severity ===
                      "Medium"
                    ? "#f59e0b"
                    : "#2563eb",

                fillOpacity,

                weight:
                  isActive
                    ? 3
                    : 2,

                opacity:
                  isActive
                    ? 1
                    : 0.75,
              }}
            >
              <Popup>
                <strong>
                  {risk.name}
                </strong>

                <br />

                Type: {risk.type}

                <br />

                Severity:{" "}
                {risk.severity}

                <br />

                Impact:{" "}
                {risk.impact}

                {isActive && (
                  <>
                    <br />

                    <strong>
                      ACTIVE — TRAIN IN ZONE
                    </strong>
                  </>
                )}
              </Popup>
            </Circle>
          );
        })}

        {STATIONS.map((station) => {
          const position =
            ROUTE[
              station.routeIndex
            ];

          const isCurrent =
            Math.abs(
              simulation.current
                .distance -
                routeDistances[
                  station.routeIndex
                ]
            ) < 150;

          return (
            <Marker
              key={
                station.name
              }
              position={
                position
              }
              icon={createStationIcon(
                station.type,
                isCurrent
              )}
            >
              <Tooltip
                direction="top"
                offset={[
                  0,
                  -8,
                ]}
                opacity={0.95}
              >
                <strong>
                  {station.name}
                </strong>
              </Tooltip>

              <Popup>
                <strong>
                  {station.name}
                </strong>

                <br />

                Status:{" "}
                {isCurrent
                  ? "Current"
                  : station.type ===
                    "origin"
                  ? "Origin"
                  : station.type ===
                    "destination"
                  ? "Destination"
                  : "Major Station"}
              </Popup>
            </Marker>
          );
        })}

        <Marker
          position={
            trainPosition
          }
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

            Speed:{" "}
            {Math.round(speed)} km/h

            <br />

            Route Progress:{" "}
            {Math.round(
              currentProgress
            )}
            %
          </Popup>
        </Marker>
      </MapContainer>

      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          zIndex: 1000,
          background:
            "rgba(15, 23, 42, 0.92)",
          color: "white",
          padding: "10px 13px",
          borderRadius: "10px",
          boxShadow:
            "0 4px 18px rgba(0,0,0,0.25)",
          minWidth: "175px",
          backdropFilter:
            "blur(8px)",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            opacity: 0.7,
            letterSpacing:
              "0.08em",
            textTransform:
              "uppercase",
          }}
        >
          Operational Telemetry
        </div>

        <div
          style={{
            fontSize: "16px",
            fontWeight: 700,
            marginTop: "3px",
          }}
        >
          {movement}
        </div>

        <div
          style={{
            marginTop: "5px",
            fontSize: "12px",
            opacity: 0.85,
          }}
        >
          Speed:{" "}
          {Math.round(speed)} km/h
        </div>

        <div
          style={{
            marginTop: "4px",
            fontSize: "11px",
            opacity: 0.75,
          }}
        >
          Progress:{" "}
          {Math.round(
            currentProgress
          )}
          %
        </div>

        {highestActiveRisk && (
          <div
            style={{
              marginTop: "5px",
              fontSize: "11px",
              color: "#fca5a5",
              fontWeight: 600,
            }}
          >
            Risk:{" "}
            {
              highestActiveRisk.severity
            }
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 1000,
          background: "white",
          padding: "7px 10px",
          borderRadius: "999px",
          fontWeight: 700,
          fontSize: "10px",
          boxShadow:
            "0 3px 12px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "#22c55e",
            display:
              "inline-block",
            animation:
              "railwayPulse 1.2s infinite",
          }}
        />

        LIVE SIMULATION
      </div>

      {highestActiveRisk && (
        <div
          style={{
            position: "absolute",
            right: "12px",
            bottom: "55px",
            zIndex: 1000,
            background:
              "rgba(255,255,255,0.96)",
            padding: "8px 11px",
            borderRadius: "9px",
            boxShadow:
              "0 3px 14px rgba(0,0,0,0.2)",
            fontSize: "10px",
            minWidth: "165px",
          }}
        >
          <strong>
            Active Risk
          </strong>

          <br />

          {highestActiveRisk.name}

          <br />

          Severity:{" "}
          {
            highestActiveRisk.severity
          }

          <br />

          Impact:{" "}
          {
            highestActiveRisk.impact
          }
        </div>
      )}

      {/* =================================================
          MAP LEGEND
          ================================================= */}

      <div
        style={{
          position: "absolute",
          bottom: "65px",
          left: "12px",
          zIndex: 1000,
          background:
            "rgba(8, 19, 33, 0.96)",
          color: "white",
          padding: "10px 12px",
          borderRadius: "10px",
          border:
            "1px solid rgba(255,255,255,0.10)",
          boxShadow:
            "0 4px 18px rgba(0,0,0,0.30)",
          fontSize: "9px",
          minWidth: "145px",
          backdropFilter:
            "blur(8px)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: "7px",
            fontSize: "9px",
            letterSpacing:
              "0.12em",
            color: "#67e8f9",
            textTransform:
              "uppercase",
          }}
        >
          MAP LEGEND
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            marginBottom: "5px",
          }}
        >
          <span
            style={{
              width: "20px",
              height: "3px",
              background: "#2563eb",
              display:
                "inline-block",
              borderRadius: "999px",
            }}
          />

          <span
            style={{
              color: "#cbd5e1",
            }}
          >
            Monitored Route
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            marginBottom: "5px",
          }}
        >
          <span
            style={{
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background:
                "rgba(37,99,235,0.15)",
              border:
                "1px solid rgba(37,99,235,0.5)",
              fontSize: "10px",
            }}
          >
            🚆
          </span>

          <span
            style={{
              color: "#cbd5e1",
            }}
          >
            Live Train
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <span
            style={{
              width: "13px",
              height: "13px",
              borderRadius: "50%",
              background:
                "rgba(245,158,11,0.18)",
              border:
                "2px solid #f59e0b",
              display:
                "inline-block",
            }}
          />

          <span
            style={{
              color: "#cbd5e1",
            }}
          >
            Risk Zone
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          zIndex: 1000,
          background:
            "rgba(15,23,42,0.9)",
          color: "white",
          padding: "6px 9px",
          borderRadius: "7px",
          fontSize: "8px",
          opacity: 0.9,
        }}
      >
        Prototype simulation • Railway Control Room
      </div>

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
            background: rgba(
              37,
              99,
              235,
              0.22
            );
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
            box-shadow:
              0 3px 12px
              rgba(0,0,0,0.3);
          }

          .station-marker-wrapper {
            background: transparent !important;
            border: none !important;
          }

          .train-marker-wrapper {
            background: transparent !important;
            border: none !important;
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