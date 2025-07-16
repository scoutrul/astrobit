import './index.css'
import Chart from './components/chart/chartSimple'
import TimeframeSelector from './components/ui/TimeframeSelector.tsx'
import SymbolSelector from './components/ui/SymbolSelector.tsx'

function App() {
  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col">
      {/* Header - Fixed height with responsive padding */}
      <header className="h-16 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="container-responsive h-full flex items-center justify-between">
          <div className="flex items-center gap-4" style={{ gap: '1rem' }}>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              AstroBit
            </h1>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400" style={{ gap: '0.5rem' }}>
              <span>•</span>
              <span>Cryptocurrency + Astronomical Analytics</span>
            </div>
          </div>
          <div className="flex items-center gap-4" style={{ gap: '1rem' }}>
            <div className="flex items-center gap-2" style={{ gap: '0.5rem' }}>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">Live Data</span>
            </div>
          </div>
        </div>
      </header>

      {/* Compact Controls Panel - Above chart */}
      <div className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="container-responsive py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6" style={{ gap: '1.5rem' }}>
              <div className="flex items-center gap-2" style={{ gap: '0.5rem' }}>
                <SymbolSelector />
              </div>
              <div className="flex items-center gap-2" style={{ gap: '0.5rem' }}>
                <TimeframeSelector />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart - Full height of remaining space */}
      <div className="flex-1 w-full overflow-hidden">
        <Chart className="w-full h-full" />
      </div>
    </div>
  )
}

export default App 