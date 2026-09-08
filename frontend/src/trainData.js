const trainData = {
  trainNumber: "12345",
  trainName: "Howrah Express",

  currentStation: "Howrah Junction",
  nextStation: "Bandel Junction",
  finalDestination: "Barddhaman Junction",

  currentLocation: {
    lat: 22.5839,
    lng: 88.3428,
    type: "At Station",
    description: "Train is currently at Howrah Junction",
  },

  scheduledEta: "14:25",
  predictedEta: "14:35",
  etaDifference: 10,

  delay: 12,
  delayReason: "Operational congestion",
  status: "On Route",

  alerts: [
    {
      type: "delay",
      title: "Delay Alert",
      message: "Train is running 12 minutes late.",
      severity: "warning",
    },
    {
      type: "congestion",
      title: "Operational Congestion",
      message: "Moderate congestion detected on the route.",
      severity: "warning",
    },
    {
      type: "speed",
      title: "Speed Restriction",
      message: "Temporary speed restriction may affect ETA.",
      severity: "info",
    },
    {
      type: "halt",
      title: "Unscheduled Halt",
      message: "No unscheduled halt detected.",
      severity: "normal",
    },
  ],

  upcomingStations: [
    {
      name: "Howrah Junction",
      status: "Current",
      eta: "13:40",
    },
    {
      name: "Bandel Junction",
      status: "Next",
      eta: "14:25",
    },
    {
      name: "Barddhaman Junction",
      status: "Upcoming",
      eta: "15:15",
    },
  ],

  etaForecast: [
    {
      station: "Howrah Junction",
      scheduled: "13:40",
      predicted: "13:40",
    },
    {
      station: "Bandel Junction",
      scheduled: "14:25",
      predicted: "14:35",
    },
    {
      station: "Barddhaman Junction",
      scheduled: "15:15",
      predicted: "15:30",
    },
  ],
};

export default trainData;