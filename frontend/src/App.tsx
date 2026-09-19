import { saveRecentSearch, type RecentSearch } from "./utils/recentSearches";
import { useEffect, useState } from "react";
function App() {
  const [trainNumber, setTrainNumber] = useState("");
  const [trainFound, setTrainFound] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [showTrainDetails, setShowTrainDetails] = useState(false);
  const [eta, setEta] = useState("10:47 PM");
  const [safetyRequested, setSafetyRequested] = useState(false);
  const [showDestination, setShowDestination] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [searchError, setSearchError] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  useEffect(() => {
  const saved = JSON.parse(
    localStorage.getItem("recentSearches") || "[]"
  );

  setRecentSearches(saved);
}, []);
  useEffect(() => {
  const interval = setInterval(() => {
    setEta((currentEta) => {
      const [time, period] = currentEta.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      minutes += 1;

      if (minutes === 60) {
        minutes = 0;
        hours += 1;
      }

      if (hours === 13) {
        hours = 1;
      }

      return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
    });
  }, 30000);

  return () => clearInterval(interval);
}, []);
  

  const findTrain = () => {
  const search = trainNumber.trim().toLowerCase();

  if (search === "") {
  setTrainFound(false);
  setSearchError(false);
  return;
}
  if (
    search === "12345" ||
    search === "guwahati express"
  ) {
    setTrainFound(true);
    setSearchError(false);

    saveRecentSearch({
      trainNumber: "12345",
      trainName: "Guwahati Express",
      source: "New Jalpaiguri",
      destination: "Guwahati",
    });
  } else {
    setTrainFound(false);
    setSearchError(true);
    
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
        {showSafety ? (
          <section className="journey-page">
                  <button className="back-button"
        onClick={() => setShowSafety(false)}
      >
        ← Back
      </button>

      <p className="welcome">SAFETY ASSISTANCE</p>

      <h2>Passenger Safety</h2>

      <p className="subtitle">
        Request railway assistance during your journey.
      </p>

      <div className="status-card">
        <span className="status-label">CURRENT JOURNEY</span>
        <h3>🚆 Train 12345</h3>
        <p>Next station: New Bongaigaon</p>
      </div>

      <div className="safety-section">
        <button
          className="safety-button"
          onClick={() => setSafetyRequested(true)}
        >
          🛡️ Request Assistance
        </button>

        {safetyRequested && (
          <div className="safety-request-card">
            <strong>🛡️ Assistance Request Sent</strong>
            <p>Status: REQUESTED</p>
            <p><strong>Station:</strong> New Bongaigaon</p>
            <p><strong>Coach:</strong> S5</p>
            <p><strong>Platform:</strong> 2</p>
            <small>Railway assistance team has been notified.</small>
          </div>
        )}
            </div>
    </section>

  ) : showDestination ? (
    <section className="journey-page">
      <button
  className="back-button"
  onClick={() => {
    setShowDestination(false);
    setShowMore(true);
  }}
>
  ← Back
</button>

    <p className="welcome">DESTINATION INTELLIGENCE</p>

    <h2>Explore Guwahati</h2>

    <p className="subtitle">
      Discover places, culture, history and useful travel information.
    </p>

    <div className="status-card">
      <span className="status-label">DESTINATION</span>
      <h3>📍 Guwahati</h3>
      <p>
        Gateway to Northeast India and a major city of Northeast India.
      </p>
    </div>

    <div className="quick-grid">
      <div>
        🏛️
        <strong>History & Culture</strong>
        <span>Explore local heritage</span>
      </div>

      <div>
        🌿
        <strong>Nearby Attractions</strong>
        <span>Discover places to visit</span>
      </div>

      <div>
        🍽️
        <strong>Local Experience</strong>
        <span>Food and culture</span>
      </div>

      <div>
        🧭
        <strong>Travel Information</strong>
        <span>Useful destination tips</span>
      </div>
    </div>
  </section>
  ) : showMore ? (
  <section className="journey-page">
    <button
      className="back-button"
      onClick={() => setShowMore(false)}
    >
      ← Back
    </button>

    <p className="welcome">MORE</p>

    <h2>More Options</h2>

    <p className="subtitle">
      Manage your Railway ETA AI experience.
    </p>

    <div className="quick-grid">
      <div
      className="destination-card more-options-card"
        onClick={() => {
          setShowMore(false);
          setShowDestination(true);
        }}
      >
        📍
        <strong>Destination</strong>
        <span>Explore places</span>
      </div>

        <div 
  className="destination-card more-options-card"
  onClick={() => { 
    alert("Language selection will be added soon."); 
  }} 
>
  🌐
  <strong>Language</strong>
  <span>Choose language</span>
</div>

      <div 
  className="destination-card more-options-card"
  onClick={() => { 
    alert("Accessibility features will be added soon."); 
  }} 
>

  ♿
  <strong>Accessibility</strong>
  <span>Easy access options</span>
</div>

      <div 
  className="destination-card more-options-card"
  onClick={() => { 
    alert("Settings features will be added soon."); 
  }} 
>
  ⚙️
  <strong>Settings</strong>
  <span>App preferences</span>
</div>
    </div>
  </section>
  ) : showTrainDetails ? (
  <section className="journey-page">
    <button
      className="back-button"
      onClick={() => setShowTrainDetails(false)}
    >
      ← Back
    </button>

    <p className="welcome">TRAIN DETAILS</p>

    <h2>🚆 Guwahati Express</h2>

    <p className="subtitle">
      Train 12345 • New Jalpaiguri → Guwahati
    </p>

    <div className="status-card">
      <span className="status-label">TRAIN INFORMATION</span>

      <p>
        <strong>Train Number:</strong> 12345
      </p>

      <p>
        <strong>Train Name:</strong> Guwahati Express
      </p>

      <p>
        <strong>Source:</strong> New Jalpaiguri
      </p>

      <p>
        <strong>Destination:</strong> Guwahati
      </p>

      <p>
        <strong>Status:</strong>{" "}
        <span className="running">Running</span>
      </p>
    </div>

    <div className="status-card">
      <span className="status-label">CURRENT JOURNEY STATUS</span>

      <p>
        <strong>Current Delay:</strong> 17 minutes
      </p>

      <p>
        <strong>Expected ETA:</strong> {eta}
      </p>

      <p>
        <strong>Next Station:</strong> New Bongaigaon
      </p>
    </div>

    <button
      className="journey-button"
      onClick={() => {
        setShowTrainDetails(false);
        setShowJourney(true);
      }}
    >
      View Live Journey →
    </button>
  </section> 
) : !showJourney ? (       <>
<section className="home-hero">
  <div className="hero-badge">🚆 SMART RAILWAY JOURNEY</div>

  <p className="welcome">WELCOME ABOARD</p>

  <h2>Where is your train going?</h2>

  <p className="subtitle">
    Get dynamic ETA, live journey updates and smart railway
    assistance — all in one place.
  </p>
</section>

            <section className="search-card">
              <h3>Search your train</h3>

              <div className="search-box">
                <input
                  type="text"
                  value={trainNumber}
                  onChange={(e) => {
  const value = e.target.value;

  setTrainNumber(value);
  setSearchActive(value.trim().length > 0);

  if (value.trim() === "") {
    setTrainFound(false);
    setSearchError(false);
  }
}}
                  placeholder="Enter train number or name"
                />

                <button onClick={findTrain}>Find My Train</button>
              </div>

              {trainFound && (
                <div className="train-card">
                <h3>🚆 Guwahati Express</h3>

<p>
  <strong>Train Number:</strong> 12345
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
  onClick={() => {
    setShowTrainDetails(true);
    setShowJourney(false);
    setShowDestination(false);
    setShowSafety(false);
    setShowMore(false);
  }}
>
  View Train Details →
</button>
                </div>
              )}
              {searchError && (
  <div className="search-error">
    <div className="search-error-icon">🔍</div>

    <h3>Train Not Found</h3>

    <p>
      We couldn't find a train matching your search.
    </p>

    <small>
      Try entering <strong>12345</strong> or{" "}
      <strong>Guwahati Express</strong>.
    </small>
  </div>
)}
            </section>

            <section className="recent-searches">
  <h3>Recent Searches</h3>

  {recentSearches.length === 0 ? (
    <p>No recent searches yet.</p>
  ) : (
    recentSearches.map((search) => (
      <div className="recent-search-card" key={search.trainNumber}>
        <div>
          <strong>
            🚆 {search.trainNumber} — {search.trainName}
          </strong>

          <span>
            {search.source} → {search.destination}
          </span>
        </div>

        <button
          onClick={() => {
            setShowJourney(true);
            setShowDestination(false);
            setShowSafety(false);
          }}
        >
          View Journey →
        </button>
      </div>
    ))
  )}
</section>
            <section className="quick-access">
              <h3>Quick Access</h3>

              <div className="quick-grid">
  <div>
    🔍
    <strong>Search Train</strong>
    <span>Find your train</span>
  </div>

  <div
    onClick={() => {
      setShowJourney(true);
      setShowDestination(false);
      setShowSafety(false);
    }}
  >
    🚆
    <strong>My Journey</strong>
    <span>Track journey</span>
  </div>

  <div
    onClick={() => {
      setShowJourney(false);
      setShowDestination(false);
      setShowSafety(true);
    }}
  >
    🛡️
    <strong>Safety</strong>
    <span>Get assistance</span>
  </div>

  <div
    className="destination-card"
    onClick={() => {
      setShowJourney(false);
      setShowDestination(true);
      setShowSafety(false);
    }}
  >
    📍
    <strong>Destination</strong>
    <span>Explore places</span>
  </div>
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

            <div className="safety-section">
              <button
                className="safety-button"
                onClick={() => setSafetyRequested(true)}
              >
                🛡️ Safety Assistance
              </button>
            {safetyRequested && (
              <div 
            className="safety-request-card">
                <strong>🛡️ Assistance Request Sent</strong>

                <p>Status: REQUESTED</p>

                <p>
                  <strong>Station:</strong> New Bongaigaon
                </p>

              <p>
                <strong>Coach:</strong> S5
              </p>

              <p>
                <strong>Platform:</strong> 2
              </p>

              <small>Railway assistance team has been notified.</small>
            </div>
          )}
            
        </div>
          </section>
        )}
      
      </main>

          <nav className="bottom-nav">
  <button
    onClick={() => {
      setShowJourney(false);
      setShowDestination(false);
      setShowSafety(false);
      setShowMore(false);
    }}
  >
    ⌂ Home
  </button>

  <button
    onClick={() => {
      setShowJourney(true);
      setShowDestination(false);
      setShowSafety(false);
      setShowMore(false);
    }}
  >
    🚆 Journey
  </button>

  <button
    onClick={() => {
      setShowJourney(false); 
      setShowDestination(false); 
      setShowSafety(true); 
      setShowMore(false);
    }}
  >
    🛡 Safety
  </button>

  <button
    onClick={() => {
      setShowJourney(false);
      setShowDestination(false);
      setShowSafety(false);
    setShowMore(true);
    }}
  >
    ⋯ More
  </button>
</nav>
    </div>
  );
}

export default App;