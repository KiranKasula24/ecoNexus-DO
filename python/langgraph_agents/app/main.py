from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .config import Settings
from .graph import AgentGraph
from .llm_adapter import GroqSynthesisAdapter
from .service import AgentRunService
from .supabase_repository import SupabaseAgentRepository

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)


class StartRunRequest(BaseModel):
    company_id: str = Field(min_length=1)
    locality: str | None = None
    material_scope: list[str] | None = None
    seed_tag: str | None = None


class ResumeRunRequest(BaseModel):
    action: str = "resume"
    notes: str | None = None
    overrides: dict[str, Any] | None = None


def create_app(service: AgentRunService | None = None) -> FastAPI:
    app = FastAPI(title="EcoNexus LangGraph Agent Service", version="0.1.0")
    if service is None:
        settings = Settings.from_env()
        repository = SupabaseAgentRepository(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_service_role_key,
        )
        llm_adapter = None
        if settings.groq_api_key:
            try:
                llm_adapter = GroqSynthesisAdapter(
                    api_key=settings.groq_api_key,
                    model=settings.groq_model,
                    timeout_s=settings.groq_timeout_s,
                )
            except Exception as exc:  # noqa: BLE001
                logging.getLogger("econexus.langgraph").warning(
                    "Groq adapter initialization failed; falling back to deterministic mode: %s",
                    exc,
                )
        graph = AgentGraph(
            repository,
            offer_visibility=settings.default_offer_visibility,
            request_visibility=settings.default_request_visibility,
            llm_adapter=llm_adapter,
        )
        service = AgentRunService(graph=graph, repository=repository)
    app.state.agent_service = service

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/runs/start")
    def start_run(request: StartRunRequest) -> dict[str, Any]:
        try:
            run = app.state.agent_service.start_run(
                company_id=request.company_id,
                locality=request.locality,
            )
            return app.state.agent_service.serialize_run(run)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/runs/{run_id}/resume")
    def resume_run(run_id: str, request: ResumeRunRequest) -> dict[str, Any]:
        if request.action.lower() != "resume":
            raise HTTPException(status_code=400, detail="Only action='resume' is supported.")
        payload: dict[str, Any] = {"notes": request.notes or ""}
        if request.overrides:
            payload["overrides"] = request.overrides
        try:
            run = app.state.agent_service.resume_run(run_id, payload)
            return app.state.agent_service.serialize_run(run)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.get("/runs/{run_id}")
    def get_run(run_id: str) -> dict[str, Any]:
        try:
            run = app.state.agent_service.get_run(run_id)
            return app.state.agent_service.serialize_run(run)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    return app


try:
    app = create_app()
except Exception:  # noqa: BLE001
    # Allows test imports and local dev even when prod env vars are not set yet.
    app = FastAPI(title="EcoNexus LangGraph Agent Service", version="0.1.0")

    @app.get("/health")
    def health_fallback() -> dict[str, str]:
        return {"status": "misconfigured"}
