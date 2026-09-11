import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="logo-section">
          <div className="logo-icon">🚆</div>
          <div>
            <h1>Railway ETA AI</h1>
            <p>Smart Journey Intelligence</p>
          </div>
        </div>

        <button className="voice-button">
          🎙️
          <span>Voice</span>
        </button>
      </header>

      <main className="main">
        <section className="welcome">
          <p className="small-text">WELCOME ABOARD</p>
          <h2>Where is your train going?</h2>
          <p className="description">
            Get dynamic ETA, live journey updates and smart railway assistance.
          </p>
        </section>

        <section className="search-card">
          <label htmlFor="train-search">Search your train</label>

          <div className="search-box">
            <span>🔍</span>
            <input
              id="train-search"
              type="text"
              placeholder="Enter train number or name"
            />
          </div>

          <button className="search-button">
            Find My Train
          </button>
        </section>

        <section className="quick-actions">
          <div className="section-title">
            <h3>Quick Access</h3>
          </div>

          <div className="action-grid">
            <button className="action-card">
              <span className="action-icon">🧭</span>
              <strong>My Journey</strong>
              <small>Track your train</small>
            </button>

            <button className="action-card">
              <span className="action-icon">🛡️</span>
              <strong>Safety Assistance</strong>
              <small>Request help</small>
            </button>

            <button className="action-card">
              <span className="action-icon">⚠️</span>
              <strong>Track Alerts</strong>
              <small>View hazards</small>
            </button>

            <button className="action-card">
              <span className="action-icon">📍</span>
              <strong>Destination</strong>
              <small>Explore your stop</small>
            </button>
          </div>
        </section>

        <section className="journey-card">
          <div className="journey-header">
            <div>
              <p>RECENT JOURNEY</p>
              <h3>No active journey</h3>
            </div>

            <span className="status-badge">Ready</span>
          </div>

          <div className="journey-route">
            <div>
              <strong>Source</strong>
              <span>—</span>
            </div>

            <div className="route-line">━━━━━━●━━━━━━</div>

            <div>
              <strong>Destination</strong>
              <span>—</span>
            </div>
          </div>
        </section>
      </main>

      <nav className="bottom-nav">
        <button className="nav-item active">
          <span>⌂</span>
          <small>Home</small>
        </button>

        <button className="nav-item">
          <span>🧭</span>
          <small>Journey</small>
        </button>

        <button className="nav-item">
          <span>🛡️</span>
          <small>Safety</small>
        </button>

        <button className="nav-item">
          <span>☰</span>
          <small>More</small>
        </button>
      </nav>
    </div>
  )
}

export default App