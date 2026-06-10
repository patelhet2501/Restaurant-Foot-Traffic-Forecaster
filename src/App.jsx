import { useState } from 'react'
import BusyGauge from './components/BusyGauge.jsx'

function App() {
  const [value, setValue] = useState(6)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-slate-800">
          BusyMeter — Restaurant Foot Traffic Forecaster
        </h1>

        <div className="mt-8">
          <BusyGauge value={value} />
        </div>

        {/* Optional: live slider to preview the needle moving */}
        <div className="mt-8">
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <p className="mt-2 text-xs text-slate-400">
            Drag to preview the busy score
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
