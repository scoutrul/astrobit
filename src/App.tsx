import './index.css'
import Chart from './components/chart/chartTest'
import SymbolSelector from './components/ui/SymbolSelector.tsx'
import TimeframeSelector from './components/ui/TimeframeSelector.tsx'
import { useStore } from './store'

function App() {
  const { symbol, timeframe } = useStore()

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-[#c9ccd3]">
      {/* Header */}
      <header className="bg-[#1a1d29] border-b border-[#262a36]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#f7931a] to-[#ffa726] bg-clip-text text-transparent">
                AstroBit
              </h1>
              <div className="hidden md:flex items-center space-x-2 text-sm text-[#8b8f9b]">
                <span>•</span>
                <span>Cryptocurrency + Astronomy Analytics</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-[#8b8f9b]">Live Data</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Symbol Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-[#c9ccd3]">Asset Selection</h2>
              <SymbolSelector />
            </div>

            {/* Timeframe Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-[#c9ccd3]">Chart Settings</h2>
              <TimeframeSelector />
            </div>

            {/* Phase 2 Status */}
            <div className="bg-[#1a1d29] rounded-lg p-4">
              <h3 className="text-sm font-medium text-[#c9ccd3] mb-3">Phase 2 Status</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8b8f9b]">Enhanced Chart</span>
                  <span className="text-green-400">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8b8f9b]">Custom Hooks</span>
                  <span className="text-green-400">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8b8f9b]">Symbol Selection</span>
                  <span className="text-green-400">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8b8f9b]">Timeframe Control</span>
                  <span className="text-green-400">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8b8f9b]">Astro Data</span>
                  <span className="text-yellow-400">⏳</span>
                </div>
              </div>
            </div>

            {/* Astronomical Info Preview */}
            <div className="bg-[#1a1d29] rounded-lg p-4">
              <h3 className="text-sm font-medium text-[#c9ccd3] mb-3">Astronomical Preview</h3>
              <div className="space-y-2 text-xs text-[#8b8f9b]">
                <p>🌙 Next New Moon: Jan 11, 2024</p>
                <p>🌕 Next Full Moon: Jan 25, 2024</p>
                <p>⚡ Mercury Retrograde: Jan 1-20</p>
                <p className="text-[#f7931a] mt-2">Timeline Track: Coming in Phase 4</p>
              </div>
            </div>
          </div>

          {/* Main Chart Area */}
          <div className="lg:col-span-3">
            <div className="bg-[#1a1d29] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#c9ccd3]">Market Analysis</h2>
                  <p className="text-sm text-[#8b8f9b] mt-1">
                    Real-time {symbol} price data with astronomical correlation analysis
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="bg-[#0a0b1e] px-3 py-1 rounded">
                    <span className="text-[#8b8f9b]">Timeframe: </span>
                    <span className="text-[#f7931a]">{timeframe}</span>
                  </div>
                </div>
              </div>

              {/* Chart Component with Props */}
              <Chart />

              {/* Chart Footer */}
              <div className="mt-4 pt-4 border-t border-[#262a36]">
                <div className="flex items-center justify-between text-xs text-[#8b8f9b]">
                  <div className="flex items-center space-x-4">
                    <span>Powered by Bybit API</span>
                    <span>•</span>
                    <span>Astronomical data from Astronomia</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="mt-6 bg-[#1a1d29] rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#f7931a] rounded-full"></div>
                <span className="text-[#8b8f9b]">Phase 2 Core Implementation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-[#8b8f9b]">Real-time Data Integration</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-[#8b8f9b]">Custom Hooks Architecture</span>
              </div>
            </div>
            <div className="text-[#8b8f9b]">
              Next: Phase 3 UI Components (Timeline Track)
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App 