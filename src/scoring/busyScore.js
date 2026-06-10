// Pure, side-effect-free scoring logic for the BusyMeter.
// Every function here is deterministic given its inputs, so it's trivial to unit-test.

/** Clamp a number into the inclusive [min, max] range. */
export function clamp(n, min = 0, max = 10) {
  return Math.max(min, Math.min(max, n))
}

/**
 * Combine the signals into a single 0–10 busy score.
 *
 * Events and time-of-day form the *baseline* demand (both on a 0–10 scale),
 * and weather acts as a *multiplier* on top:
 *
 *   baseline = (eventScore * 0.6) + (timeBaseline * 0.4)   // 0–10
 *   final    = baseline * weatherModifier                  // weather scales it
 *
 * Because weatherModifier ranges 0.5–1.0, heavy rain can roughly halve the
 * predicted busyness, while clear weather leaves the baseline untouched.
 * Result is clamped to 0–10.
 */
export function computeBusyScore({
  eventScore = 0,
  weatherModifier = 1,
  timeBaseline = 0,
} = {}) {
  const baseline = eventScore * 0.6 + timeBaseline * 0.4
  const final = baseline * weatherModifier
  return clamp(final, 0, 10)
}

/**
 * Heuristic event pressure from nearby events.
 *
 * Each event contributes more when it's large (relative to the biggest event),
 * close by, and recent:
 *
 *   contribution = (capacity / maxCapacity) * (1 / distanceKm) * recencyWeight
 *
 * The summed raw value is scaled and clamped into 0–10. The scale factor is a
 * tunable heuristic for now — real calibration comes later.
 *
 * @param {{ nearbyEvents?: Array<{capacity:number, distanceKm:number, recencyWeight:number}> }} input
 */
export function estimateEventScore({ nearbyEvents = [] } = {}) {
  if (nearbyEvents.length === 0) return 0

  const maxCapacity = Math.max(...nearbyEvents.map((e) => e.capacity), 1)

  const raw = nearbyEvents.reduce((sum, e) => {
    const distance = Math.max(e.distanceKm, 0.1) // avoid divide-by-zero blow-ups
    const capacityRatio = e.capacity / maxCapacity
    return sum + capacityRatio * (1 / distance) * e.recencyWeight
  }, 0)

  const SCALE = 3 // tunable: maps a "typical" busy cluster toward the top of the range
  return clamp(raw * SCALE, 0, 10)
}

/**
 * Map a simple weather condition to a 0.5–1.0 modifier.
 * Accepts "clear", "overcast", "light_rain", "heavy_rain"
 * (spaces are tolerated, e.g. "light rain"). Unknown → 1.0.
 */
export function weatherModifierFromConditions(codeOrDescription) {
  const key = String(codeOrDescription).toLowerCase().replace(/\s+/g, '_')
  const map = {
    clear: 1.0,
    overcast: 0.9,
    light_rain: 0.7,
    heavy_rain: 0.5,
  }
  return map[key] ?? 1.0
}

/**
 * Smooth bump that peaks at 1.0 when `hour` equals `center`, accounting for the
 * 24-hour wrap-around — so a peak centred on midnight still covers 23:00 and
 * 01:00 rather than treating them as ~23 hours apart.
 */
function circularBump(hour, center, spread) {
  let distance = Math.abs(hour - center)
  distance = Math.min(distance, 24 - distance) // shortest way around the clock
  return Math.exp(-(distance * distance) / (2 * spread * spread))
}

/**
 * Baseline foot traffic from the hour of day, on a 0–10 scale.
 *
 * Weekdays (Mon–Thu): office-driven — a lunch peak (~13:00) and an
 * after-work/dinner peak (~18:00), quiet overnight.
 *
 * Weekends (Fri/Sat/Sun): the same daytime peaks plus a strong late-night
 * club peak centred on midnight (covering roughly 22:00–02:00).
 *
 * Weekday vs weekend is read from the date's day-of-week, so a caller chooses
 * the pattern simply by passing a date that falls on the day they want to model.
 */
export function timeBaselineFromLocalTime(date = new Date()) {
  const hour = date.getHours() + date.getMinutes() / 60
  const day = date.getDay() // 0 = Sun … 5 = Fri, 6 = Sat
  const isWeekend = day === 5 || day === 6 || day === 0

  const lunch = circularBump(hour, 13, 1.5) // midday office lunch
  const dinner = circularBump(hour, 18, 1.5) // after-work / dinner
  const club = isWeekend ? circularBump(hour, 0, 2) : 0 // weekend late-night

  const baseline = Math.max(lunch, dinner, club) * 10
  return clamp(baseline, 0, 10)
}
