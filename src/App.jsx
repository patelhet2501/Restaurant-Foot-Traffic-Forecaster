function App() {
  // Dummy placeholder data — real scoring logic comes later.
  const busyScore = 6

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-slate-800">
          BusyMeter — Restaurant Foot Traffic Forecaster
        </h1>

        <div className="mt-6">
          <div className="text-5xl font-extrabold text-indigo-600">
            {busyScore}/10
          </div>
          <p className="mt-1 text-sm uppercase tracking-wide text-slate-400">
            Busy score
          </p>
        </div>

        <p className="mt-6 text-slate-600">
          This is a placeholder while the real logic is wired up.
        </p>
      </div>
    </div>
  )
}

export default App
