# EcoNexus LangGraph Agent Sidecar (MVP)

This service implements the LangGraph-first agent runtime requested for MVP, while deferring material-passport redesign.

## What This Service Does
- Runs a LangGraph flow:
  - `ingest_context`
  - `nearest_centroid_match`
  - `market_synthesis`
  - `pause_gate`
  - `finalize_output` (on resume)
- Exposes FastAPI endpoints:
  - `POST /runs/start`
  - `POST /runs/{run_id}/resume`
  - `GET /runs/{run_id}`
- Writes final output to `agent_feed` as both:
  - `offer`
  - `request`
- Keeps intermediate reasoning in API console logs only.
- Uses Groq LLM synthesis (when `GROQ_API_KEY` is present) with strict JSON schema and deterministic fallback on any LLM failure.

## What Is Deferred
- Material passport and input-model redesign from PRD/documents.
- Processor-specific detailed business logic (currently a typed stub adapter).
- Dashboard changes for intermediate graph traces.

## Setup
1. Install dependencies:
```bash
python -m pip install -r requirements.txt
```
2. Create env file from `.env.example` and set values.
   - For Groq LLM mode, set `GROQ_API_KEY` (optional). Without it, service runs deterministic-only synthesis.
3. Run:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Test
```bash
python -m pytest -q
```
