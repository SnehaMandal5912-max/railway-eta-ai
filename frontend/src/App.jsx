import { useState } from "react";

import RailwayMap from "./map";
import ETAChart from "./ETAChart";
import DelayPropagationChart from "./DelayPropagationChart";
import trainData from "./trainData";

function App() {
  const [stationInfo, setStationInfo] = useState({
    currentStation: trainData.currentStation,
    nextStation: trainData.nextStation,
    upcomingStation: trainData.finalDestination,
  });

  const [progress, setProgress] = useState(0);

  const [locationInfo, setLocationInfo] = useState({
    type: trainData.currentLocation.type,
    description: trainData.currentLocation.description,
    latitude: trainData.currentLocation.lat,
    longitude: trainData.currentLocation.lng,
  });

  // Prototype operational prioritization rule
  const getPriority = () => {
    if (trainData.delay >= 15) {
      return {
        level: "HIGH PRIORITY",
        badge:
          "bg-red-500/20 text-red-400 border-red-500/40",
        message: "Immediate monitoring recommended",
      };
    }

    if (trainData.delay >= 10) {
      return {
        level: "MEDIUM PRIORITY",
        badge:
          "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
        message: "Operational attention recommended",
      };
    }

    return {
      level: "NORMAL",
      badge:
        "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      message: "No immediate attention required",
    };
  };

  const priority = getPriority();

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ================= HEADER ================= */}

      <header className="border-b border-slate-800 bg-slate-900">

        <div className="max-w-7xl mx-auto px-6 py-5">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <h1 className="text-3xl font-bold">
                🚆 Railway ETA Control Dashboard
              </h1>

              <p className="text-slate-400 mt-1">
                Dynamic Forecast of Expected Time of Arrival
              </p>

            </div>

            <div className="flex items-center gap-3">

              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl">

                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>

                <span className="text-sm text-emerald-400 font-medium">
                  LIVE SYSTEM
                </span>

              </div>

              <div className="bg-slate-800 px-4 py-2 rounded-xl">

                <span className="text-sm text-slate-400">
                  Train
                </span>

                <span className="ml-2 font-semibold">
                  {trainData.trainNumber}
                </span>

              </div>

            </div>

          </div>

        </div>

      </header>


      {/* ================= MAIN ================= */}

      <main className="max-w-7xl mx-auto px-6 py-8">


        {/* ================= SUMMARY CARDS ================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">


          {/* Current Location */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

            <p className="text-slate-400 text-sm">
              Current Location
            </p>

            <h2 className="text-xl font-semibold mt-2">
              {stationInfo.currentStation}
            </h2>

            <p className="text-emerald-400 text-sm mt-2">
              {locationInfo.type}
            </p>

          </div>


          {/* Next Station */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

            <p className="text-slate-400 text-sm">
              Next Station
            </p>

            <h2 className="text-xl font-semibold mt-2">
              {stationInfo.nextStation}
            </h2>

            <p className="text-blue-400 text-sm mt-2">
              ETA: {trainData.predictedEta}
            </p>

          </div>


          {/* Predicted ETA */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

            <p className="text-slate-400 text-sm">
              Predicted ETA
            </p>

            <h2 className="text-2xl font-bold mt-2 text-emerald-400">
              {trainData.predictedEta}
            </h2>

            <p className="text-slate-400 text-sm mt-2">
              Scheduled: {trainData.scheduledEta}
            </p>

          </div>


          {/* Current Delay */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

            <p className="text-slate-400 text-sm">
              Current Delay
            </p>

            <h2 className="text-2xl font-bold mt-2 text-yellow-400">
              +{trainData.delay} min
            </h2>

            <p className="text-slate-400 text-sm mt-2">
              {trainData.delayReason}
            </p>

          </div>


          {/* Train Status */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

            <p className="text-slate-400 text-sm">
              Train Status
            </p>

            <h2 className="text-xl font-semibold mt-2 text-blue-400">
              {trainData.status}
            </h2>

            <p className="text-slate-400 text-sm mt-2">
              Progress: {progress}%
            </p>

          </div>

        </div>



        {/* ================= TRAIN INFORMATION + ETA + ALERTS ================= */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">


          {/* Train Information */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7">

            <h2 className="text-2xl font-semibold mb-6">
              🚆 Train Information
            </h2>

            <div className="space-y-5">


              <div>

                <p className="text-slate-400 text-sm">
                  Train Number
                </p>

                <p className="text-lg font-semibold mt-1">
                  {trainData.trainNumber}
                </p>

              </div>


              <div>

                <p className="text-slate-400 text-sm">
                  Train Name
                </p>

                <p className="text-lg font-semibold mt-1">
                  {trainData.trainName}
                </p>

              </div>


              {/* Current Location removed from here */}


              <div>

                <p className="text-slate-400 text-sm">
                  Next Station
                </p>

                <p className="text-lg font-semibold mt-1">
                  {stationInfo.nextStation}
                </p>

              </div>


              <div>

                <p className="text-slate-400 text-sm">
                  Final Destination
                </p>

                <p className="text-lg font-semibold mt-1">
                  {trainData.finalDestination}
                </p>

              </div>

            </div>

          </div>



          {/* ETA Prediction */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7">

            <h2 className="text-2xl font-semibold mb-6">
              🤖 ETA Prediction
            </h2>

            <div className="space-y-6">


              <div>

                <p className="text-slate-400 text-sm">
                  Scheduled ETA
                </p>

                <p className="text-3xl font-bold mt-2">
                  {trainData.scheduledEta}
                </p>

              </div>


              <div>

                <p className="text-slate-400 text-sm">
                  AI Predicted ETA
                </p>

                <p className="text-3xl font-bold mt-2 text-emerald-400">
                  {trainData.predictedEta}
                </p>

              </div>


              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">

                <p className="text-yellow-400 text-sm">
                  ETA Difference
                </p>

                <p className="text-2xl font-bold mt-1 text-yellow-400">
                  +{trainData.etaDifference} min
                </p>

              </div>


              <p className="text-slate-400 text-sm leading-relaxed">
                Dynamic ETA is designed to consider operational
                conditions, delay propagation and route-level
                information through the ML backend.
              </p>

            </div>

          </div>



          {/* Alert Center */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7">

            <h2 className="text-2xl font-semibold mb-6">
              🚨 Alert Center
            </h2>

            <div className="space-y-4">

              {trainData.alerts.map((alert, index) => (

                <div
                  key={index}
                  className={`rounded-xl p-4 border ${
                    alert.severity === "warning"
                      ? "bg-yellow-500/10 border-yellow-500/30"
                      : alert.severity === "info"
                      ? "bg-blue-500/10 border-blue-500/30"
                      : "bg-emerald-500/10 border-emerald-500/30"
                  }`}
                >

                  <p className="font-semibold">
                    {alert.title}
                  </p>

                  <p className="text-sm text-slate-400 mt-1">
                    {alert.message}
                  </p>

                </div>

              ))}

            </div>

          </div>

        </div>



        {/* ================= OPERATIONAL DECISION SUPPORT ================= */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 mb-8">


          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

            <div>

              <h2 className="text-2xl font-semibold">
                🎯 Operational Decision Support
              </h2>

              <p className="text-slate-400 mt-1">
                Prototype prioritization for control-room monitoring
              </p>

            </div>


            <div
              className={`px-4 py-2 rounded-xl border font-semibold text-sm ${priority.badge}`}
            >
              {priority.level}
            </div>

          </div>



          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">


            {/* Monitoring Priority */}

            <div className="bg-slate-800 rounded-xl p-5">

              <p className="text-slate-400 text-sm">
                Monitoring Priority
              </p>

              <p className="text-xl font-bold mt-2">
                {priority.level}
              </p>

              <p className="text-sm text-slate-400 mt-2">
                {priority.message}
              </p>

            </div>



            {/* Primary Reason */}

            <div className="bg-slate-800 rounded-xl p-5">

              <p className="text-slate-400 text-sm">
                Primary Reason
              </p>

              <p className="text-xl font-semibold mt-2">
                {trainData.delayReason}
              </p>

              <p className="text-sm text-slate-400 mt-2">
                Current delay: +{trainData.delay} minutes
              </p>

            </div>



            {/* Recommended Action */}

            <div className="bg-slate-800 rounded-xl p-5">

              <p className="text-slate-400 text-sm">
                Recommended Action
              </p>

              <p className="text-xl font-semibold mt-2">
                Monitor Route
              </p>

              <p className="text-sm text-slate-400 mt-2">
                Monitor congestion and downstream ETA impact.
              </p>

            </div>

          </div>



          <div className="mt-5 bg-slate-800 rounded-xl p-5">

            <p className="text-slate-300 text-sm leading-relaxed">

              💡 <strong>Decision Support:</strong>{" "}
              This prototype uses the current delay as a simple
              prioritization signal. In the production system,
              this module can combine ML-predicted ETA, delay
              propagation, congestion, speed restrictions,
              unscheduled stoppages and other authorized
              operational data to prioritize trains requiring
              attention.

            </p>

          </div>

        </div>



        {/* ================= WHY ETA CHANGED ================= */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 mb-8">

          <div className="mb-6">

            <h2 className="text-2xl font-semibold">
              🧠 Why ETA Changed?
            </h2>

            <p className="text-slate-400 mt-1">
              Explainable factors affecting the predicted arrival time
            </p>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">


            {/* Current Delay */}

            <div className="bg-slate-800 rounded-xl p-5">

              <p className="text-slate-400 text-sm">
                Current Delay
              </p>

              <p className="text-2xl font-bold text-yellow-400 mt-2">
                +{trainData.delay} min
              </p>

              <p className="text-slate-400 text-sm mt-2">
                {trainData.delayReason}
              </p>

            </div>



            {/* Route Condition */}

            <div className="bg-slate-800 rounded-xl p-5">

              <p className="text-slate-400 text-sm">
                Route Condition
              </p>

              <p className="text-xl font-semibold mt-2">
                Operational Congestion
              </p>

              <p className="text-slate-400 text-sm mt-2">
                Moderate congestion detected on the route.
              </p>

            </div>



            {/* Speed Restriction */}

            <div className="bg-slate-800 rounded-xl p-5">

              <p className="text-slate-400 text-sm">
                Speed Restriction
              </p>

              <p className="text-xl font-semibold mt-2">
                Temporary Restriction
              </p>

              <p className="text-slate-400 text-sm mt-2">
                May increase travel time and affect downstream ETA.
              </p>

            </div>

          </div>



          <div className="mt-5 bg-slate-800 rounded-xl p-5">

            <p className="text-slate-300 text-sm leading-relaxed">

              🤖 The current delay, operational congestion and
              speed restrictions are example factors. In the
              production system, these factors can be supplied
              to the ML model through the backend API to generate
              a dynamic ETA prediction.

            </p>

          </div>

        </div>



        {/* ================= JOURNEY PROGRESS ================= */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 mb-8">

          <div className="flex justify-between items-center mb-4">

            <div>

              <h2 className="text-2xl font-semibold">
                📍 Journey Progress
              </h2>

              <p className="text-slate-400 mt-1">
                Live train movement along the route
              </p>

            </div>

            <p className="text-2xl font-bold text-emerald-400">
              {progress}%
            </p>

          </div>


          <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">

            <div
              className="bg-emerald-500 h-4 rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            ></div>

          </div>


          <div className="flex justify-between text-sm text-slate-500 mt-3">

            <span>
              Howrah Junction
            </span>

            <span>
              {stationInfo.nextStation}
            </span>

            <span>
              {trainData.finalDestination}
            </span>

          </div>

        </div>



        {/* ================= RAILWAY JOURNEY ================= */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 mb-8">

          <div className="mb-6">

            <h2 className="text-2xl font-semibold">
              🗺️ Railway Journey
            </h2>

            <p className="text-slate-400 mt-1">
              Interactive live railway route and train location
            </p>

          </div>


          <div className="h-[600px] rounded-xl overflow-hidden border border-slate-700">

            <RailwayMap
              onStationChange={setStationInfo}
              onProgressChange={setProgress}
              onLocationChange={setLocationInfo}
            />

          </div>

        </div>



        {/* ================= ETA CHART ================= */}

        <div className="mb-8">

          <ETAChart />

        </div>



        {/* ================= DELAY PROPAGATION ================= */}

        <div className="mb-8">

          <DelayPropagationChart />

        </div>


        

        {/* ================= SYSTEM INFORMATION ================= */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7">

          <h2 className="text-2xl font-semibold mb-5">
            ⚙️ System Information
          </h2>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">


            <div className="bg-slate-800 rounded-xl p-5">

              <p className="text-slate-400 text-sm">
                Data Source
              </p>

              <p className="font-semibold mt-2">
                Backend API
              </p>

              <p className="text-slate-500 text-sm mt-1">
                Integration-ready architecture
              </p>

            </div>


            <div className="bg-slate-800 rounded-xl p-5">

              <p className="text-slate-400 text-sm">
                Prediction Engine
              </p>

              <p className="font-semibold mt-2">
                ML ETA Model
              </p>

              <p className="text-slate-500 text-sm mt-1">
                Dynamic prediction pipeline
              </p>

            </div>


            <div className="bg-slate-800 rounded-xl p-5">

              <p className="text-slate-400 text-sm">
                Dashboard
              </p>

              <p className="font-semibold mt-2">
                Control-Room View
              </p>

              <p className="text-slate-500 text-sm mt-1">
                Real-time operational monitoring
              </p>

            </div>

          </div>


          <div className="mt-6 pt-5 border-t border-slate-800">

            <p className="text-slate-500 text-sm leading-relaxed">

              Prototype note: Current train information and
              operational conditions are simulated data for
              dashboard demonstration. Production deployment
              should consume authorized railway operational
              data through the backend integration layer.

            </p>

          </div>

        </div>

      </main>



      {/* ================= FOOTER ================= */}

      <footer className="border-t border-slate-800 bg-slate-900 mt-10">

        <div className="max-w-7xl mx-auto px-6 py-5">

          <p className="text-center text-slate-500 text-sm">
            Railway ETA AI — Control Room Dashboard Prototype
          </p>

        </div>

      </footer>

    </div>
  );
}

export default App;