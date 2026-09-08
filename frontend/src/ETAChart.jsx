import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";


// 📊 ETA Forecast Data
const etaData = [
  {
    station: "Howrah",
    scheduled: 820,
    predicted: 820,
  },

  {
    station: "Bandel",
    scheduled: 865,
    predicted: 875,
  },

  {
    station: "Barddhaman",
    scheduled: 915,
    predicted: 930,
  },
];


function ETAChart() {

  return (

    <div className="bg-slate-900 rounded-2xl p-7 border border-slate-800">

      {/* Header */}

      <div className="mb-6">

        <h2 className="text-2xl font-semibold">
          📊 ETA Forecast Analysis
        </h2>

        <p className="text-slate-400 mt-1">
          Scheduled vs Predicted Arrival Time
        </p>

      </div>


      {/* Chart */}

      <div className="w-full h-[350px]">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <LineChart
            data={etaData}
            margin={{
              top: 10,
              right: 30,
              left: 10,
              bottom: 10,
            }}
          >

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
            />

            <XAxis
              dataKey="station"
              stroke="#94a3b8"
            />

            <YAxis
              stroke="#94a3b8"
              domain={["auto", "auto"]}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "10px",
                color: "white",
              }}
            />

            <Legend />


            {/* Scheduled ETA */}

            <Line
              type="monotone"
              dataKey="scheduled"
              name="Scheduled ETA"
              strokeWidth={3}
              stroke="#60a5fa"
              dot={{
                r: 5,
              }}
              activeDot={{
                r: 7,
              }}
            />


            {/* Predicted ETA */}

            <Line
              type="monotone"
              dataKey="predicted"
              name="Predicted ETA"
              strokeWidth={3}
              stroke="#34d399"
              dot={{
                r: 5,
              }}
              activeDot={{
                r: 7,
              }}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>


      {/* Explanation */}

      <div className="mt-5 bg-slate-800 rounded-xl p-4">

        <p className="text-slate-300 text-sm">

          🤖 The predicted ETA is calculated using
          dynamic train conditions and can later be
          connected with the ML prediction model.

        </p>

      </div>

    </div>

  );
}


export default ETAChart;