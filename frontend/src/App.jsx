import { useEffect, useMemo, useState } from "react";
import RailwayMap from "./map";
import {
  getTrainStatus,
  getETA,
  getAlerts,
  getRiskZones,
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

  const [mapLocation, setMapLocation] = useState(null);
  const [routeProgress, setRouteProgress] = useState(0);
  const [stationInfo, setStationInfo] = useState(null);
  const [riskInfo, setRiskInfo] = useState(null);

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [etaHistory, setEtaHistory] = useState([]);

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
        ] = await Promise.all([
          getTrainStatus(),
          getETA(),
          getAlerts(),
          getRiskZones(),
        ]);

        if (!mounted) return;

        setTrain(trainData || null);
        setEta(etaData || null);
        setAlerts(alertData || []);
        setRiskZones(riskData || []);
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
     ETA HISTORY
     ===================================================== */

  useEffect(() => {
    if (!eta?.predictedEta) return;

    const convertEtaToMinutes = (timeString) => {
      if (!timeString) return null;

      const parts = timeString.split(":");

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

    const etaMinutes =
      convertEtaToMinutes(
        eta.predictedEta
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
        label: eta.predictedEta,
      };

      return [
        ...previous,
        newPoint,
      ].slice(-6);
    });
  }, [eta]);

  /* =====================================================
     DERIVED VALUES
     ===================================================== */

  const currentDelay =
    Number(train?.delay) || 0;

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
    stationInfo?.nextStation ||
    train?.nextStation ||
    "—";

  /* =====================================================
     DELAY PROPAGATION
     ===================================================== */

  const propagation = useMemo(() => {
    if (!train?.delayPropagation) {
      return [];
    }

    return train.delayPropagation.map(
      (item) => {
        const factor =
          Number(
            item.propagationFactor
          ) || 0;

        return {
          ...item,
          calculatedDelay: Math.max(
            0,
            Math.round(
              currentDelay * factor
            )
          ),
        };
      }
    );
  }, [train, currentDelay]);

  /* =====================================================
     LIVE ROUTE RISK
     ===================================================== */

  const routeRisk = useMemo(() => {
    const activeRisks =
      riskInfo?.activeRisks || [];

    if (activeRisks.length > 0) {
      const severityRank = {
        Low: 1,
        Medium: 2,
        High: 3,
      };

      let highest = 0;

      activeRisks.forEach((risk) => {
        highest = Math.max(
          highest,
          severityRank[
            risk?.severity
          ] || 0
        );
      });

      if (highest === 3) {
        return "HIGH";
      }

      if (highest === 2) {
        return "MEDIUM";
      }

      return "LOW";
    }

    if (!riskZones?.length) {
      return "LOW";
    }

    const severityRank = {
      Low: 1,
      Medium: 2,
      High: 3,
    };

    let highest = 0;

    riskZones.forEach((zone) => {
      highest = Math.max(
        highest,
        severityRank[
          zone?.severity
        ] || 0
      );
    });

    if (highest === 3) {
      return "HIGH";
    }

    if (highest === 2) {
      return "MEDIUM";
    }

    return "LOW";
  }, [riskZones, riskInfo]);

  const routeRiskClass =
    routeRisk === "HIGH"
      ? "text-red-400"
      : routeRisk === "MEDIUM"
      ? "text-yellow-400"
      : "text-emerald-400";

  /* =====================================================
     ETA EXPLAINABILITY
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
            .includes(
              "congestion"
            )
      );

    const trainHasCongestion =
      train?.delayReason
        ?.toLowerCase()
        .includes(
          "congestion"
        );

    if (
      hasCongestion ||
      trainHasCongestion
    ) {
      reasons.push({
        label:
          "Operational congestion",

        detail:
          "Route congestion may reduce effective running speed and increase ETA uncertainty.",

        impact:
          "ETA risk",

        type: "congestion",
      });
    }

    const hasSpeedRestriction =
      alerts.some(
        (alert) =>
          alert?.type === "speed" ||
          alert?.title
            ?.toLowerCase()
            .includes(
              "speed"
            )
      );

    if (hasSpeedRestriction) {
      reasons.push({
        label:
          "Speed restriction",

        detail:
          "Temporary speed restriction may increase running time on the affected section.",

        impact:
          "ETA risk",

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
              (rank[
                risk?.severity
              ] || 0) >
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
          `${highestActiveRisk?.name || "Risk zone"} is currently affecting the train's operational section.`,

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
        label:
          "Station dwell",

        detail:
          `Train is currently halted at ${liveCurrentStation}. Station dwell time is included in the operational forecast.`,

        impact:
          "ETA monitored",

        type: "halt",
      });
    }

    if (
      liveMovement ===
      "APPROACHING"
    ) {
      reasons.push({
        label:
          "Station approach",

        detail:
          `Train is approaching ${liveNextStation}. Speed adjustment is being considered in the live simulation.`,

        impact:
          "ETA monitored",

        type: "station",
      });
    }

    if (reasons.length === 0) {
      reasons.push({
        label:
          "Stable operating conditions",

        detail:
          "No significant operational factor is currently affecting the predicted ETA.",

        impact:
          "Stable",

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

      {/* HEADER */}

      <header className="border-b border-white/10 bg-[#081321]">

        <div className="mx-auto max-w-[1600px] px-5 py-4">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="text-xs font-semibold tracking-[0.25em] text-cyan-400">
                INDIAN RAILWAYS • OPERATIONAL INTELLIGENCE
              </div>

              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                Dynamic ETA Forecast & Control Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                AI-assisted real-time train monitoring and delay propagation
              </p>

            </div>

            <div className="flex items-center gap-3">

              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                  <span className="text-xs font-semibold text-emerald-300">
                    SYSTEM ONLINE
                  </span>

                </div>

              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">

                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Last update
                </div>

                <div className="text-xs font-medium text-slate-300">
                  {lastUpdated.toLocaleTimeString()}
                </div>

              </div>

            </div>

          </div>

        </div>

      </header>

      <main className="mx-auto max-w-[1600px] px-5 py-5">

        {/* =================================================
            TOP KPI CARDS
            ================================================= */}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          {/* ML ETA */}

          <div className="rounded-2xl border border-cyan-400/20 bg-[#0a1424] p-5 shadow-lg shadow-cyan-950/10">

            <div className="flex items-start justify-between">

              <div>

                <div className="text-xs font-semibold tracking-wider text-slate-400">
                  ML ETA PREDICTION
                </div>

                <div className="mt-2 text-3xl font-bold text-cyan-300">
                  {eta.predictedEta}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  Scheduled:{" "}
                  {eta.scheduledEta}
                </div>

              </div>

              <div className="rounded-lg bg-cyan-400/10 px-2 py-1 text-xs font-bold text-cyan-300">
                {confidence}%
              </div>

            </div>

            <div className="mt-4 h-14">

              {etaHistory.length > 1 ? (

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

                    <YAxis
                      hide
                      domain={[
                        "dataMin - 2",
                        "dataMax + 2",
                      ]}
                    />

                    <Tooltip
                      formatter={(
                        value,
                        name,
                        props
                      ) => [
                        props?.payload
                          ?.label ||
                          value,
                        "Predicted ETA",
                      ]}
                      contentStyle={{
                        background:
                          "#0a1424",
                        border:
                          "1px solid rgba(255,255,255,0.1)",
                        borderRadius:
                          "8px",
                        color: "#fff",
                        fontSize:
                          "11px",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="eta"
                      strokeWidth={2}
                      dot={false}
                      stroke="#22d3ee"
                    />

                  </LineChart>

                </ResponsiveContainer>

              ) : (

                <div className="flex h-full items-end">

                  <div className="h-px w-full bg-cyan-400/20" />

                </div>

              )}

            </div>

          </div>

          {/* CURRENT DELAY */}

          <div className="rounded-2xl border border-yellow-400/20 bg-[#0a1424] p-5">

            <div className="text-xs font-semibold tracking-wider text-slate-400">
              CURRENT DELAY
            </div>

            <div className="mt-3 flex items-end gap-2">

              <span className="text-3xl font-bold text-yellow-300">
                {currentDelay}
              </span>

              <span className="pb-1 text-sm text-slate-400">
                minutes
              </span>

            </div>

            <div className="mt-2 text-xs text-slate-500">
              {train?.delayReason ||
                "Operational status normal"}
            </div>

          </div>

          {/* DELAY PROPAGATION */}

          <div className="rounded-2xl border border-orange-400/20 bg-[#0a1424] p-5">

            <div className="text-xs font-semibold tracking-wider text-slate-400">
              DELAY PROPAGATION
            </div>

            <div className="mt-3 text-3xl font-bold text-orange-300">
              {propagation.length}
            </div>

            <div className="mt-2 text-xs text-slate-500">
              downstream stations monitored
            </div>

          </div>

          {/* ROUTE RISK */}

          <div className="rounded-2xl border border-red-400/20 bg-[#0a1424] p-5">

            <div className="text-xs font-semibold tracking-wider text-slate-400">
              ROUTE RISK
            </div>

            <div
              className={`mt-3 text-3xl font-bold ${routeRiskClass}`}
            >
              {routeRisk}
            </div>

            <div className="mt-2 text-xs text-slate-500">
              Based on live operational risk conditions
            </div>

          </div>

        </section>

        {/* =================================================
            MAP + CONTROL PANEL
            ================================================= */}

        <section className="mt-5 grid gap-5 xl:h-[760px] xl:grid-cols-[minmax(0,1fr)_390px]">

          {/* MAP */}

          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a1424]">

            <div className="flex shrink-0 flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="text-xs font-semibold tracking-[0.2em] text-cyan-400">
                  LIVE RAILWAY MAP
                </div>

                <div className="mt-1 text-sm font-semibold text-white">
                  {train.trainNumber} •{" "}
                  {train.trainName}
                </div>

              </div>

              <div className="flex items-center gap-2">

                <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">

                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    Movement
                  </div>

                  <div className="text-xs font-semibold text-emerald-300">
                    {liveMovement}
                  </div>

                </div>

                <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2">

                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    Prediction
                  </div>

                  <div className="text-xs font-semibold text-cyan-300">
                    {confidence}% confidence
                  </div>

                </div>

              </div>

            </div>

            <div className="min-h-0 flex-1">

              <RailwayMap
                riskZones={riskZones}
                onProgressUpdate={
                  setRouteProgress
                }
                onLocationUpdate={
                  setMapLocation
                }
                onStationUpdate={
                  setStationInfo
                }
                onRiskUpdate={
                  setRiskInfo
                }
              />

            </div>

          </div>

          {/* CONTROL PANEL */}

          <div className="min-h-0 space-y-5 overflow-y-auto pr-1">

            {/* TRAIN STATUS */}

            <div className="rounded-2xl border border-white/10 bg-[#0a1424] p-5">

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <div className="text-xs font-semibold tracking-[0.18em] text-cyan-400">
                    TRAIN STATUS
                  </div>

                  <div className="mt-1 text-lg font-bold">
                    {train.trainNumber}
                  </div>

                </div>

                <div className="rounded-lg bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                  LIVE
                </div>

              </div>

              <div className="space-y-3">

                <div className="flex items-center justify-between border-b border-white/5 pb-3">

                  <span className="text-xs text-slate-500">
                    Current station
                  </span>

                  <span className="text-right text-sm font-medium text-slate-200">
                    {liveCurrentStation}
                  </span>

                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-3">

                  <span className="text-xs text-slate-500">
                    Next station
                  </span>

                  <span className="text-right text-sm font-medium text-slate-200">
                    {liveNextStation}
                  </span>

                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-3">

                  <span className="text-xs text-slate-500">
                    Destination
                  </span>

                  <span className="text-right text-sm font-medium text-slate-200">
                    {train.finalDestination}
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-xs text-slate-500">
                    Movement
                  </span>

                  <span className="text-right text-sm font-semibold text-cyan-300">
                    {liveMovement}
                  </span>

                </div>

              </div>

            </div>

            {/* ROUTE PROGRESS — SINGLE INSTANCE */}

            <div className="rounded-2xl border border-cyan-400/20 bg-[#0a1424] p-5">

              <div className="flex items-center justify-between">

                <div>

                  <div className="text-xs font-semibold tracking-[0.18em] text-cyan-400">
                    ROUTE PROGRESS
                  </div>

                  <div className="mt-1 text-[11px] text-slate-500">
                    Live journey completion
                  </div>

                </div>

                <span className="text-2xl font-bold text-cyan-300">
                  {Math.round(
                    routeProgress
                  )}
                  %
                </span>

              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">

                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        routeProgress
                      )
                    )}%`,
                  }}
                />

              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-600">

                <span>
                  {train.currentStation}
                </span>

                <span>
                  {train.finalDestination}
                </span>

              </div>

            </div>

            {/* DELAY PROPAGATION */}

            <div className="rounded-2xl border border-white/10 bg-[#0a1424] p-5">

              <div className="text-xs font-semibold tracking-[0.18em] text-orange-400">
                DELAY PROPAGATION
              </div>

              <div className="mt-4 space-y-3">

                {propagation.length > 0 ? (

                  propagation.map(
                    (item) => (

                      <div
                        key={
                          item.station
                        }
                        className="rounded-xl border border-white/5 bg-white/[0.025] p-3"
                      >

                        <div className="flex items-center justify-between">

                          <span className="text-sm font-semibold text-slate-200">
                            {item.station}
                          </span>

                          <span
                            className={`text-xs font-bold ${
                              item.risk ===
                              "High"
                                ? "text-red-400"
                                : item.risk ===
                                  "Medium"
                                ? "text-yellow-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {item.risk}
                          </span>

                        </div>

                        <div className="mt-2 flex items-center justify-between">

                          <span className="text-xs text-slate-500">
                            Propagated delay
                          </span>

                          <span className="text-sm font-bold text-orange-300">
                            +
                            {
                              item.calculatedDelay
                            }{" "}
                            min
                          </span>

                        </div>

                        <div className="mt-1 text-[11px] text-slate-600">
                          Scheduled:{" "}
                          {
                            item.scheduledTime
                          }
                        </div>

                      </div>

                    )
                  )

                ) : (

                  <div className="text-sm text-slate-500">
                    No downstream propagation data available.
                  </div>

                )}

              </div>

            </div>

            {/* WHY ETA CHANGED */}

            <div className="rounded-2xl border border-cyan-400/20 bg-[#0a1424] p-5">

              <div className="flex items-center justify-between">

                <div>

                  <div className="text-xs font-semibold tracking-[0.18em] text-cyan-400">
                    WHY ETA CHANGED?
                  </div>

                  <div className="mt-1 text-[11px] text-slate-500">
                    Explainable ETA adjustment
                  </div>

                </div>

                <div className="rounded-lg bg-yellow-400/10 px-3 py-1.5">

                  <span className="text-xs font-bold text-yellow-300">

                    ETA{" "}

                    {eta.etaDifference > 0
                      ? `+${eta.etaDifference}`
                      : "ON TIME"}{" "}

                    min

                  </span>

                </div>

              </div>

              <div className="mt-4 space-y-2">

                {etaReasons.map(
                  (
                    reason,
                    index
                  ) => {

                    const dotClass =
                      reason.type ===
                      "delay"
                        ? "bg-yellow-400"
                        : reason.type ===
                          "propagation"
                        ? "bg-orange-400"
                        : reason.type ===
                          "congestion"
                        ? "bg-red-400"
                        : reason.type ===
                          "speed"
                        ? "bg-cyan-400"
                        : reason.type ===
                          "risk"
                        ? "bg-purple-400"
                        : reason.type ===
                          "halt"
                        ? "bg-orange-300"
                        : reason.type ===
                          "station"
                        ? "bg-blue-400"
                        : "bg-emerald-400";

                    return (
                      <div
                        key={`${reason.label}-${index}`}
                        className="rounded-xl border border-white/5 bg-white/[0.025] p-3"
                      >

                        <div className="flex items-start gap-3">

                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClass}`}
                          />

                          <div className="min-w-0 flex-1">

                            <div className="flex items-center justify-between gap-3">

                              <span className="text-xs font-semibold text-slate-200">
                                {reason.label}
                              </span>

                              <span
                                className={`shrink-0 text-[10px] font-bold ${
                                  reason.type ===
                                  "normal"
                                    ? "text-emerald-400"
                                    : "text-yellow-300"
                                }`}
                              >
                                {reason.impact}
                              </span>

                            </div>

                            <div className="mt-1 text-[11px] leading-4 text-slate-500">
                              {reason.detail}
                            </div>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

              <div className="mt-4 border-t border-white/5 pt-3">

                <div className="flex items-center justify-between">

                  <span className="text-[10px] uppercase tracking-wider text-slate-600">
                    Prediction confidence
                  </span>

                  <span className="text-xs font-bold text-cyan-300">
                    {confidence}%
                  </span>

                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">

                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          confidence
                        )
                      )}%`,
                    }}
                  />

                </div>

              </div>

            </div>

            {/* ACTIVE RISK */}

            <div className="rounded-2xl border border-white/10 bg-[#0a1424] p-5">

              <div className="text-xs font-semibold tracking-[0.18em] text-red-400">
                ACTIVE RISK MONITOR
              </div>

              <div className="mt-4">

                {riskInfo?.activeRisks?.length > 0 ? (

                  <div className="space-y-2">

                    {riskInfo.activeRisks
                      .slice(0, 2)
                      .map(
                        (risk) => (

                          <div
                            key={
                              risk.id
                            }
                            className="rounded-xl border border-red-400/10 bg-red-400/5 p-4"
                          >

                            <div className="flex items-center justify-between">

                              <span className="text-sm font-semibold text-slate-200">
                                {risk.name}
                              </span>

                              <span className="text-xs font-bold text-red-400">
                                {
                                  risk.severity
                                }
                              </span>

                            </div>

                            <div className="mt-2 text-xs text-slate-400">
                              {
                                risk.impact
                              }
                            </div>

                          </div>

                        )
                      )}

                  </div>

                ) : (

                  <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4 text-xs text-slate-500">
                    No immediate risk detected at current train position.
                  </div>

                )}

              </div>

            </div>

            {/* ALERT CENTER */}

            <div className="rounded-2xl border border-white/10 bg-[#0a1424] p-5">

              <div className="flex items-center justify-between">

                <div className="text-xs font-semibold tracking-[0.18em] text-yellow-400">
                  ALERT CENTER
                </div>

                <div className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-400">
                  {alerts.length} alerts
                </div>

              </div>

              <div className="mt-4 space-y-3">

                {alerts.length > 0 ? (

                  alerts.map(
                    (
                      alert,
                      index
                    ) => (

                      <div
                        key={`${alert.title}-${index}`}
                        className="rounded-xl border border-white/5 bg-white/[0.025] p-3"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <div className="text-sm font-semibold text-slate-200">
                              {
                                alert.title
                              }
                            </div>

                            <div className="mt-1 text-xs leading-5 text-slate-500">
                              {
                                alert.message
                              }
                            </div>

                          </div>

                          <span
                            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                              alert.severity ===
                              "warning"
                                ? "bg-yellow-400"
                                : alert.severity ===
                                  "info"
                                ? "bg-cyan-400"
                                : "bg-emerald-400"
                            }`}
                          />

                        </div>

                      </div>

                    )
                  )

                ) : (

                  <div className="text-sm text-slate-500">
                    No active alerts.
                  </div>

                )}

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            FOOTER
            ================================================= */}

        <footer className="mt-6 border-t border-white/10 py-5 text-center">

          <div className="text-[10px] font-semibold tracking-[0.2em] text-slate-600">
            SIH 2026 • DYNAMIC FORECAST OF EXPECTED TIME OF ARRIVAL
          </div>

          <div className="mt-1 text-[10px] text-slate-700">
            Prototype dashboard • Authorized railway operational data integration ready
          </div>

        </footer>

      </main>

    </div>
  );
}

export default App;