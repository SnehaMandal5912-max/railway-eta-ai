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

  predictionConfidence: 92,

  delayPropagation: [
    {
      station: "Asansol",
      scheduledTime: "21:55",
      propagatedDelay: 18,
      propagationFactor: 0.78,
      risk: "High",
    },
    {
      station: "Dhanbad",
      scheduledTime: "22:30",
      propagatedDelay: 15,
      propagationFactor: 0.65,
      risk: "Medium",
    },
  ],

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

  riskZones: [
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
      status: "Destination",
      eta: "15:15",
    },
  ],
};

export default trainData;