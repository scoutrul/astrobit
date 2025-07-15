import './index.css'
import Chart from './components/chart/chartSimple'
import TimeframeSelector from './components/ui/TimeframeSelector.tsx'
import { useStore } from './store'

function App() {
  const { symbol, timeframe } = useStore()

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header - Fixed height with responsive padding */}
      <header className="h-16 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="container-responsive h-full flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#f7931a] to-[#ffa726] bg-clip-text text-transparent">
              AstroBit
            </h1>
            <div className="hidden md:flex items-center space-x-2 text-sm text-[var(--text-muted)]">
              <span>•</span>
              <span>Cryptocurrency + Astronomical Analytics</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse"></div>
              <span className="text-xs text-[var(--text-muted)]">Live Data</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {/* Chart - Full width, no side padding */}
        <div className="w-full">
          <Chart height={600} className="w-full" />
        </div>
        
        {/* Controls Section - Below chart with responsive padding */}
        <div className="container-responsive py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timeframe Selection */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Timeframe</h2>
              <TimeframeSelector />
            </div>

            {/* Market Info */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Market Info</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Symbol:</span>
                  <span className="text-[var(--accent-primary)] font-medium">{symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Timeframe:</span>
                  <span className="text-[var(--accent-secondary)] font-medium">{timeframe}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Last Update:</span>
                  <span className="text-[var(--text-secondary)]">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Astronomical Events Section - Coming soon */}
          <div className="mt-6 bg-[var(--bg-secondary)] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Astronomical Events</h2>
            <div className="text-center py-8 text-[var(--text-muted)]">
              <div className="text-4xl mb-4">🌙</div>
              <p className="text-lg mb-2">Astronomical overlay coming soon</p>
              <p className="text-sm">Moon phases, planetary events, and solar cycles will be integrated with the price chart</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="container-responsive py-6">
          <div className="text-center text-sm text-[var(--text-muted)]">
            <p>&copy; 2024 AstroBit. Исследовательская платформа для анализа корреляций криптовалют и астрономических событий.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App 