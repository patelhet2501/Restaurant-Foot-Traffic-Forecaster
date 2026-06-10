import { useState } from 'react'
import BusyGauge from './components/BusyGauge.jsx'
import {
  computeBusyScore,
  estimateEventScore,
  weatherModifierFromConditions,
  timeBaselineFromLocalTime,
} from './scoring/busyScore.js'

// Mock nearby events — stands in for a real events API later.
const NEARBY_EVENTS = [
  { name: 'Stadium concert', capacity: 18000, distanceKm: 1.2, recencyWeight: 1.0 },
  { name: 'Basketball game', capacity: 8000, distanceKm: 0.6, recencyWeight: 0.8 },
  { name: 'Theatre show', capacity: 1200, distanceKm: 2.5, recencyWeight: 0.5 },
]

const WEATHER_OPTIONS = [
  { value: 'clear', label: 'Clear' },
  { value: 'overcast', label: 'Overcast' },
  { value: 'light_rain', label: 'Light rain' },
  { value: 'heavy_rain', label: 'Heavy rain' },
]

function App() {
  const [weather, setWeather] = useState('clear')
  const [hour, setHour] = useState(12)
  const [useManual, setUseManual] = useState(false)
  const [manualValue, setManualValue] = useState(6)

  // --- Derive the score from the mock inputs (all pure functions) ---
  const eventScore = estimateEventScore({ nearbyEvents: NEARBY_EVENTS })
  const weatherModifier = weatherModifierFromConditions(weather)
  const timeBaseline = timeBaselineFromLocalTime(new Date(2026, 0, 1, hour))
  const computedScore = computeBusyScore({ eventScore, weatherModifier, timeBaseline })

  // Manual override bypasses the computed score for debugging/demoing.
  const score = useManual ? manualValue : Number(computedScore.toFixed(1))

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-slate-800">
          BusyMeter — Restaurant Foot Traffic Forecaster
        </h1>

        <div className="mt-8">
          <BusyGauge value={score} />
        </div>

        {/* --- Mock inputs --- */}
        <div className="mt-8 space-y-4 text-left">
          <label className="block">
            <span className="text-sm font-medium text-slate-600">Weather</span>
            <select
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              disabled={useManual}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 disabled:opacity-50"
            >
              {WEATHER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-600">
              Time of day: {String(hour).padStart(2, '0')}:00
            </span>
            <input
              type="range"
              min="0"
              max="23"
              step="1"
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              disabled={useManual}
              className="mt-1 w-full accent-indigo-600 disabled:opacity-50"
            />
          </label>
        </div>

        {/* --- Score breakdown (helps explain the algorithm) --- */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-xs text-slate-500">
          <div>
            Events
            <div className="text-sm font-semibold text-slate-700">
              {eventScore.toFixed(1)}
            </div>
          </div>
          <div>
            Time
            <div className="text-sm font-semibold text-slate-700">
              {timeBaseline.toFixed(1)}
            </div>
          </div>
          <div>
            Weather
            <div className="text-sm font-semibold text-slate-700">
              ×{weatherModifier.toFixed(1)}
            </div>
          </div>
        </div>

        {/* --- Manual debug override --- */}
        <div className="mt-6 border-t border-slate-200 pt-4">
          <label className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={useManual}
              onChange={(e) => setUseManual(e.target.checked)}
              className="accent-indigo-600"
            />
            Use manual score (debug override)
          </label>

          {useManual && (
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={manualValue}
              onChange={(e) => setManualValue(Number(e.target.value))}
              className="mt-3 w-full accent-indigo-600"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
