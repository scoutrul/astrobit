import './index.css'
import Chart from './components/chart/index.tsx'

function App() {
  return (
    <div className="min-h-screen bg-background text-text">
      <header className="p-4">
        <h1 className="text-2xl font-bold">AstroBit</h1>
      </header>
      <main className="p-4">
        <Chart />
      </main>
    </div>
  )
}

export default App 