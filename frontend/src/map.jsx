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

/* =====================================================
   SIMULATION SETTINGS
===================================================== */

const TICK_SECONDS = 0.5;
const SIMULATION_TIME_SCALE = 45;

/* =====================================================
   ROUTE
   Kolkata -> Asansol -> Dhanbad -> Gomoh
   -> Koderma -> New Delhi
===================================================== */

const ROUTE = [
  [22.5726, 88.3639],
  [23.6739, 87.1480],
  [23.7957, 86.4304],
  [23.8730, 86.1510],
  [24.4674, 85.5930],
  [28.6139, 77.2090],
];

/* =====================================================
   STATIONS
===================================================== */

const STATIONS = [
  {
    name: "Kolkata",
    code: "KOAA",
    routeIndex: 0,
    type: "origin",
    dwellSeconds: 4,
  },
  {
    name: "Asansol",
    code: "ASN",
    routeIndex: 1,
    type: "major",
    dwellSeconds: 5,
  },
  {
    name: "Dhanbad",
    code: "DHN",
    routeIndex: 2,
    type: "major",
    dwellSeconds: 5,
  },
  {
    name: "Gomoh",
    code: "GMO",
    routeIndex: 3,
    type: "major",
    dwellSeconds: 5,
  },
  {
    name: "Koderma",
    code: "KQR",
    routeIndex: 4,
    type: "major",
    dwellSeconds: 5,
  },
  {
    name: "New Delhi",
    code: "NDLS",
    routeIndex: 5,
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
    name: "Asansol-Dhanbad Operational Section",
    type: "Track Risk",
    severity: "High",
    lat: 23.735,
    lng: 86.79,
    radius: 18000,
    impact: "Possible speed restriction",
  },
  {
    id: 2,
    name: "Dhanbad-Gomoh Congestion Zone",
    type: "Operational Risk",
    severity: "Medium",
    lat: 23.835,
    lng: 86.29,
    radius: 12000,
    impact: "Congestion may increase running time",
  },
  {
    id: 3,
    name: "Koderma Approach",
    type: "Track Risk",
    severity: "Low",
    lat: 24.35,
    lng: 85.65,
    radius: 18000,
    impact: "Operational caution required",
  },
];

/* =====================================================
   VALID COORDINATE
===================================================== */

function isValidCoordinate(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/* =====================================================
   GEO HELPERS
===================================================== */

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistance(pointA, pointB) {
  const earthRadius = 6371000;

  const lat1 = toRadians(pointA[0]);
  const lat2 = toRadians(pointB[0]);

  const deltaLat = toRadians(pointB[0] - pointA[0]);
  const deltaLng = toRadians(pointB[1] - pointA[1]);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) ** 2;

  return (
    2 *
    earthRadius *
    Math.asin(Math.sqrt(a))
  );
}

function interpolatePoint(pointA, pointB, ratio) {
  const safeRatio = Math.max(
    0,
    Math.min(1, ratio)
  );

  return [
    pointA[0] +
      (pointB[0] - pointA[0]) *
        safeRatio,

    pointA[1] +
      (pointB[1] - pointA[1]) *
        safeRatio,
  ];
}

/* =====================================================
   FIND NEAREST ROUTE POSITION
===================================================== */

function getNearestRoutePosition(point) {
  let best = {
    distanceToRoute: Infinity,
    routeDistance: 0,
    position: ROUTE[0],
  };

  let accumulatedDistance = 0;

  for (
    let index = 1;
    index < ROUTE.length;
    index += 1
  ) {
    const start = ROUTE[index - 1];
    const end = ROUTE[index];

    const segmentLength =
      haversineDistance(
        start,
        end
      );

    const x = point[1];
    const y = point[0];

    const x1 = start[1];
    const y1 = start[0];

    const x2 = end[1];
    const y2 = end[0];

    const dx = x2 - x1;
    const dy = y2 - y1;

    const denominator =
      dx * dx + dy * dy;

    let ratio = 0;

    if (denominator > 0) {
      ratio =
        ((x - x1) * dx +
          (y - y1) * dy) /
        denominator;
    }

    ratio = Math.max(
      0,
      Math.min(1, ratio)
    );

    const projected =
      interpolatePoint(
        start,
        end,
        ratio
      );

    const distanceToProjected =
      haversineDistance(
        point,
        projected
      );

    const distanceAlongSegment =
      segmentLength * ratio;

    if (
      distanceToProjected <
      best.distanceToRoute
    ) {
      best = {
        distanceToRoute:
          distanceToProjected,

        routeDistance:
          accumulatedDistance +
          distanceAlongSegment,

        position: projected,
      };
    }

    accumulatedDistance +=
      segmentLength;
  }

  return best;
}

