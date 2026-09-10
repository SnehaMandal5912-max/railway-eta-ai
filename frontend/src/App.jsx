import { useEffect, useMemo, useState } from "react";
import RailwayMap from "./map";

import {
  getTrainStatus,
  getETA,
  getAlerts,
  getRiskZones,
  getSafetyRequests,
  getApiSourceStatus,
} from "./service/api";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function App() {
  const [train, setTrain] = useState(null);
  const [eta, setEta] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [riskZones, setRiskZones] = useState([]);
  const [safetyRequests, setSafetyRequests] = useState([]);

  const [apiSourceStatus, setApiSourceStatus] =
    useState("UNKNOWN");

  const [mapLocation, setMapLocation] = useState(null);
  const [routeProgress, setRouteProgress] = useState(0);
  const [stationInfo, setStationInfo] = useState(null);
  const [riskInfo, setRiskInfo] = useState(null);

  const [lastUpdated, setLastUpdated] =
    useState(new Date());

  const [etaHistory, setEtaHistory] = useState([]);
  const [liveEta, setLiveEta] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [searchedTrain, setSearchedTrain] = useState(null);

  /* =====================================================
     TRAIN SEARCH
  ===================================================== */

  const handleTrainSearch = () => {
    const query = searchInput.trim().toLowerCase();

    if (!query) {
      setSearchMessage(
        "Enter a train number or train name."
      );
      setSearchedTrain(null);
      return;
    }

    const trainNumber = String(
      train?.trainNumber || ""
    ).toLowerCase();

    const trainName = String(
      train?.trainName || ""
    ).toLowerCase();

    if (
      query === trainNumber ||
      trainNumber.includes(query) ||
      trainName.includes(query)
    ) {
      setSearchedTrain(train);

      setSearchMessage(
        `Monitoring ${train.trainNumber} • ${train.trainName}`
      );
    } else {
      setSearchedTrain(null);

      setSearchMessage(
        "No matching train found in the current monitoring dataset."
      );
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      handleTrainSearch();
    }
  };

  /* =====================================================
     LOAD DASHBOARD DATA
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      try {
        const [
          trainData,
          etaData,
          alertData,
          riskData,
          safetyData,
        ] = await Promise.all([
          getTrainStatus(),
          getETA(),
          getAlerts(),
          getRiskZones(),
          getSafetyRequests(),
        ]);

        if (!mounted) return;

        setTrain(trainData || null);
        setEta(etaData || null);

        setAlerts(
          Array.isArray(alertData)
            ? alertData
            : []
        );

        setRiskZones(
          Array.isArray(riskData)
            ? riskData
            : []
        );

        setSafetyRequests(
          Array.isArray(safetyData)
            ? safetyData
            : []
        );

        setApiSourceStatus(
          getApiSourceStatus()
        );

        setLastUpdated(new Date());
      } catch (error) {
        console.error(
          "Dashboard data loading error:",
          error
        );
      }
    };

    loadDashboardData();

    const interval = setInterval(
      loadDashboardData,
      15000
    );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  /* =====================================================
     UPDATE SEARCHED TRAIN
  ===================================================== */

  useEffect(() => {
    if (!searchedTrain || !train) return;

    if (
      String(searchedTrain.trainNumber) ===
      String(train.trainNumber)
    ) {
      setSearchedTrain(train);
    }
  }, [train, searchedTrain]);

  /* =====================================================
     ETA HISTORY
  ===================================================== */

  useEffect(() => {
    if (!liveEta?.predictedEta) return;

    const convertEtaToMinutes = (timeString) => {
      if (!timeString) return null;

      const parts = String(timeString).split(":");

      if (parts.length !== 2) return null;

      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);

      if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
      ) {
        return null;
      }

      return hours * 60 + minutes;
    };

    const etaMinutes = convertEtaToMinutes(
      liveEta.predictedEta
    );

    if (etaMinutes === null) return;

    setEtaHistory((previous) => {
      const lastPoint =
        previous[previous.length - 1];

      if (
        lastPoint &&
        lastPoint.eta === etaMinutes
      ) {
        return previous;
      }

      const newPoint = {
        time: new Date().toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
        eta: etaMinutes,
        label: liveEta.predictedEta,
      };

      return [
        ...previous,
        newPoint,
      ].slice(-6);
    });
  }, [liveEta]);

  /* =====================================================
     LIVE ETA SIMULATION
  ===================================================== */

  useEffect(() => {
    if (!eta?.predictedEta) return;

    const parts = String(eta.predictedEta).split(":");

    if (parts.length !== 2) {
      setLiveEta(eta);
      return;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      setLiveEta(eta);
      return;
    }

    const baseMinutes =
      hours * 60 + minutes;

    const progress = Math.min(
      100,
      Math.max(
        0,
        Number(routeProgress) || 0
      )
    );

    const progressAdjustment =
      Math.round(progress / 20);

    const dynamicTotalMinutes =
      baseMinutes - progressAdjustment;

    const normalizedMinutes =
      ((dynamicTotalMinutes % 1440) + 1440) %
      1440;

    const dynamicHours =
      Math.floor(normalizedMinutes / 60);

    const dynamicMinutes =
      normalizedMinutes % 60;

    const predictedEta =
      `${String(dynamicHours).padStart(
        2,
        "0"
      )}:${String(
        dynamicMinutes
      ).padStart(2, "0")}`;

    const baseDifference =
      Number(eta.etaDifference) || 0;

    const etaDifference = Math.max(
      0,
      baseDifference - progressAdjustment
    );

    setLiveEta({
      ...eta,
      predictedEta,
      etaDifference,
    });
  }, [eta, routeProgress]);

  /* =====================================================
     BASIC VALUES
  ===================================================== */

  const currentDelay =
    Number(
      liveEta?.etaDifference ??
        train?.delay
    ) || 0;

  const confidence =
    Number(
      train?.predictionConfidence
    ) || 0;

  const liveMovement =
    stationInfo?.movement ||
    "MONITORING";

  const liveCurrentStation =
    stationInfo?.currentStation ||
    train?.currentStation ||
    "Monitoring";

  const liveNextStation =
    stationInfo?.nextStation !== undefined
      ? stationInfo.nextStation
      : train?.nextStation || "—";

  /* =====================================================
     SAFETY SUMMARY
  ===================================================== */

  const safetySummary = useMemo(() => {
    const requests = Array.isArray(
      safetyRequests
    )
      ? safetyRequests
      : [];

    const active = requests.filter(
      (request) => {
        const status = String(
          request?.status || ""
        ).toLowerCase();

        return (
          status === "active" ||
          status === "pending" ||
          status === "new" ||
          status === "open"
        );
      }
    );

    const emergency = requests.filter(
      (request) => {
        const priority = String(
          request?.priority ||
            request?.severity ||
            ""
        ).toLowerCase();

        return (
          priority === "high" ||
          priority === "critical" ||
          priority === "emergency"
        );
      }
    );

    return {
      total: requests.length,
      active: active.length,
      emergency: emergency.length,
      visibleRequests:
        requests.slice(0, 4),
    };
  }, [safetyRequests]);

  /* =====================================================
     DELAY PROPAGATION
  ===================================================== */

  const propagation = useMemo(() => {
    if (!train?.delayPropagation) {
      return [];
    }

    const convertTimeToMinutes = (timeString) => {
      if (!timeString) return null;

      const parts = String(timeString).split(":");

      if (parts.length !== 2) return null;

      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);

      if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
      ) {
        return null;
      }

      return hours * 60 + minutes;
    };

    const formatMinutesToTime = (totalMinutes) => {
      if (totalMinutes === null) {
        return "—";
      }

      const normalized =
        ((totalMinutes % 1440) + 1440) %
        1440;

      const hours =
        Math.floor(normalized / 60);

      const minutes =
        normalized % 60;

      return `${String(hours).padStart(
        2,
        "0"
      )}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    };

    return train.delayPropagation.map(
      (item) => {
        const factor =
          Number(
            item.propagationFactor
          ) || 0;

        const calculatedDelay =
          Math.max(
            0,
            Math.round(
              currentDelay * factor
            )
          );

        const scheduledMinutes =
          convertTimeToMinutes(
            item.scheduledTime
          );

        const projectedArrival =
          scheduledMinutes === null
            ? "—"
            : formatMinutesToTime(
                scheduledMinutes +
                  calculatedDelay
              );

        return {
          ...item,
          calculatedDelay,
          projectedArrival,
          propagationPercentage:
            Math.round(factor * 100),
        };
      }
    );
  }, [train, currentDelay]);

  /* =====================================================
     ROUTE RISK
  ===================================================== */

  const routeRisk = useMemo(() => {
    const activeRisks =
      riskInfo?.activeRisks || [];

    const severityRank = {
      Low: 1,
      Medium: 2,
      High: 3,
    };

    if (activeRisks.length === 0) {
      return riskZones.length > 0
        ? "MEDIUM"
        : "LOW";
    }

    let highest = 0;

    activeRisks.forEach((risk) => {
      highest = Math.max(
        highest,
        severityRank[
          risk?.severity
        ] || 0
      );
    });

    if (highest === 3) return "HIGH";
    if (highest === 2) return "MEDIUM";

    return "LOW";
  }, [riskInfo, riskZones]);

  const routeRiskClass =
    routeRisk === "HIGH"
      ? "text-red-400"
      : routeRisk === "MEDIUM"
      ? "text-yellow-400"
      : "text-emerald-400";

  /* =====================================================
     WHY ETA CHANGED
  ===================================================== */

  const etaReasons = useMemo(() => {
    const reasons = [];

    if (currentDelay > 0) {
      reasons.push({
        label:
          "Current operational delay",

        detail:
          `Train is currently ${currentDelay} minutes behind schedule.`,

        impact:
          `+${Math.max(
            1,
            Math.round(
              currentDelay * 0.6
            )
          )} min`,

        type: "delay",
      });
    }

    if (propagation.length > 0) {
      const maximumPropagation =
        Math.max(
          ...propagation.map(
            (item) =>
              item.calculatedDelay || 0
          )
        );

      if (maximumPropagation > 0) {
        reasons.push({
          label:
            "Delay propagation",

          detail:
            "Current delay is expected to influence downstream station arrival times.",

          impact:
            `+${maximumPropagation} min`,

          type: "propagation",
        });
      }
    }

    const hasCongestion =
      alerts.some(
        (alert) =>
          alert?.type ===
            "congestion" ||
          alert?.title
            ?.toLowerCase()
            .includes("congestion")
      );

    const trainHasCongestion =
      train?.delayReason
        ?.toLowerCase()
        .includes("congestion");

    if (
      hasCongestion ||
      trainHasCongestion
    ) {
      reasons.push({
        label:
          "Operational congestion",

        detail:
          "Route congestion may reduce effective running speed and increase ETA uncertainty.",

        impact: "ETA risk",

        type: "congestion",
      });
    }

    const hasSpeedRestriction =
      alerts.some(
        (alert) =>
          alert?.type === "speed" ||
          alert?.title
            ?.toLowerCase()
            .includes("speed")
      );

    if (hasSpeedRestriction) {
      reasons.push({
        label:
          "Speed restriction",

        detail:
          "Temporary speed restriction may increase running time on the affected section.",

        impact: "ETA risk",

        type: "speed",
      });
    }

    const activeRisks =
      riskInfo?.activeRisks || [];

    if (activeRisks.length > 0) {
      const highestActiveRisk =
        activeRisks.reduce(
          (highest, risk) => {
            const rank = {
              Low: 1,
              Medium: 2,
              High: 3,
            };

            return (
              (rank[risk?.severity] ||
                0) >
              (rank[
                highest?.severity
              ] || 0)
                ? risk
                : highest
            );
          },
          null
        );

      reasons.push({
        label:
          "Active route risk",

        detail:
          `${
            highestActiveRisk?.name ||
            "Risk zone"
          } is currently affecting the train's operational section.`,

        impact:
          highestActiveRisk?.severity ===
          "High"
            ? "High impact"
            : "Medium impact",

        type: "risk",
      });
    }

    if (
      liveMovement ===
      "HALTED AT STATION"
    ) {
      reasons.push({
        label: "Station dwell",

        detail:
          `Train is currently halted at ${liveCurrentStation}. Station dwell time is included in the operational forecast.`,

        impact: "ETA monitored",

        type: "halt",
      });
    }

    if (
      liveMovement === "APPROACHING"
    ) {
      reasons.push({
        label:
          "Station approach",

        detail:
          `Train is approaching ${liveNextStation}. Speed adjustment is being considered in the live simulation.`,

        impact: "ETA monitored",

        type: "station",
      });
    }

    if (reasons.length === 0) {
      reasons.push({
        label:
          "Stable operating conditions",

        detail:
          "No significant operational factor is currently affecting the predicted ETA.",

        impact: "Stable",

        type: "normal",
      });
    }

    return reasons.slice(0, 5);
  }, [
    currentDelay,
    propagation,
    alerts,
    train,
    riskInfo,
    liveMovement,
    liveCurrentStation,
    liveNextStation,
  ]);

  /* =====================================================
     ALERT COUNT
  ===================================================== */

  const warningAlerts =
    alerts.filter(
      (alert) =>
        String(
          alert?.severity || ""
        ).toLowerCase() ===
          "warning" ||
        String(
          alert?.severity || ""
        ).toLowerCase() === "high"
    ).length;

  /* =====================================================
     LOADING
  ===================================================== */

  if (!train || !eta) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06101d] text-white">
        <div className="rounded-2xl border border-white/10 bg-[#0a1424] px-8 py-6 text-center">
          <div className="mb-3 text-sm font-semibold tracking-widest text-cyan-400">
            RAILWAY ETA INTELLIGENCE
          </div>

          <div className="text-sm text-slate-400">
            Loading operational dashboard...
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */

  return (
    <div className="min-h-screen bg-[#06101d] text-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-white/10 bg-[#081321]">

        <div className="mx-auto max-w-[1600px] px-5 py-3">

          <div className="flex flex-col gap-3">

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="text-[10px] font-semibold tracking-[0.25em] text-cyan-400">
                  INDIAN RAILWAYS • OPERATIONAL INTELLIGENCE
                </div>

                <h1 className="mt-1 text-xl font-bold tracking-tight">
                  Dynamic ETA Forecast & Control Dashboard
                </h1>

                <p className="mt-1 text-xs text-slate-500">
                  AI-assisted real-time train monitoring and delay propagation
                </p>

              </div>

              <div className="flex items-center gap-2">

                <div
                  className={`rounded-xl px-3 py-2 ${
                    apiSourceStatus ===
                    "BACKEND"
                      ? "border border-emerald-400/20 bg-emerald-400/10"
                      : apiSourceStatus ===
                        "MIXED"
                      ? "border border-yellow-400/20 bg-yellow-400/10"
                      : apiSourceStatus ===
                        "MOCK"
                      ? "border border-cyan-400/20 bg-cyan-400/10"
                      : "border border-white/10 bg-white/5"
                  }`}
                >

                  <div className="flex items-center gap-2">

                    <span
                      className={`h-2 w-2 animate-pulse rounded-full ${
                        apiSourceStatus ===
                        "BACKEND"
                          ? "bg-emerald-400"
                          : apiSourceStatus ===
                            "MIXED"
                          ? "bg-yellow-400"
                          : apiSourceStatus ===
                            "MOCK"
                          ? "bg-cyan-400"
                          : "bg-slate-400"
                      }`}
                    />

                    <span
                      className={`text-[10px] font-semibold ${
                        apiSourceStatus ===
                        "BACKEND"
                          ? "text-emerald-300"
                          : apiSourceStatus ===
                            "MIXED"
                          ? "text-yellow-300"
                          : apiSourceStatus ===
                            "MOCK"
                          ? "text-cyan-300"
                          : "text-slate-400"
                      }`}
                    >
                      {apiSourceStatus ===
                      "BACKEND"
                        ? "BACKEND ONLINE"
                        : apiSourceStatus ===
                          "MIXED"
                        ? "HYBRID DATA"
                        : apiSourceStatus ===
                          "MOCK"
                        ? "DEMO DATA"
                        : "CONNECTING"}
                    </span>

                  </div>

                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">

                  <div className="text-[9px] uppercase tracking-wider text-slate-600">
                    Last update
                  </div>

                  <div className="text-[10px] font-medium text-slate-300">
                    {lastUpdated.toLocaleTimeString()}
                  </div>

                </div>

              </div>

            </div>

            {/* SEARCH */}

            <div className="rounded-xl border border-cyan-400/10 bg-[#0a1424] p-2.5">

              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">

                <div className="shrink-0">

                  <div className="text-[9px] font-semibold tracking-[0.2em] text-cyan-400">
                    TRAIN MONITORING
                  </div>

                  <div className="mt-0.5 text-[10px] text-slate-600">
                    Search train for control-room monitoring
                  </div>

                </div>

                <div className="flex flex-1 gap-2">

                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) =>
                      setSearchInput(
                        event.target.value
                      )
                    }
                    onKeyDown={
                      handleSearchKeyDown
                    }
                    placeholder="Enter train number or train name..."
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/40"
                  />

                  <button
                    type="button"
                    onClick={
                      handleTrainSearch
                    }
                    className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-[10px] font-bold tracking-wide text-cyan-300 hover:bg-cyan-400/20"
                  >
                    SEARCH
                  </button>

                </div>

                <div className="shrink-0 rounded-lg border border-emerald-400/10 bg-emerald-400/5 px-3 py-1.5">

                  <div className="text-[8px] uppercase tracking-wider text-slate-600">
                    Selected
                  </div>

                  <div className="text-[10px] font-semibold text-emerald-300">
                    {searchedTrain
                      ? searchedTrain.trainNumber
                      : "None"}
                  </div>

                </div>

              </div>

              {searchMessage && (
                <div
                  className={`mt-1 text-[9px] ${
                    searchedTrain
                      ? "text-emerald-400"
                      : "text-yellow-400"
                  }`}
                >
                  {searchMessage}
                </div>
              )}

            </div>

          </div>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-[1600px] px-5 py-3">

        {/* KPI CARDS */}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">

          {/* ETA */}

          <div className="rounded-xl border border-cyan-400/10 bg-[#0a1424] p-3">

            <div className="flex items-center justify-between">

              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                ML ETA Prediction
              </span>

              <span className="rounded-md border border-cyan-400/10 bg-cyan-400/5 px-1.5 py-0.5 text-[9px] text-cyan-300">
                AI
              </span>

            </div>

            <div className="mt-2 flex items-end justify-between">

              <div>

                <div className="text-xl font-bold text-white">
                  {(liveEta?.predictedEta ||
                    eta.predictedEta) ||
                    "—"}
                </div>

                <div className="text-[9px] text-slate-600">
                  Scheduled{" "}
                  {eta.scheduledEta ||
                    "—"}
                </div>

              </div>

              <div className="text-right">

                <div
                  className={`text-xs font-bold ${
                    Number(
                      liveEta?.etaDifference ??
                        eta.etaDifference
                    ) > 0
                      ? "text-yellow-400"
                      : "text-emerald-400"
                  }`}
                >
                  {Number(
                    liveEta?.etaDifference ??
                      eta.etaDifference
                  ) > 0
                    ? `+${liveEta?.etaDifference ??
                        eta.etaDifference}`
                    : liveEta?.etaDifference ??
                      eta.etaDifference ??
                      "0"}{" "}
                  min
                </div>

                <div className="text-[8px] text-slate-600">
                  deviation
                </div>

              </div>

            </div>

            <div className="mt-2 h-8">

              {etaHistory.length >
              1 ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart
                    data={etaHistory}
                  >

                    <XAxis
                      dataKey="time"
                      hide
                    />

                    <YAxis hide />

                    <Tooltip
                      contentStyle={{
                        background:
                          "#081321",
                        border:
                          "1px solid rgba(255,255,255,0.1)",
                        borderRadius:
                          "8px",
                        fontSize:
                          "9px",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="eta"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      dot={false}
                    />

                  </LineChart>

                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center text-[9px] text-slate-700">
                  Building prediction trend...
                </div>
              )}

            </div>

            <div className="mt-1 text-[9px] text-slate-600">
              Confidence{" "}
              <span className="font-semibold text-cyan-300">
                {confidence}%
              </span>
            </div>

          </div>

          {/* DELAY */}

          <div className="rounded-xl border border-yellow-400/10 bg-[#0a1424] p-3">

            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Current Delay
            </div>

            <div className="mt-3 flex items-end justify-between">

              <div>

                <div className="text-2xl font-bold text-yellow-300">
                  {currentDelay}
                  <span className="ml-1 text-xs font-medium">
                    min
                  </span>
                </div>

                <div className="text-[9px] text-slate-600">
                  {train.delayReason ||
                    "Operational status"}
                </div>

              </div>

              <div className="rounded-lg border border-yellow-400/10 bg-yellow-400/5 px-2 py-1 text-[9px] font-semibold text-yellow-300">
                {train.status ||
                  "MONITORING"}
              </div>

            </div>

            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">

              <div
                className="h-full rounded-full bg-yellow-400 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      5,
                      currentDelay * 4
                    )
                  )}%`,
                }}
              />

            </div>

          </div>

          {/* PROPAGATION */}

          <div className="rounded-xl border border-orange-400/10 bg-[#0a1424] p-3">

            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Delay Propagation
            </div>

            <div className="mt-3 flex items-end justify-between">

              <div>

                <div className="text-2xl font-bold text-orange-300">
                  {propagation.length}
                </div>

                <div className="text-[9px] text-slate-600">
                  downstream stations
                </div>

              </div>

              <div className="text-right">

                <div className="text-xs font-bold text-orange-300">
                  {propagation.length >
                  0
                    ? `+${Math.max(
                        ...propagation.map(
                          (item) =>
                            item.calculatedDelay ||
                            0
                        )
                      )}`
                    : "0"}{" "}
                  min
                </div>

                <div className="text-[8px] text-slate-600">
                  max impact
                </div>

              </div>

            </div>

            <div className="mt-3 flex gap-1">

              {propagation
                .slice(0, 6)
                .map(
                  (item, index) => (
                    <div
                      key={`${item.station}-${index}`}
                      className="h-1 flex-1 rounded-full bg-orange-400/40"
                    />
                  )
                )}

            </div>

          </div>

          {/* RISK */}

          <div className="rounded-xl border border-red-400/10 bg-[#0a1424] p-3">

            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Route Risk
            </div>

            <div className="mt-3 flex items-end justify-between">

              <div>

                <div
                  className={`text-2xl font-bold ${routeRiskClass}`}
                >
                  {routeRisk}
                </div>

                <div className="text-[9px] text-slate-600">
                  operational assessment
                </div>

              </div>

              <div className="text-right">

                <div className="text-xs font-bold text-white">
                  {riskZones.length}
                </div>

                <div className="text-[8px] text-slate-600">
                  risk zones
                </div>

              </div>

            </div>

            <div className="mt-3 flex items-center gap-2">

              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  routeRisk ===
                  "HIGH"
                    ? "bg-red-400"
                    : routeRisk ===
                      "MEDIUM"
                    ? "bg-yellow-400"
                    : "bg-emerald-400"
                }`}
              />

              <span className="text-[9px] text-slate-600">
                Live route assessment
              </span>

            </div>

          </div>

        </section>

        {/* MAP + CONTROL PANEL */}

        <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.75fr)]">

          {/* MAP */}

          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a1424]">

            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">

              <div>

                <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  LIVE RAILWAY MAP
                </div>

                <div className="text-[9px] text-slate-600">
                  Train movement • route risk • operational position
                </div>

              </div>

              <div className="flex items-center gap-1.5">

                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

                <span className="text-[9px] font-semibold text-emerald-300">
                  LIVE
                </span>

              </div>

            </div>

            <div className="h-full min-h-[450px]">

              <RailwayMap
                onLocationUpdate={
                  setMapLocation
                }
                onRouteProgress={
                  setRouteProgress
                }
                onProgressUpdate={
                  setRouteProgress
                }
                onStationInfo={
                  setStationInfo
                }
                onRiskInfo={
                  setRiskInfo
                }
              />

            </div>

          </div>

          {/* CONTROL PANEL */}

          <aside className="space-y-3">

            {/* TRAIN STATUS */}

            <div className="rounded-xl border border-white/10 bg-[#0a1424] p-3">

              <div className="flex items-center justify-between">

                <div>

                  <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    TRAIN STATUS
                  </div>

                  <div className="mt-0.5 text-base font-bold">
                    {train.trainNumber}
                  </div>

                </div>

                <div className="rounded-lg border border-emerald-400/10 bg-emerald-400/5 px-2 py-1">

                  <div className="text-[9px] font-bold text-emerald-300">
                    {liveMovement}
                  </div>

                </div>

              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">

                <div className="rounded-lg border border-white/5 bg-white/[0.025] p-2">

                  <div className="text-[8px] uppercase tracking-wider text-slate-600">
                    Current
                  </div>

                  <div className="mt-1 text-[10px] font-semibold text-white">
                    {liveCurrentStation}
                  </div>

                </div>

                <div className="rounded-lg border border-white/5 bg-white/[0.025] p-2">

                  <div className="text-[8px] uppercase tracking-wider text-slate-600">
                    Next
                  </div>

                  <div className="mt-1 text-[10px] font-semibold text-white">
                    {liveNextStation}
                  </div>

                </div>

              </div>

            </div>

            {/* ROUTE PROGRESS */}

            <div className="rounded-xl border border-white/10 bg-[#0a1424] p-3">

              <div className="flex items-center justify-between">

                <div>

                  <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    ROUTE PROGRESS
                  </div>

                  <div className="text-[9px] text-slate-600">
                    Live movement along monitored route
                  </div>

                </div>

                <div className="text-base font-bold text-cyan-300">
                  {Math.round(
                    Number(
                      routeProgress
                    ) || 0
                  )}
                  %
                </div>

              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">

                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        Number(
                          routeProgress
                        ) || 0
                      )
                    )}%`,
                  }}
                />

              </div>

              <div className="mt-1 flex justify-between text-[8px] text-slate-600">

                <span>
                  {train.currentStation ||
                    "Origin"}
                </span>

                <span>
                  {train.finalDestination ||
                    "Destination"}
                </span>

              </div>

            </div>

            {/* PROPAGATION */}

            <div className="rounded-xl border border-orange-400/10 bg-[#0a1424] p-3">

              <div className="flex items-center justify-between">

                <div>

                  <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-orange-300">
                    DELAY PROPAGATION
                  </div>

                  <div className="text-[8px] text-slate-600">
                    Projected downstream arrival impact
                  </div>

                </div>

                <div className="text-[8px] font-semibold text-orange-300">
                  LIVE MODEL
                </div>

              </div>

              <div className="mt-2 space-y-1.5">

                {propagation.length ===
                0 ? (
                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-[10px] text-slate-600">
                    No downstream propagation data.
                  </div>
                ) : (
                  propagation.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={`${item.station}-${index}`}
                        className="rounded-lg border border-white/5 bg-white/[0.02] p-2"
                      >

                        <div className="flex items-center justify-between">

                          <div className="text-[10px] font-semibold text-white">
                            {item.station}
                          </div>

                          <div className="text-[10px] font-bold text-orange-300">
                            +
                            {item.calculatedDelay ||
                              0}{" "}
                            min
                          </div>

                        </div>

                        <div className="mt-1 grid grid-cols-2 gap-1 text-[8px] text-slate-600">

                          <span>
                            Scheduled{" "}
                            {item.scheduledTime ||
                              "—"}
                          </span>

                          <span className="text-right">
                            Projected{" "}
                            {item.projectedArrival ||
                              "—"}
                          </span>

                        </div>

                        <div className="mt-1.5 flex items-center justify-between">

                          <span className="text-[8px] text-slate-600">
                            Propagation factor
                          </span>

                          <span className="text-[8px] font-semibold text-orange-300">
                            {item.propagationPercentage ??
                              0}
                            %
                          </span>

                        </div>

                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">

                          <div
                            className="h-full rounded-full bg-orange-400 transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  item.propagationPercentage ||
                                    0
                                )
                              )}%`,
                            }}
                          />

                        </div>

                        <div className="mt-1 flex justify-end">

                          <span className="text-[8px] font-semibold text-slate-500">
                            Risk{" "}
                            {item.risk ||
                              "Low"}
                          </span>

                        </div>

                      </div>
                    )
                  )
                )}

              </div>

            </div>

            {/* WHY ETA */}

            <div className="rounded-xl border border-cyan-400/10 bg-[#0a1424] p-3">

              <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
                WHY ETA CHANGED?
              </div>

              <div className="mt-2 space-y-1.5">

                {etaReasons.map(
                  (
                    reason,
                    index
                  ) => (
                    <div
                      key={`${reason.type}-${index}`}
                      className="rounded-lg border border-white/5 bg-white/[0.02] p-2"
                    >

                      <div className="flex items-start justify-between gap-2">

                        <div>

                          <div className="text-[10px] font-semibold text-white">
                            {reason.label}
                          </div>

                          <div className="mt-0.5 text-[8px] leading-3 text-slate-600">
                            {reason.detail}
                          </div>

                        </div>

                        <div className="shrink-0 text-[8px] font-bold text-cyan-300">
                          {reason.impact}
                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>

            </div>

          </aside>

        </section>

        {/* LOWER SECTIONS */}

        <section className="mt-3 grid gap-3 lg:grid-cols-2">

          {/* RISK MONITOR */}

          <div className="rounded-xl border border-red-400/10 bg-[#0a1424] p-3">

            <div className="flex items-center justify-between">

              <div>

                <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-red-300">
                  ACTIVE RISK MONITOR
                </div>

                <div className="text-[9px] text-slate-600">
                  Track and wildlife operational risk zones
                </div>

              </div>

              <div
                className={`text-[10px] font-bold ${routeRiskClass}`}
              >
                {routeRisk}
              </div>

            </div>

            <div className="mt-2 space-y-1.5">

              {riskZones.length ===
              0 ? (
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-[10px] text-slate-600">
                  No active risk zones reported.
                </div>
              ) : (
                riskZones
                  .slice(0, 5)
                  .map(
                    (
                      risk,
                      index
                    ) => {

                      const severity =
                        String(
                          risk?.severity ||
                            "Low"
                        );

                      const severityClass =
                        severity ===
                        "High"
                          ? "text-red-400 border-red-400/10 bg-red-400/5"
                          : severity ===
                            "Medium"
                          ? "text-yellow-400 border-yellow-400/10 bg-yellow-400/5"
                          : "text-emerald-400 border-emerald-400/5 bg-emerald-400/5";

                      return (
                        <div
                          key={
                            risk?.id ??
                            `${risk?.name}-${index}`
                          }
                          className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-2"
                        >

                          <div className="min-w-0">

                            <div className="truncate text-[10px] font-semibold text-white">
                              {risk?.name ||
                                "Risk zone"}
                            </div>

                            <div className="mt-0.5 text-[8px] text-slate-600">
                              {risk?.type ||
                                "Operational risk"}
                              {" • "}
                              {risk?.impact ||
                                "Monitoring required"}
                            </div>

                          </div>

                          <div
                            className={`ml-2 shrink-0 rounded-md border px-1.5 py-0.5 text-[8px] font-bold ${severityClass}`}
                          >
                            {severity.toUpperCase()}
                          </div>

                        </div>
                      );
                    }
                  )
              )}

            </div>

          </div>

          {/* ALERT CENTER */}

          <div className="rounded-xl border border-yellow-400/10 bg-[#0a1424] p-3">

            <div className="flex items-center justify-between">

              <div>

                <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-yellow-300">
                  ALERT CENTER
                </div>

                <div className="text-[9px] text-slate-600">
                  Operational alerts requiring attention
                </div>

              </div>

              <div className="rounded-md border border-yellow-400/10 bg-yellow-400/5 px-1.5 py-0.5 text-[8px] font-bold text-yellow-300">
                {warningAlerts} ACTIVE
              </div>

            </div>

            <div className="mt-2 space-y-1.5">

              {alerts.length ===
              0 ? (
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-[10px] text-slate-600">
                  No active alerts.
                </div>
              ) : (
                alerts
                  .slice(0, 5)
                  .map(
                    (
                      alert,
                      index
                    ) => {

                      const severity =
                        String(
                          alert?.severity ||
                            "info"
                        ).toLowerCase();

                      const alertClass =
                        severity ===
                          "critical" ||
                        severity ===
                          "high"
                          ? "border-red-400/10 bg-red-400/5"
                          : severity ===
                            "warning"
                          ? "border-yellow-400/10 bg-yellow-400/5"
                          : "border-cyan-400/10 bg-cyan-400/5";

                      return (
                        <div
                          key={`${alert?.title}-${index}`}
                          className={`rounded-lg border p-2 ${alertClass}`}
                        >

                          <div className="flex items-start justify-between gap-2">

                            <div>

                              <div className="text-[10px] font-semibold text-white">
                                {alert?.title ||
                                  "Operational Alert"}
                              </div>

                              <div className="mt-0.5 text-[8px] leading-3 text-slate-600">
                                {alert?.message ||
                                  "Monitoring information available."}
                              </div>

                            </div>

                            <div className="shrink-0 text-[8px] font-bold uppercase text-slate-600">
                              {severity}
                            </div>

                          </div>

                        </div>
                      );
                    }
                  )
              )}

            </div>

          </div>

        </section>

        {/* PASSENGER SAFETY */}

        <section className="mt-3 rounded-xl border border-emerald-400/10 bg-[#0a1424] p-3">

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                PASSENGER SAFETY ASSISTANCE
              </div>

              <div className="text-[9px] text-slate-600">
                Control-room view of passenger assistance requests
              </div>

            </div>

            <div className="grid grid-cols-3 gap-1.5">

              <div className="rounded-lg border border-white/5 bg-white/[0.025] px-3 py-1 text-center">

                <div className="text-sm font-bold text-white">
                  {safetySummary.total}
                </div>

                <div className="text-[7px] uppercase tracking-wider text-slate-600">
                  Total
                </div>

              </div>

              <div className="rounded-lg border border-yellow-400/10 bg-yellow-400/5 px-3 py-1 text-center">

                <div className="text-sm font-bold text-yellow-300">
                  {safetySummary.active}
                </div>

                <div className="text-[7px] uppercase tracking-wider text-slate-600">
                  Active
                </div>

              </div>

              <div className="rounded-lg border border-red-400/10 bg-red-400/5 px-3 py-1 text-center">

                <div className="text-sm font-bold text-red-300">
                  {safetySummary.emergency}
                </div>

                <div className="text-[7px] uppercase tracking-wider text-slate-600">
                  Priority
                </div>

              </div>

            </div>

          </div>

          <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">

            {safetySummary.visibleRequests.length ===
            0 ? (
              <div className="md:col-span-2 xl:col-span-4 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-[10px] text-slate-600">
                No passenger assistance requests currently reported.
              </div>
            ) : (
              safetySummary.visibleRequests.map(
                (
                  request,
                  index
                ) => (
                  <div
                    key={
                      request?.id ??
                      `request-${index}`
                    }
                    className="rounded-lg border border-white/5 bg-white/[0.02] p-2"
                  >

                    <div className="flex items-center justify-between gap-2">

                      <div className="text-[10px] font-semibold text-white">
                        {request?.type ||
                          request?.category ||
                          "Assistance"}
                      </div>

                      <div className="text-[8px] font-bold uppercase text-emerald-300">
                        {request?.status ||
                          "OPEN"}
                      </div>

                    </div>

                    <div className="mt-1 text-[8px] leading-3 text-slate-600">
                      {request?.message ||
                        request?.description ||
                        "Passenger assistance request received."}
                    </div>

                  </div>
                )
              )
            )}

          </div>

        </section>

      </main>

      {/* FOOTER */}

      <footer className="border-t border-white/10 bg-[#081321]">

        <div className="mx-auto flex max-w-[1600px] flex-col gap-1.5 px-5 py-2.5 text-[8px] text-slate-700 md:flex-row md:items-center md:justify-between">

          <div>
            Railway ETA Intelligence • Control-Room Prototype
          </div>

          <div className="flex flex-wrap gap-3">

            <span>
              Dynamic ETA
            </span>

            <span>
              Delay Propagation
            </span>

            <span>
              Risk Monitoring
            </span>

            <span>
              Operational Alerts
            </span>

          </div>

        </div>

      </footer>

    </div>
  );
}

export default App;