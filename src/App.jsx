import { useEffect, useState } from 'react'
import BusyGauge from './components/BusyGauge.jsx'
import { RESTAURANTS } from './data/restaurants.js'
import { mockEvents } from './data/mockEvents.js'
import {
  computeBusyScore,
  estimateEventScore,
  weatherModifierFromConditions,
  timeBaselineFromLocalTime,
} from './scoring/busyScore.js'

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

// Map an OpenWeather "main" condition (+ weather id) onto one of our modifier
// keys: clear / overcast / light_rain / heavy_rain.
// Rain ids: 500–501 = light/moderate, 502+ = heavy (per OpenWeather docs).
function deriveWeatherKey(main, id) {
  const m = (main || '').toLowerCase()
  if (m === 'clear') return 'clear'
  if (m === 'clouds') return 'overcast'
  if (m === 'drizzle') return 'light_rain'
  if (m === 'thunderstorm') return 'heavy_rain'
  if (m === 'rain') return id >= 502 ? 'heavy_rain' : 'light_rain'
  if (m) return 'overcast' // snow / mist / fog / etc.
  return 'clear'
}

// Human-readable phrasing for the "Why this score?" weather line.
const WEATHER_PHRASE = {
  clear: 'clear skies',
  overcast: 'overcast',
  light_rain: 'light rain',
  heavy_rain: 'heavy rain',
}

// Pick the most impactful event (large + close) to name in the explanation.
function topEvent(events) {
  return events.reduce((best, e) => {
    const impact = e.capacity / Math.max(e.distanceKm, 0.1)
    const bestImpact = best ? best.capacity / Math.max(best.distanceKm, 0.1) : -1
    return impact > bestImpact ? e : best
  }, null)
}

// Build the bullet list explaining what's driving the score. Pure function.
function buildExplanations({
  events,
  eventScore,
  timeBaseline,
  weatherModifier,
  weatherKey,
  mode,
  hour,
}) {
  const out = []

  // Events
  if (eventScore > 1.5 && events.length > 0) {
    const top = topEvent(events)
    out.push(`Nearby events at ${top.name} are increasing the score.`)
  }

  // Time of day
  const isMidday = hour >= 11 && hour <= 15
  const isLateNight = hour >= 22 || hour <= 2
  if (timeBaseline > 5) {
    if (mode === 'weekday' && isMidday) {
      out.push('Weekday lunch period is increasing the score.')
    } else if (mode === 'weekend' && isLateNight) {
      out.push('Weekend late-night pattern is increasing the score.')
    } else {
      out.push('This is a busy time of day for foot traffic.')
    }
  }

  // Weather (only when it's a meaningful drag on the score)
  if (weatherModifier < 0.95 && weatherKey) {
    out.push(`Weather is reducing the score (${WEATHER_PHRASE[weatherKey] ?? weatherKey}).`)
  }

  if (out.length === 0) {
    out.push('No strong drivers right now — a relatively quiet period.')
  }
  return out
}

function App() {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(RESTAURANTS[0].id)
  const [hour, setHour] = useState(12)
  const [mode, setMode] = useState('weekday') // 'weekday' | 'weekend'
  const [useManual, setUseManual] = useState(false)
  const [manualValue, setManualValue] = useState(6)

  // Live weather for the selected restaurant.
  const [weather, setWeather] = useState({ status: 'idle', condition: null, key: null })

  const selectedRestaurant =
    RESTAURANTS.find((r) => r.id === selectedRestaurantId) ?? RESTAURANTS[0]

  // Fetch weather whenever the selected restaurant changes.
  useEffect(() => {
    if (!API_KEY) {
      setWeather({ status: 'error', condition: null, key: null })
      return
    }

    let cancelled = false
    setWeather({ status: 'loading', condition: null, key: null })

    const { lat, lon } = selectedRestaurant
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Weather API ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        const w = data.weather?.[0] ?? {}
        setWeather({
          status: 'ready',
          condition: w.main ?? 'Unknown',
          key: deriveWeatherKey(w.main, w.id),
        })
      })
      .catch(() => {
        if (!cancelled) setWeather({ status: 'error', condition: null, key: null })
      })

    return () => {
      cancelled = true
    }
  }, [selectedRestaurant])

  // --- Derive the score from inputs (all pure functions) ---
  const events = mockEvents[selectedRestaurant.id] || []
  const eventScore = estimateEventScore({ nearbyEvents: events })

  // weather.key is null while loading/erroring → modifier falls back to 1.0.
  const weatherModifier = weatherModifierFromConditions(weather.key)

  // Encode the weekday/weekend choice into the date: Jan 7 2026 = Wed (weekday),
  // Jan 10 2026 = Sat (weekend). timeBaselineFromLocalTime reads its day-of-week.
  const date = new Date(2026, 0, mode === 'weekend' ? 10 : 7, hour)
  const timeBaseline = timeBaselineFromLocalTime(date)

  const computedScore = computeBusyScore({ eventScore, weatherModifier, timeBaseline })
  const score = useManual ? manualValue : Number(computedScore.toFixed(1))

  const explanations = buildExplanations({
    events,
    eventScore,
    timeBaseline,
    weatherModifier,
    weatherKey: weather.key,
    mode,
    hour,
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-slate-800">
          BusyMeter — Restaurant Foot Traffic Forecaster
        </h1>

        {/* Restaurant selector */}
        <label className="mt-6 block text-left">
          <span className="text-sm font-medium text-slate-600">Restaurant</span>
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 p-2"
          >
            {RESTAURANTS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        {/* Selected restaurant + live weather */}
        <div className="mt-4">
          <p className="font-semibold text-slate-800">{selectedRestaurant.name}</p>
          <p className="text-sm text-slate-500">{selectedRestaurant.address}</p>
          <p className="mt-2 text-sm">
            {weather.status === 'loading' && (
              <span className="text-slate-400">Loading weather…</span>
            )}
            {weather.status === 'error' && (
              <span className="text-amber-600">
                Weather unavailable — using neutral conditions
              </span>
            )}
            {weather.status === 'ready' && (
              <span className="text-slate-500">
                Current weather:{' '}
                <span className="font-medium text-slate-700">{weather.condition}</span>
              </span>
            )}
          </p>
        </div>

        <div className="mt-6">
          <BusyGauge value={score} />
        </div>

        {/* --- Time controls --- */}
        <div className="mt-8 space-y-4 text-left">
          <div>
            <span className="text-sm font-medium text-slate-600">Day type</span>
            <div className="mt-1 flex gap-2">
              {['weekday', 'weekend'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  disabled={useManual}
                  className={`flex-1 rounded-lg border p-2 text-sm capitalize disabled:opacity-50 ${
                    mode === m
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

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

          <p className="text-xs text-slate-500">
            Using {events.length} nearby event{events.length === 1 ? '' : 's'} for this
            location
          </p>
        </div>

        {/* --- Score breakdown --- */}
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

        {/* --- Why this score? --- */}
        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-left">
          <p className="text-sm font-semibold text-slate-700">Why this score?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {explanations.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
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
