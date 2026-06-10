// Geometry constants for the semi-circular gauge.
// The arc sweeps the top half of a circle: value 0 = left (180°), value 10 = right (0°).
const CX = 100 // center x
const CY = 100 // center y (pivot point for the needle)
const R = 80 // arc radius

// Convert an angle (in degrees, 180 = left → 0 = right) to an SVG point on the arc.
// SVG's y-axis grows downward, so we subtract the sine term.
function polarToXY(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: CX + R * Math.cos(rad),
    y: CY - R * Math.sin(rad),
  }
}

// Build an SVG path string for an arc segment between two angles.
function arcPath(startAngle, endAngle) {
  const start = polarToXY(startAngle)
  const end = polarToXY(endAngle)
  // large-arc-flag = 0 (each segment is 45°), sweep-flag = 1 (clockwise over the top).
  return `M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`
}

// The four colored segments, each spanning 45° of the 180° arc.
const SEGMENTS = [
  { from: 180, to: 135, color: '#22c55e' }, // 0.0–2.5  green
  { from: 135, to: 90, color: '#eab308' }, //  2.5–5.0  yellow
  { from: 90, to: 45, color: '#f97316' }, //   5.0–7.5  orange
  { from: 45, to: 0, color: '#ef4444' }, //    7.5–10   red
]

// Map a 0–10 value to a human-readable busyness label.
function labelFor(value) {
  if (value < 2.5) return 'Quiet'
  if (value < 5) return 'Normal'
  if (value < 7.5) return 'Busy'
  return 'Very Busy'
}

export default function BusyGauge({ value = 0 }) {
  // Clamp so the needle never overshoots the arc.
  const v = Math.max(0, Math.min(10, value))

  // Needle points straight up at value 5; rotate ±90° toward the ends.
  const needleRotation = (v / 10) * 180 - 90

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-64">
        {/* Colored background arcs */}
        {SEGMENTS.map((seg) => (
          <path
            key={seg.from}
            d={arcPath(seg.from, seg.to)}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeLinecap="butt"
          />
        ))}

        {/* Needle — rotates around the center pivot */}
        <g
          transform={`rotate(${needleRotation} ${CX} ${CY})`}
          style={{ transition: 'transform 300ms ease-out' }}
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - R + 6}
            stroke="#1e293b"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* Center hub */}
        <circle cx={CX} cy={CY} r="6" fill="#1e293b" />
      </svg>

      <div className="mt-2 text-3xl font-bold text-slate-800">{v} / 10</div>
      <div className="text-sm uppercase tracking-wide text-slate-500">
        {labelFor(v)}
      </div>
    </div>
  )
}
