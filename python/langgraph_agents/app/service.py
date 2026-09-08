from __future__ import annotations

from dataclasses import asdict
from typing import Any
from uuid import uuid4

from .graph import AgentGraph
from .models import RunRecord, utc_now_iso
from .repository import AgentRepository


class AgentRunService:
    def __init__(self, graph: AgentGraph, repository: AgentRepository) -> None:
        self.graph = graph
        self.repository = repository
        self._runs: dict[str, RunRecord] = {}

    def start_run(self, *, company_id: str, locality: str | None = None) -> RunRecord:
        run_id = str(uuid4())
        agent = self.repository.get_active_agent_for_company(company_id)
        run_locality = locality or agent.locality

        initial_state = {
            "run_id": run_id,
            "company_id": company_id,
            "agent_id": agent.id,
            "locality": run_locality,
            "status": "running",
        }
        paused_state = self.graph.run_until_pause(initial_state)

        record = RunRecord(
            run_id=run_id,
            company_id=company_id,
            locality=run_locality,
            status="paused",
            state=dict(paused_state),
        )
        self._runs[run_id] = record
        return record

    def resume_run(self, run_id: str, payload: dict[str, Any] | None = None) -> RunRecord:
        if run_id not in self._runs:
            raise KeyError(f"Run {run_id} not found")
        record = self._runs[run_id]
        if record.status != "paused":
            raise ValueError(f"Run {run_id} is not paused (current status: {record.status})")

        record.status = "running"
        resumed_state = self.graph.resume_to_completion(record.state, payload or {})
        record.status = resumed_state.get("status", "completed")
        record.state = dict(resumed_state)
        record.updated_at = utc_now_iso()
        self._runs[run_id] = record
        return record

    def get_run(self, run_id: str) -> RunRecord:
        if run_id not in self._runs:
            raise KeyError(f"Run {run_id} not found")
        return self._runs[run_id]

    def serialize_run(self, record: RunRecord) -> dict[str, Any]:
        payload = asdict(record)
        payload["output"] = (record.state or {}).get("output")
        payload["pause_reason"] = (record.state or {}).get("pause_reason")
        return payload