/* =====================================================
   RISK HELPERS
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

function createStationIcon(
  type,
  isCurrent
) {
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
    className:
      "station-marker-wrapper",

    html: `
      <div
        style="
          width:20px;
          height:20px;
          border-radius:50%;
          background:${background};
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
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
  className:
    "train-marker-wrapper",

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
   MAP COMPONENT
===================================================== */

function RailwayMap({
  train = trainData,
  routeData = null,

  backendCurrentStation = null,
  backendNextStation = null,
  backendDestination = null,

  databaseLocation = null,

  riskZones = DEFAULT_RISKS,

  onProgressUpdate,
  onLocationUpdate,
  onStationUpdate,
  onRiskUpdate,

  onStationInfo,
  onRiskInfo,
}) {
  const [trainPosition, setTrainPosition] =
    useState(ROUTE[0]);

  const [speed, setSpeed] =
    useState(0);

  const [movement, setMovement] =
    useState("STARTING");

  const [activeRisks, setActiveRisks] =
    useState([]);

  const [currentProgress, setCurrentProgress] =
    useState(0);

  /* =====================================================
     DATABASE TELEMETRY
  ===================================================== */

  const dbLatValue =
    databaseLocation?.latitude ??
    databaseLocation?.lat ??
    null;

  const dbLngValue =
    databaseLocation?.longitude ??
    databaseLocation?.lng ??
    null;

  const hasDatabaseLocation =
    isValidCoordinate(
      dbLatValue,
      dbLngValue
    );

  const dbLat = hasDatabaseLocation
    ? Number(dbLatValue)
    : null;

  const dbLng = hasDatabaseLocation
    ? Number(dbLngValue)
    : null;

  const databasePosition =
    hasDatabaseLocation
      ? [dbLat, dbLng]
      : null;

  const rawDatabaseSpeed =
    databaseLocation?.speed ?? null;

  const databaseSpeed =
    hasDatabaseLocation &&
    rawDatabaseSpeed !== null &&
    rawDatabaseSpeed !== undefined &&
    Number.isFinite(
      Number(rawDatabaseSpeed)
    )
      ? Number(rawDatabaseSpeed)
      : null;

  const databaseStation =
    hasDatabaseLocation
      ? databaseLocation?.stationCode ||
        databaseLocation?.station_code ||
        null
      : null;

  const databaseRecordedAt =
    hasDatabaseLocation
      ? databaseLocation?.recordedAt ||
        databaseLocation?.recorded_at ||
        null
      : null;

  const databaseRecordKey =
    hasDatabaseLocation
      ? databaseLocation?.locationId ||
        databaseLocation?.location_id ||
        databaseRecordedAt ||
        `${dbLat}-${dbLng}`
      : "NO_DATABASE_LOCATION";

  /* =====================================================
     CALLBACK REFERENCES
  ===================================================== */

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

  /* =====================================================
     SIMULATION STATE
  ===================================================== */

  const simulation = useRef({
    distance: 0,
    phase: "HALT",
    dwellRemaining:
      STATIONS[0].dwellSeconds,

    destinationHold: false,

    lastArrivedStationIndex: 0,

    lastDatabaseRecordKey:
      "NO_DATABASE_LOCATION",

    databaseAnchorDistance: null,
  });

  const speedRef = useRef(0);

  /* =====================================================
     ROUTE DISTANCES
  ===================================================== */

  const routeDistances = useMemo(() => {
    const distances = [0];

    for (
      let index = 1;
      index < ROUTE.length;
      index += 1
    ) {
      distances.push(
        distances[index - 1] +
          haversineDistance(
            ROUTE[index - 1],
            ROUTE[index]
          )
      );
    }

    return distances;
  }, []);

  const totalRouteDistance =
    routeDistances[
      routeDistances.length - 1
    ];

  /* =====================================================
     STATION DISTANCES
  ===================================================== */

  const stationDistances =
    useMemo(() => {
      return STATIONS.map(
        (station) => ({
          ...station,

          distance:
            routeDistances[
              station.routeIndex
            ],
        })
      );
    }, [routeDistances]);

  /* =====================================================
     POSITION FROM DISTANCE
  ===================================================== */

  const getPositionFromDistance =
    (distance) => {
      const safeDistance =
        Math.max(
          0,
          Math.min(
            distance,
            totalRouteDistance
          )
        );

      for (
        let index = 1;
        index < ROUTE.length;
        index += 1
      ) {
        if (
          safeDistance <=
          routeDistances[index]
        ) {
          const segmentStart =
            routeDistances[
              index - 1
            ];

          const segmentEnd =
            routeDistances[index];

          const segmentLength =
            segmentEnd -
            segmentStart;

          const ratio =
            segmentLength === 0
              ? 0
              : (safeDistance -
                  segmentStart) /
                segmentLength;

          return interpolatePoint(
            ROUTE[index - 1],
            ROUTE[index],
            ratio
          );
        }
      }

      return ROUTE[
        ROUTE.length - 1
      ];
    };

  /* =====================================================
     NEXT STATION
  ===================================================== */

  const getNextStationAfterIndex =
    (stationIndex) => {
      return (
        stationDistances[
          stationIndex + 1
        ] || null
      );
    };

  /* =====================================================
     CURRENT STATION
  ===================================================== */

  const getCurrentStationInfo =
    (
      distance,
      phase
    ) => {
      const tolerance = 500;

      if (
        distance >=
        totalRouteDistance -
          tolerance
      ) {
        return {
          currentStation:
            stationDistances[
              stationDistances.length -
                1
            ],

          nextStation: null,
        };
      }

      if (phase === "HALT") {
        for (
          let index = 0;
          index <
          stationDistances.length;
          index += 1
        ) {
          const station =
            stationDistances[index];

          if (
            Math.abs(
              distance -
                station.distance
            ) <= tolerance
          ) {
            return {
              currentStation:
                station,

              nextStation:
                getNextStationAfterIndex(
                  index
                ),
            };
          }
        }
      }

      const lastArrivedIndex =
        simulation.current
          .lastArrivedStationIndex;

      const lastArrivedStation =
        stationDistances[
          lastArrivedIndex
        ];

      let nextStation = null;

      for (
        let index =
          lastArrivedIndex + 1;
        index <
        stationDistances.length;
        index += 1
      ) {
        if (
          stationDistances[index]
            .distance >
          distance
        ) {
          nextStation =
            stationDistances[index];

          break;
        }
      }

      return {
        currentStation:
          lastArrivedStation ||
          null,

        nextStation,
      };
    };

  /* =====================================================
     REPORT PROGRESS
  ===================================================== */

  const reportProgress =
    (distance) => {
      const progress =
        Math.min(
          100,
          Math.max(
            0,
            (distance /
              totalRouteDistance) *
              100
          )
        );

      setCurrentProgress(
        progress
      );

      callbacksRef.current
        .onProgressUpdate?.(
          progress
        );
    };

  /* =====================================================
     ACTIVE RISKS
  ===================================================== */

  const calculateActiveRisks =
    (position) => {
      const safeRisks =
        Array.isArray(riskZones)
          ? riskZones
          : DEFAULT_RISKS;

      return safeRisks.filter(
        (risk) => {
          if (
            !isValidCoordinate(
              risk?.lat,
              risk?.lng
            )
          ) {
            return false;
          }

          const distance =
            haversineDistance(
              position,
              [
                Number(risk.lat),
                Number(risk.lng),
              ]
            );

          return (
            distance <=
            Number(
              risk.radius || 0
            )
          );
        }
      );
    };

  /* =====================================================
     HYBRID LIVE ENGINE
  ===================================================== */

  useEffect(() => {
    const interval =
      setInterval(() => {
        const state =
          simulation.current;

        const callbacks =
          callbacksRef.current;

        /* =================================================
           NEW DATABASE ANCHOR
        ================================================= */

        if (
          hasDatabaseLocation &&
          state.lastDatabaseRecordKey !==
            databaseRecordKey
        ) {
          const dbPoint = [
            dbLat,
            dbLng,
          ];

          const nearest =
            getNearestRoutePosition(
              dbPoint
            );

          const maximumAllowedDistanceFromRoute =
            50000;

          if (
            nearest.distanceToRoute >
            maximumAllowedDistanceFromRoute
          ) {
            state.lastDatabaseRecordKey =
              databaseRecordKey;

            return;
          }

          /*
            IMPORTANT:

            Database becomes the anchor.
            Simulation distance is moved to the
            nearest position on the monitored route.
          */
          state.distance =
            nearest.routeDistance;

          state.databaseAnchorDistance =
            nearest.routeDistance;

          state.destinationHold =
            false;

          let lastStationIndex = 0;

          for (
            let index = 0;
            index <
            stationDistances.length;
            index += 1
          ) {
            if (
              stationDistances[index]
                .distance <=
              nearest.routeDistance +
                500
            ) {
              lastStationIndex =
                index;
            }
          }

          state.lastArrivedStationIndex =
            lastStationIndex;

          const currentStation =
            stationDistances[
              lastStationIndex
            ];

          const nearStation =
            currentStation &&
            Math.abs(
              nearest.routeDistance -
                currentStation.distance
            ) <= 500;

          state.phase =
            nearStation
              ? "HALT"
              : "CRUISE";

          state.dwellRemaining =
            nearStation
              ? currentStation.dwellSeconds
              : 0;

          if (
            databaseSpeed !== null
          ) {
            speedRef.current =
              Math.max(
                0,
                databaseSpeed
              );

            setSpeed(
              Math.round(
                databaseSpeed
              )
            );
          } else {
            /*
              No speed in DB:
              use normal simulation speed
              instead of showing misleading 0.
            */
            speedRef.current =
              nearStation
                ? 0
                : 60;

            setSpeed(
              nearStation
                ? 0
                : 60
            );
          }

          /*
            Show database coordinate immediately
            for this tick.
          */
          setTrainPosition(
            dbPoint
          );

          reportProgress(
            nearest.routeDistance
          );

          state.lastDatabaseRecordKey =
            databaseRecordKey;

          callbacks
            .onLocationUpdate?.({
              lat: dbLat,
              lng: dbLng,

              type:
                nearStation
                  ? "Database Station Position"
                  : "Database Anchored",

              description:
                nearStation
                  ? `Train position anchored to database telemetry near ${currentStation.name}.`
                  : "Train position anchored to the latest database telemetry. Simulation will continue from this position.",
            });
        }

        /* =================================================
           DESTINATION
        ================================================= */

        if (
          state.destinationHold
        ) {
          speedRef.current = 0;

          setSpeed(0);

          setMovement(
            "DESTINATION"
          );

          const destinationPosition =
            ROUTE[
              ROUTE.length - 1
            ];

          setTrainPosition(
            destinationPosition
          );

          setCurrentProgress(
            100
          );

          callbacks
            .onProgressUpdate?.(
              100
            );

          callbacks
            .onLocationUpdate?.({
              lat:
                destinationPosition[0],

              lng:
                destinationPosition[1],

              type:
                "Destination",

              description:
                `Train has reached ${
                  backendDestination ||
                  "New Delhi"
                }.`,
            });

          callbacks
            .onStationUpdate?.({
              currentStation:
                backendDestination ||
                "New Delhi",

              nextStation: "—",

              movement:
                "DESTINATION",
            });

          callbacks
            .onRiskUpdate?.({
              activeRisks: [],
              highestSeverity:
                "Normal",
              totalActive: 0,
            });

          return;
        }

        /* =================================================
           CURRENT SIMULATION POSITION
        ================================================= */

        const currentPosition =
          getPositionFromDistance(
            state.distance
          );

        /* =================================================
           RISK DETECTION
        ================================================= */

        const risks =
          calculateActiveRisks(
            currentPosition
          );

        setActiveRisks(
          risks
        );

        const highestRisk =
          risks.reduce(
            (highest, risk) => {
              if (
                getSeverityRank(
                  risk?.severity
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

        callbacks
          .onRiskUpdate?.({
            activeRisks:
              risks,

            highestSeverity:
              highestRisk?.severity ||
              "Normal",

            totalActive:
              risks.length,
          });

        /* =================================================
           HALT AT STATION
        ================================================= */

        if (
          state.phase ===
          "HALT"
        ) {
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
            const stationPosition =
              ROUTE[
                station.routeIndex
              ];

            /*
              Even with database mode,
              simulation is now allowed to
              continue visually after the anchor.
            */
            setTrainPosition(
              hasDatabaseLocation
                ? getPositionFromDistance(
                    state.distance
                  )
                : stationPosition
            );

            const stationIndex =
              stationDistances.indexOf(
                station
              );

            const nextStation =
              getNextStationAfterIndex(
                stationIndex
              );

            callbacks
              .onStationUpdate?.({
                currentStation:
                  station.name,

                nextStation:
                  nextStation?.name ||
                  "—",

                movement:
                  "HALTED AT STATION",
              });

            const displayedPosition =
              getPositionFromDistance(
                state.distance
              );

            callbacks
              .onLocationUpdate?.({
                lat:
                  displayedPosition[0],

                lng:
                  displayedPosition[1],

                type:
                  hasDatabaseLocation
                    ? "Database Anchored"
                    : "At Station",

                description:
                  hasDatabaseLocation
                    ? `Simulation is continuing from the latest database anchor near ${station.name}.`
                    : `Train is currently halted at ${station.name}.`,
              });
          }

          reportProgress(
            state.distance
          );

          if (
            state.dwellRemaining <=
            0
          ) {
            if (
              state.lastArrivedStationIndex >=
              stationDistances.length -
                1
            ) {
              state.destinationHold =
                true;

              return;
            }

            state.phase =
              "ACCELERATE";

            speedRef.current = 0;
          }

          return;
        }

        /* =================================================
           NORMAL SPEED
        ================================================= */

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

        /* =================================================
           NEXT STATION
        ================================================= */

        let approachingStation =
          null;

        let distanceToApproaching =
          Infinity;

        for (
          let index =
            state.lastArrivedStationIndex +
            1;

          index <
          stationDistances.length;

          index += 1
        ) {
          const station =
            stationDistances[index];

          const distanceToStation =
            station.distance -
            state.distance;

          if (
            distanceToStation > 0 &&
            distanceToStation <
              distanceToApproaching
          ) {
            distanceToApproaching =
              distanceToStation;

            approachingStation =
              station;
          }
        }

        /* =================================================
           APPROACHING
        ================================================= */

        if (
          approachingStation &&
          distanceToApproaching <
            1500
        ) {
          state.phase =
            "DECELERATE";
        }

        const distanceToDestination =
          totalRouteDistance -
          state.distance;

        if (
          distanceToDestination <
          1500
        ) {
          state.phase =
            "DECELERATE";
        }

        /* =================================================
           ACCELERATION
        ================================================= */

        if (
          state.phase ===
          "ACCELERATE"
        ) {
          speedRef.current =
            Math.min(
              speedRef.current +
                10,
              targetSpeed
            );

          state.phase =
            "CRUISE";
        }

        /* =================================================
           CURRENT SPEED
        ================================================= */

        let currentSpeed =
          speedRef.current;

        if (
          state.phase ===
          "DECELERATE"
        ) {
          currentSpeed =
            Math.max(
              10,
              currentSpeed - 4
            );
        } else {
          currentSpeed =
            Math.min(
              targetSpeed,
              Math.max(
                20,
                currentSpeed + 3
              )
            );
        }

        speedRef.current =
          currentSpeed;

        setSpeed(
          Math.round(
            currentSpeed
          )
        );

        /* =================================================
           MOVE SIMULATION
        ================================================= */

        const speedMetersPerSecond =
          (currentSpeed * 1000) /
          3600;

        const distanceStep =
          speedMetersPerSecond *
          TICK_SECONDS *
          SIMULATION_TIME_SCALE;

        const previousDistance =
          state.distance;

        state.distance +=
          distanceStep;

        /* =================================================
           STATION ARRIVAL
        ================================================= */

        let arrivedStation = null;
        let arrivedStationIndex = -1;

        for (
          let index =
            state.lastArrivedStationIndex +
            1;

          index <
          stationDistances.length;

          index += 1
        ) {
          const station =
            stationDistances[index];

          const stationDistance =
            station.distance;

          const crossedStation =
            previousDistance <
              stationDistance &&
            state.distance >=
              stationDistance;

          const veryClose =
            Math.abs(
              state.distance -
                stationDistance
            ) < 350;

          if (
            crossedStation ||
            veryClose
          ) {
            arrivedStation =
              station;

            arrivedStationIndex =
              index;

            break;
          }
        }

        /* =================================================
           ARRIVED
        ================================================= */

        if (
          arrivedStation
        ) {
          state.distance =
            arrivedStation.distance;

          state.phase =
            "HALT";

          state.dwellRemaining =
            arrivedStation.dwellSeconds;

          state.lastArrivedStationIndex =
            arrivedStationIndex;

          speedRef.current = 0;

          setSpeed(0);

          setMovement(
            "HALTED AT STATION"
          );

          const stationPosition =
            ROUTE[
              arrivedStation.routeIndex
            ];

          setTrainPosition(
            stationPosition
          );

          const nextStation =
            getNextStationAfterIndex(
              arrivedStationIndex
            );

          callbacks
            .onStationUpdate?.({
              currentStation:
                arrivedStation.name,

              nextStation:
                nextStation?.name ||
                "—",

              movement:
                "HALTED AT STATION",
            });

          callbacks
            .onLocationUpdate?.({
              lat:
                stationPosition[0],

              lng:
                stationPosition[1],

              type:
                hasDatabaseLocation
                  ? "Database Anchored"
                  : "At Station",

              description:
                hasDatabaseLocation
                  ? `Simulation has reached ${arrivedStation.name} after continuing from database telemetry.`
                  : `Train has arrived at ${arrivedStation.name}.`,
            });

          reportProgress(
            state.distance
          );

          if (
            arrivedStation.type ===
            "destination"
          ) {
            state.destinationHold =
              true;
          }

          return;
        }

        /* =================================================
           ROUTE END
        ================================================= */

        if (
          state.distance >=
          totalRouteDistance
        ) {
          state.distance =
            totalRouteDistance;

          state.destinationHold =
            true;

          speedRef.current = 0;

          setSpeed(0);

          setMovement(
            "DESTINATION"
          );

          setTrainPosition(
            ROUTE[
              ROUTE.length - 1
            ]
          );

          reportProgress(
            totalRouteDistance
          );

          return;
        }

        /* =================================================
           IN TRANSIT
        ================================================= */

        const newPosition =
          getPositionFromDistance(
            state.distance
          );

        /*
          IMPORTANT HYBRID FIX:

          Database is an ANCHOR, not a permanent
          display lock.

          After anchoring, simulation continues
          moving the train from that position.
        */
        setTrainPosition(
          newPosition
        );

        let movementStatus =
          "IN TRANSIT";

        if (
          approachingStation &&
          distanceToApproaching <
            1500
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

        /* =================================================
           CURRENT / NEXT
        ================================================= */

        const stationInfo =
          getCurrentStationInfo(
            state.distance,
            state.phase
          );

        const lastArrivedStation =
          stationDistances[
            state.lastArrivedStationIndex
          ];

        const liveCurrent =
          stationInfo
            .currentStation?.name ||
          lastArrivedStation?.name ||
          "Kolkata";

        const liveNext =
          stationInfo
            .nextStation?.name ||
          stationDistances[
            state.lastArrivedStationIndex +
              1
          ]?.name ||
          "—";

        callbacks
          .onStationUpdate?.({
            currentStation:
              liveCurrent,

            nextStation:
              liveNext,

            movement:
              movementStatus,
          });

        /* =================================================
           LIVE LOCATION
        ================================================= */

        let locationType =
          hasDatabaseLocation
            ? "Database Anchored"
            : "Simulation Fallback";

        let locationDescription =
          hasDatabaseLocation
            ? "Simulation is continuing from the latest database telemetry anchor."
            : "No database telemetry is currently available. Simulation is providing the operational position.";

        if (
          approachingStation &&
          distanceToApproaching <
            1500
        ) {
          locationType =
            hasDatabaseLocation
              ? "Database Anchored • Approaching"
              : "Simulation • Approaching";

          locationDescription =
            `Train is approaching ${approachingStation.name}.`;
        }

        /*
          IMPORTANT:
          During simulation, report the CURRENT
          simulated position instead of repeatedly
          reporting the old DB coordinate.
        */
        callbacks
          .onLocationUpdate?.({
            lat:
              newPosition[0],

            lng:
              newPosition[1],

            type:
              locationType,

            description:
              locationDescription,
          });

        reportProgress(
          state.distance
        );
      }, TICK_SECONDS * 1000);

    return () =>
      clearInterval(interval);
  }, [
    hasDatabaseLocation,
    dbLat,
    dbLng,
    databaseRecordKey,
    databaseSpeed,
    backendDestination,
    totalRouteDistance,
    routeDistances,
    stationDistances,
  ]);

  /* =====================================================
     COMPLETED ROUTE
  ===================================================== */

  const completedRoute =
    useMemo(() => {
      const progress =
        currentProgress;

      const routePointCount =
        Math.max(
          1,
          Math.ceil(
            (progress / 100) *
              ROUTE.length
          )
        );

      return [
        ROUTE[0],

        ...ROUTE.slice(
          1,
          routePointCount
        ),

        trainPosition,
      ];
    }, [
      currentProgress,
      trainPosition,
    ]);

  /* =====================================================
     HIGHEST ACTIVE RISK
  ===================================================== */

  const highestActiveRisk =
    useMemo(() => {
      if (
        activeRisks.length === 0
      ) {
        return null;
      }

      return activeRisks.reduce(
        (highest, risk) => {
          if (
            getSeverityRank(
              risk?.severity
            ) >
            getSeverityRank(
              highest?.severity
            )
          ) {
            return risk;
          }

          return highest;
        },
        activeRisks[0]
      );
    }, [activeRisks]);

  /* =====================================================
     DISPLAY
  ===================================================== */

  const displayedTrainPosition =
    trainPosition;

  const dataSourceLabel =
    hasDatabaseLocation
      ? "DATABASE ANCHORED"
      : "SIMULATION FALLBACK";

  const displayedSpeed =
    Number.isFinite(speed)
      ? Math.round(speed)
      : null;

  /* =====================================================
     MAP
  ===================================================== */

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
        center={[25.2, 87.0]}
        zoom={6}
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

        {/* COMPLETE ROUTE */}

        <Polyline
          positions={ROUTE}
          pathOptions={{
            color: "#64748b",
            weight: 5,
            opacity: 0.55,
          }}
        />

        {/* ACTIVE ROUTE */}

        <Polyline
          positions={completedRoute}
          pathOptions={{
            color: "#2563eb",
            weight: 7,
            opacity: 0.95,
          }}
        />

        {/* RISK ZONES */}

        {(
          Array.isArray(riskZones)
            ? riskZones
            : DEFAULT_RISKS
        ).map((risk) => {
          if (
            !isValidCoordinate(
              risk?.lat,
              risk?.lng
            )
          ) {
            return null;
          }

          const isActive =
            activeRisks.some(
              (activeRisk) =>
                activeRisk.id ===
                risk.id
            );

          const severity =
            String(
              risk?.severity ||
                "Low"
            );

          let fillOpacity = 0.12;

          if (
            severity === "High"
          ) {
            fillOpacity =
              isActive
                ? 0.32
                : 0.22;
          }

          if (
            severity === "Medium"
          ) {
            fillOpacity =
              isActive
                ? 0.24
                : 0.16;
          }

          const borderColor =
            severity === "High"
              ? "#dc2626"
              : severity ===
                "Medium"
              ? "#f59e0b"
              : "#2563eb";

          return (
            <Circle
              key={risk.id}
              center={[
                Number(risk.lat),
                Number(risk.lng),
              ]}
              radius={
                Number(
                  risk.radius
                ) || 0
              }
              pathOptions={{
                color:
                  borderColor,

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
                {severity}

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

        {/* STATIONS */}

        {STATIONS.map(
          (station) => {
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
              ) < 500;

            return (
              <Marker
                key={
                  station.code
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

                  <br />

                  {station.code}
                </Tooltip>

                <Popup>
                  <strong>
                    {station.name}
                  </strong>

                  <br />

                  Code:{" "}
                  {station.code}

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
          }
        )}

        {/* LIVE TRAIN */}

        <Marker
          position={
            displayedTrainPosition
          }
          icon={trainIcon}
          zIndexOffset={1000}
        >
          <Popup>
            <strong>
              {train?.trainNumber ||
                trainData.trainNumber}{" "}
              —{" "}
              {train?.trainName ||
                trainData.trainName}
            </strong>

            <br />

            Status: {movement}

            <br />

            Speed:{" "}
            {displayedSpeed !== null
              ? displayedSpeed
              : "—"}{" "}
            km/h

            <br />

            Route Progress:{" "}
            {Math.round(
              currentProgress
            )}
            %

            <br />

            Data Source:{" "}
            {dataSourceLabel}

            {hasDatabaseLocation && (
              <>
                <br />

                <strong>
                  Database Anchor
                </strong>

                <br />

                Station:{" "}
                {databaseStation ||
                  "—"}

                <br />

                Coordinates:{" "}
                {dbLat.toFixed(4)}
                ,{" "}
                {dbLng.toFixed(4)}
              </>
            )}
          </Popup>
        </Marker>
      </MapContainer>

      {/* =================================================
          OPERATIONAL TELEMETRY
      ================================================= */}

      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          zIndex: 1000,
          background:
            "rgba(15,23,42,0.92)",
          color: "white",
          padding:
            "10px 13px",
          borderRadius: "10px",
          boxShadow:
            "0 4px 18px rgba(0,0,0,0.25)",
          minWidth: "190px",
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
          {displayedSpeed !== null
            ? displayedSpeed
            : "—"}{" "}
          km/h
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

        <div
          style={{
            marginTop: "6px",
            fontSize: "10px",
            color:
              hasDatabaseLocation
                ? "#86efac"
                : "#93c5fd",
            fontWeight: 700,
          }}
        >
          ● {dataSourceLabel}
        </div>

        {hasDatabaseLocation &&
          databaseRecordedAt && (
            <div
              style={{
                marginTop: "3px",
                fontSize: "9px",
                opacity: 0.65,
              }}
            >
              DB update:{" "}
              {new Date(
                databaseRecordedAt
              ).toLocaleTimeString()}
            </div>
          )}

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

      {/* =================================================
          DATA SOURCE BADGE
      ================================================= */}

      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 1000,
          background: "white",
          color: "#0f172a",
          padding:
            "7px 10px",
          borderRadius:
            "999px",
          fontWeight: 700,
          fontSize: "10px",
          boxShadow:
            "0 3px 12px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems:
            "center",
          gap: "6px",
        }}
      >
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background:
              hasDatabaseLocation
                ? "#22c55e"
                : "#3b82f6",
            display:
              "inline-block",
            animation:
              "railwayPulse 1.2s infinite",
          }}
        />

        {dataSourceLabel}
      </div>

      {/* =================================================
          ACTIVE RISK
      ================================================= */}

      {highestActiveRisk && (
        <div
          style={{
            position: "absolute",
            right: "12px",
            bottom: "55px",
            zIndex: 1000,
            background:
              "rgba(255,255,255,0.96)",
            color: "#0f172a",
            padding:
              "8px 11px",
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
          bottom: "12px",
          left: "12px",
          zIndex: 1000,
          background:
            "rgba(255,255,255,0.95)",
          color: "#0f172a",
          padding:
            "8px 10px",
          borderRadius: "9px",
          boxShadow:
            "0 3px 12px rgba(0,0,0,0.18)",
          fontSize: "9px",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom:
              "5px",
          }}
        >
          MAP LEGEND
        </div>

        <div
          style={{
            display: "flex",
            gap: "6px",
            alignItems:
              "center",
            marginBottom:
              "3px",
          }}
        >
          <span
            style={{
              width: "16px",
              height: "3px",
              background:
                "#2563eb",
              display:
                "inline-block",
            }}
          />

          Active Route
        </div>

        <div
          style={{
            display: "flex",
            gap: "6px",
            alignItems:
              "center",
            marginBottom:
              "3px",
          }}
        >
          <span>🚆</span>

          Live Train
        </div>

        <div
          style={{
            display: "flex",
            gap: "6px",
            alignItems:
              "center",
          }}
        >
          <span>⚠️</span>

          Active Risk
        </div>
      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <div
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          zIndex: 1000,
          background:
            "rgba(15,23,42,0.9)",
          color: "white",
          padding:
            "6px 9px",
          borderRadius: "7px",
          fontSize: "8px",
          opacity: 0.9,
        }}
      >
        Hybrid telemetry • Database anchor + simulation
      </div>

      {/* =================================================
          CSS
      ================================================= */}

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

          .station-marker-wrapper {
            background: transparent !important;
            border: none !important;
          }

          .train-marker-wrapper {
            background: transparent !important;
            border: none !important;
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
            animation:
              trainGlow 1.2s infinite;
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
        `}
      </style>
    </div>
  );
}

export default RailwayMap;