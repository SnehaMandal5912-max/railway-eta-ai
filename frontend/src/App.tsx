import { useState } from "react";
function App() {
  const [trainNumber, setTrainNumber] = useState("");
  const [trainFound, setTrainFound] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [eta, setEta] = useState("10:47 PM");
  

  const findTrain = () => {
    if (trainNumber.trim() === "12345") {
      setTrainFound(true);
    } else {
      setTrainFound(false);
      alert("Demo train number: 12345");
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>🚆 Railway ETA AI</h1>
          <p>Smart Journey Intelligence</p>
        </div>

        <button className="voice-button">🎙 Voice</button>
      </header>

      <main className="main">
        {!showJourney ? (
          <>
            <p className="welcome">WELCOME ABOARD</p>

            <h2>Where is your train going?</h2>

            <p className="subtitle">
              Get dynamic ETA, live journey updates and smart railway
              assistance.
            </p>

            <section className="search-card">
              <h3>Search your train</h3>

              <div className="search-box">
                <input
                  type="text"
                  value={trainNumber}
                  onChange={(e) => setTrainNumber(e.target.value)}
                  placeholder="Enter train number or name"
                />

                <button onClick={findTrain}>Find My Train</button>
              </div>

              {trainFound && (
                <div className="train-card">
                  <h3>Train Found</h3>

                  <p>
                    <strong>Train:</strong> 12345
                  </p>

                  <p>
                    <strong>Route:</strong> New Jalpaiguri → Guwahati
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    <span className="running">Running</span>
                  </p>

                  <p>
                    <strong>Current Delay:</strong> 17 minutes
                  </p>

                  <p>
                    <strong>Expected ETA:</strong> 10:47 PM
                  </p>

                  <button
                    className="journey-button"
                    onClick={() => setShowJourney(true)}
                  >
                    View Live Journey →
                  </button>
                </div>
              )}
            </section>

            <section className="quick-access">
              <h3>Quick Access</h3>

              <div className="quick-grid">
                <div>🚆<strong>My Journey</strong><span>Track your train</span></div>
                <div>🛡️<strong>Safety</strong><span>Get assistance</span></div>
                <div>⚠️<strong>Alerts</strong><span>Track & wildlife alerts</span></div>
                <div>📍<strong>Destination</strong><span>Explore places</span></div>
              </div>
            </section>
          </>
        ) : (
          <section className="journey-page">
            <button
              className="back-button"
              onClick={() => setShowJourney(false)}
            >
              ← Back
            </button>

            <p className="welcome">LIVE JOURNEY</p>

            <h2>Train 12345</h2>

            <p className="subtitle">
              New Jalpaiguri → Guwahati
            </p>

            <div className="status-card">
              <span className="status-label">CURRENT STATUS</span>
              <h3>🟢 Running</h3>
              <p>Current delay: <strong>17 minutes</strong></p>
            </div>

            <div className="eta-card">
              <span className="status-label">DYNAMIC ETA</span>
              <div className="eta">{eta}</div>
              <p>Expected arrival at Guwahati</p>
            </div>

            <div className="next-station">
              <span className="status-label">NEXT STATION</span>
              <h3>🚉 New Bongaigaon</h3>
              <p>Train is currently approaching this station.</p>
            </div>

            <div className="delay-reason">
              <span className="status-label">DELAY INFORMATION</span>
              <h3>⚠️ Delay: 17 minutes</h3>
              <p>Verified reason currently unavailable.</p>
            </div>

            <div className="route">
              <h3>Journey Progress</h3>

              <div className="route-line">
                <div className="station completed">
                  <span>●</span>
                  <strong>New Jalpaiguri</strong>
                  <small>Completed</small>
                </div>

                <div className="station current">
                  <span>●</span>
                  <strong>Current Location</strong>
                  <small>Running • 17 min late</small>
                </div>

                <div className="station upcoming">
                  <span>●</span>
                  <strong>New Bongaigaon</strong>
                  <small>Upcoming</small>
                </div>

                <div className="station upcoming">
                  <span>●</span>
                  <strong>Guwahati</strong>
                  <small>ETA 10:47 PM</small>
                </div>
              </div>
            </div>

            <button className="safety-button">
              🛡️ Safety Assistance
            </button>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        <span>⌂ Home</span>
        <span>🚆 Journey</span>
        <span>🛡 Safety</span>
        <span>☰ More</span>
      </nav>
    </div>
  );
}

export default App;