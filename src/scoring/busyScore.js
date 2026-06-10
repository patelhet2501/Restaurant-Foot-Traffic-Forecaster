// Pure, side-effect-free scoring logic for the BusyMeter.
// Every function here is deterministic given its inputs, so it's trivial to unit-test.

/** Clamp a number into the inclusive [min, max] range. */
export function clamp(n, min = 0, max = 10) {
  return Math.max(min, Math.min(max, n))
}

/**
 * Combine the three signals into a single 0–10 busy score.
 *
 *   final = (eventScore * 0.5) + (timeBaseline * 0.3) + (weatherModifier * 0.2)
 *
 * Note: eventScore and timeBaseline are on a 0–10 scale, while weatherModifier
 * is a small 0.5–1.0 multiplier-style value, so weather nudges rather than
 * dominates the result. Result is clamped to 0–10.
 */
export function computeBusyScore({
  eventScore = 0,
  weatherModifier = 1,
  timeBaseline = 0,
} = {}) {
  const final = eventScore * 0.5 + timeBaseline * 0.3 + weatherModifier * 0.2
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

/** Smooth bump that peaks at 1.0 when x === center, falling off by `spread`. */
function gaussianBump(x, center, spread) {
  return Math.exp(-((x - center) ** 2) / (2 * spread ** 2))
}

/**
 * Baseline foot traffic from the hour of day, on a 0–10 scale.
 * Peaks around lunch (~12:30) and dinner/late-evening (~20:00),
 * and bottoms out in the small hours (e.g. 3am).
 */
export function timeBaselineFromLocalTime(date = new Date()) {
  const hour = date.getHours() + date.getMinutes() / 60
  const lunch = gaussianBump(hour, 12.5, 1.5)
  const evening = gaussianBump(hour, 20, 2)
  const baseline = Math.max(lunch, evening) * 10
  return clamp(baseline, 0, 10)
}
