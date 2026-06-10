// Mock nearby events, keyed by restaurant id.
// Each event: { name, capacity, distanceKm, recencyWeight }.
// This is a stand-in for a real events API (e.g. Eventbrite) — same shape,
// so swapping in live data later means changing only the data source.
export const mockEvents = {
  // Flagship demo location — busy strip next to a music venue.
  hj_hindley: [
    {
      name: 'Hindley St Music Hall',
      capacity: 1500,
      distanceKm: 0.1,
      recencyWeight: 1.0,
    },
    { name: 'The Gov live show', capacity: 800, distanceKm: 0.6, recencyWeight: 0.8 },
    { name: 'Adelaide Uni event', capacity: 400, distanceKm: 0.4, recencyWeight: 0.5 },
  ],

  // Other locations: fewer / smaller events, or none.
  mcd_hindley: [
    {
      name: 'Hindley St Music Hall',
      capacity: 1500,
      distanceKm: 0.3,
      recencyWeight: 1.0,
    },
    { name: 'Street festival', capacity: 600, distanceKm: 0.4, recencyWeight: 0.6 },
  ],

  kfc_hindley: [
    { name: 'Small bar gig', capacity: 200, distanceKm: 0.3, recencyWeight: 0.6 },
  ],

  subway_hindley: [],

  guzman_hindley: [
    { name: 'Rooftop party', capacity: 300, distanceKm: 0.5, recencyWeight: 0.7 },
  ],
}
