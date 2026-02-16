# AI Lab Report Red Flag Analyzer (MVP)

This repository contains a minimal full-stack MVP for CBC (Complete Blood Count) report interpretation assistance.

## What it does

- Upload a CBC PDF report
- Extract text and parse 8 core CBC markers
- Compare extracted values with hardcoded reference ranges
- Flag low/high/normal values
- Generate urgency + doctor-prep summary
- Always include a non-diagnostic safety disclaimer

> ⚠️ This tool provides interpretation assistance only. It is not a medical diagnosis and does not replace professional medical advice.

## Project structure

- `backend/` Node.js + Express API (`POST /api/analyze`)
- `frontend/` Simple Tailwind-powered UI (`index.html` + `main.js`)

## API response shape

```json
{
  "disclaimer": "...",
  "values": { "Hemoglobin": 13.2, "WBC": 8900, "...": 0 },
  "flags": [
    {
      "marker": "WBC",
      "value": 12000,
      "status": "high",
      "range": { "min": 4000, "max": 11000 },
      "unit": "cells/µL"
    }
  ],
  "urgency": "Moderate",
  "explanation": "...",
  "redFlagsToWatch": "...",
  "doctorSummary": "..."
}
```

## Local run

### Backend

```bash
cd backend
npm install
npm run dev
```

Create `.env` in `backend/` (optional but recommended for LLM extraction/reasoning):

```bash
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
PORT=4000
```

If no API key is set, the backend uses regex extraction + deterministic fallback summaries.

### Frontend

Serve `frontend/` as static files (example):

```bash
cd frontend
python3 -m http.server 4173
```

Then open `http://localhost:4173`.
