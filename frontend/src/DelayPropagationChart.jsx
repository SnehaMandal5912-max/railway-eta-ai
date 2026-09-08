import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const delayData = [
  {
    station: "Howrah",
    delay: 12,
    reason: "Operational congestion",
  },
  {
    station: "Bandel",
    delay: 15,
    reason: "Speed restriction",
  },
  {
    station: "Barddhaman",
    delay: 17,
    reason: "Expected propagation",
  },
];

function DelayPropagationChart() {
  return (
    <div className="bg-slate-900 rounded-2xl p-7 border border-slate-800">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">
          📉 Delay Propagation Analysis
        </h2>

        <p className="text-slate-400 mt-1">
          Delay variation across upcoming stations
        </p>
      </div>

      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={delayData}
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
              label={{
                value: "Delay (minutes)",
                angle: -90,
                position: "insideLeft",
                fill: "#94a3b8",
              }}
            />

            <Tooltip
  contentStyle={{
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "10px",
    color: "white",
  }}
  formatter={(value, name, props) => {
    if (name === "Delay") {
      return [
        `+${value} min`,
        `Delay — ${props.payload.reason}`,
      ];
    }

    return [value, name];
  }}
/>

            <Line
              type="monotone"
              dataKey="delay"
              name="Delay"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 bg-slate-800 rounded-xl p-4">
        <p className="text-slate-300 text-sm">
          📊 This visualization shows how the current delay may
          propagate across upcoming stations.
        </p>
      </div>
    </div>
  );
}

export default DelayPropagationChart;