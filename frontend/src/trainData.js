const trainData = {
  /*
   * =====================================================
   * DEMO TRAIN DATA
   * Monitored route:
   * Kolkata -> Asansol -> Dhanbad -> Gomoh
   * -> Koderma -> New Delhi
   *
   * This is simulation/demo data.
   * It is not live railway operational data.
   * =====================================================
   */

  trainNumber: "12345",
  trainName: "Howrah Express",

  /* =====================================================
     CURRENT TRAIN STATUS
  ===================================================== */

  currentStation: "Kolkata",
  nextStation: "Asansol",
  finalDestination: "New Delhi",

  currentLocation: {
    lat: 22.5726,
    lng: 88.3639,
    type: "At Station",
    description: "Train is currently at Kolkata",
  },

  /* =====================================================
     ETA
  ===================================================== */

  scheduledEta: "14:25",
  predictedEta: "14:35",
  etaDifference: 10,

  /* Keep delay consistent with dashboard ETA deviation */
  delay: 10,

  delayReason: "Operational congestion",
  status: "On Route",

  predictionConfidence: 92,

  /* =====================================================
     DELAY PROPAGATION
     Current monitored route:
     Kolkata -> Asansol -> Dhanbad -> Gomoh
     -> Koderma -> New Delhi
  ===================================================== */

  delayPropagation: [
    {
      station: "Asansol",
      scheduledTime: null,
      propagatedDelay: 7,
      propagationFactor: 0.67,
      risk: "Medium",
    },
    {
      station: "Dhanbad",
      scheduledTime: null,
      propagatedDelay: 4,
      propagationFactor: 0.42,
      risk: "Low",
    },
  ],

  /* =====================================================
     OPERATIONAL ALERTS
  ===================================================== */

  alerts: [
    {
      type: "delay",
      title: "Delay Alert",
      message: "Train is running 10 minutes late.",
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

  /* =====================================================
     RISK ZONES
     These coordinates are aligned with the current
     Kolkata -> New Delhi demo route.
  ===================================================== */

  riskZones: [
    {
      id: 1,
      name: "Asansol Track Zone",
      type: "Track Risk",
      severity: "Medium",
      lat: 23.6739,
      lng: 87.148,
      radius: 900,
      impact: "Possible speed restriction",
    },

    {
      id: 2,
      name: "Dhanbad Operational Zone",
      type: "Operational Risk",
      severity: "High",
      lat: 23.7957,
      lng: 86.4304,
      radius: 1200,
      impact: "Operational congestion possibility",
    },

    {
      id: 3,
      name: "Koderma Track Zone",
      type: "Track Risk",
      severity: "Low",
      lat: 24.4674,
      lng: 85.593,
      radius: 800,
      impact: "Operational caution required",
    },
  ],

  /* =====================================================
     UPCOMING STATIONS
  ===================================================== */

  upcomingStations: [
    {
      name: "Kolkata",
      status: "Current",
      eta: null,
    },

    {
      name: "Asansol",
      status: "Next",
      eta: null,
    },

    {
      name: "Dhanbad",
      status: "Upcoming",
      eta: null,
    },

    {
      name: "Gomoh",
      status: "Upcoming",
      eta: null,
    },

    {
      name: "Koderma",
      status: "Upcoming",
      eta: null,
    },

    {
      name: "New Delhi",
      status: "Destination",
      eta: null,
    },
  ],
};

export default trainData;