BusyMeter — Restaurant Foot Traffic Forecaster
A lightweight web app that predicts how busy a fast-food restaurant will be on a scale of 0–10, by aggregating nearby event data, time-of-day patterns, and live weather conditions.

Overview
Fast-food restaurant managers often have no way of knowing whether today will be a quiet Tuesday or a packed rush triggered by a concert down the street. BusyMeter solves this by pulling real-time data from public APIs — events happening nearby, current weather, and time-of-day baselines, and combining them into a single, easy-to-read busy score.

Built as a portfolio project by a cybersecurity and networking student at the University of Adelaide who also happened to be part-time employed at HungryJacks where I faced this exact problem, it is a solution for the same.

🎯 Problem Statement
When working in a CBD fast-food restaurant near Hindley Street, Adelaide, there was no reliable way to anticipate sudden surges in customer traffic caused by events at nearby venues (e.g., Hindley St Music Hall, Adelaide Entertainment Centre). This led to understaffing, stock shortages, and poor customer experience at the busy store. 

BusyMeter is a proof-of-concept tool to help managers make smarter pre-shift decisions — how many patties to pre-cook, how many staff to schedule, when to restock.

Features
- Location-aware event detection — fetches events within a configurable radius using the Eventbrite API
- Weather integration — pulls real-time Adelaide weather via OpenWeatherMap (rain reduces foot traffic, heat increases it)
- Time-of-day baseline — factors in historical busy periods (lunch rush, post-work, late-night)
- Busy score gauge — outputs a visual 0–10 score with a colour-coded meter
- OAuth 2.0 authentication — secure Eventbrite API access using the authorisation code flow
- Responsive UI — works on desktop and mobile
- Algorithm — How the Score Is Calculated

The busy score is a weighted combination of three signals:

Signal	Weight	Source
Nearby events (count × proximity × capacity)	50%	Eventbrite API
Weather impact modifier	20%	OpenWeatherMap API
Time-of-day baseline	30%	Static historical model
Event Score
Each event within the radius is scored as:
event_score = (capacity / max_capacity) × (1 / distance_km) × recency_weight
Multiple events are summed and normalised to a 0–10 scale.

Weather Modifier
Clear / sunny → +1.0 multiplier
Overcast → +0.9
Light rain → +0.7
Heavy rain / storm → +0.5

Time-of-Day Baseline
A static lookup table based on typical fast-food foot traffic patterns (peaks at 12–1 PM, 5–7 PM, and 10 PM–midnight).

Final Score
final_score = clamp((event_score × 0.5) + (time_baseline × 0.3) + (weather_modifier × 0.2), 0, 10)
Accuracy Disclaimer: This tool is a heuristic estimator, not a predictive ML model. It does not use historical POS data. Treat it as a rough directional guide, not a precise forecast.

Tech Stack
- Layer	Technology
- Frontend	React + Vite
- Styling	Tailwind CSS
- API Integration	Eventbrite API v3, OpenWeatherMap API
- Authentication	OAuth 2.0 (Authorisation Code Flow)

Security Considerations
Security was a deliberate focus of this project given the developer's cybersecurity background.

Threat Model Summary
Threat	Mitigation
API key exposure	Keys stored in .env, excluded from version control via .gitignore. .env.example ships with placeholders only.
OAuth token interception	Short-lived access tokens used. State parameter validated on callback to prevent CSRF attacks.
Cross-Site Scripting (XSS)	All user-controlled inputs sanitised before rendering. React's default JSX escaping applied throughout.
Insecure API calls	All API calls made over HTTPS. No sensitive data passed as URL query parameters.
Over-permissioned OAuth scope	Eventbrite OAuth scope limited to event:read only — no write permissions requested.
Sensitive data in logs	API tokens and user location data are never logged to the console or error reports.
Australian Privacy Act Compliance
This application does not store, transmit, or retain any personally identifiable information (PII). User location is used in-session only and is never persisted. This is consistent with the Australian Privacy Principles (APPs) under the Privacy Act 1988 and relevant to obligations under the Security of Critical Infrastructure Act 2018 for future production deployments.

Known Limitations
No Ticketek integration — Ticketek's API is a closed B2B system with no public developer access. Major events on Ticketek are not captured.

No ML model — the score is heuristic-based, not trained on historical foot traffic data. A production version would benefit from POS system integration.

Google Popular Times not used — Google does not provide an official API for this data.

Weather impact is approximate — the modifier is manually tuned, not regression-derived.

Future Improvements
 Add Eventfinda API as a second event source for broader Australian event coverage

 Integrate historical score data using a lightweight backend (e.g., Supabase) to improve baseline accuracy over time

 Add push notifications for score changes above a threshold

 Build a native iOS/Android version with React Native

 Add a manager dashboard with weekly score history charts

Author
Het Patel
Bachelor of IT (Cybersecurity & Networking) — Adelaide University
