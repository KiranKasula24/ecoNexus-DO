from __future__ import annotations

import logging
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from .centroid import build_centroids, choose_nearest_centroid
from .llm_adapter import GroqSynthesisAdapter
from .processor_adapter import ProcessorNodeInput, run_processor_adapter_stub
from .repository import AgentRepository

logger = logging.getLogger("econexus.langgraph")


class AgentState(TypedDict, total=False):
    run_id: str
    company_id: str
    agent_id: str
    locality: str
    material_category: str
    target_price: float
    target_volume: float
    centroid_id: str
    centroid_material: str
    synthesis: dict[str, Any]
    offer_content: dict[str, Any]
    request_content: dict[str, Any]
    status: str
    pause_reason: str
    resume_payload: dict[str, Any]
    output: dict[str, Any]
    llm_meta: dict[str, Any]


class AgentGraph:
    def __init__(
        self,
        repository: AgentRepository,
        *,
        offer_visibility: str,
        request_visibility: str,
        llm_adapter: GroqSynthesisAdapter | None = None,
    ) -> None:
        self.repository = repository
        self.offer_visibility = offer_visibility
        self.request_visibility = request_visibility
        self.llm_adapter = llm_adapter
        self.phase_one_graph = self._build_phase_one_graph()
        self.finalize_graph = self._build_finalize_graph()

    def _build_phase_one_graph(self):
        graph = StateGraph(AgentState)
        graph.add_node("ingest_context", self.ingest_context)
        graph.add_node("nearest_centroid_match", self.nearest_centroid_match)
        graph.add_node("market_synthesis", self.market_synthesis)
        graph.add_node("pause_gate", self.pause_gate)
        graph.add_edge(START, "ingest_context")
        graph.add_edge("ingest_context", "nearest_centroid_match")
        graph.add_edge("nearest_centroid_match", "market_synthesis")
        graph.add_edge("market_synthesis", "pause_gate")
        graph.add_edge("pause_gate", END)
        return graph.compile()

    def _build_finalize_graph(self):
        graph = StateGraph(AgentState)
        graph.add_node("finalize_output", self.finalize_output)
        graph.add_edge(START, "finalize_output")
        graph.add_edge("finalize_output", END)
        return graph.compile()

    def run_until_pause(self, initial_state: AgentState) -> AgentState:
        return self.phase_one_graph.invoke(initial_state)

    def resume_to_completion(self, paused_state: AgentState, resume_payload: dict[str, Any] | None) -> AgentState:
        merged = dict(paused_state)
        merged["resume_payload"] = resume_payload or {}
        merged["status"] = "running"
        return self.finalize_graph.invoke(merged)

    def ingest_context(self, state: AgentState) -> AgentState:
        logger.info("[run=%s] ingest_context started", state["run_id"])
        materials = self.repository.get_company_material_inputs(state["company_id"])

        if materials:
            top = max(materials, key=lambda m: (m.monthly_volume, m.cost_per_unit, m.material_category))
            material_category = top.material_category
            target_volume = float(top.monthly_volume)
            target_price = float(top.cost_per_unit)
        else:
            material_category = "ferrous-metals"
            target_volume = 50.0
            target_price = 200.0

        logger.info(
            "[run=%s] ingest_context selected material=%s volume=%.2f price=%.2f",
            state["run_id"],
            material_category,
            target_volume,
            target_price,
        )
        return {
            "material_category": material_category,
            "target_volume": target_volume,
            "target_price": target_price,
        }

    def nearest_centroid_match(self, state: AgentState) -> AgentState:
        logger.info("[run=%s] nearest_centroid_match started", state["run_id"])
        offers = self.repository.get_active_market_offers(state.get("locality"))
        centroids = build_centroids(offers)
        nearest = choose_nearest_centroid(
            centroids,
            target_price=state.get("target_price", 0.0),
            target_volume=state.get("target_volume", 0.0),
        )

        if nearest is None:
            centroid_id = "centroid::fallback"
            centroid_material = state.get("material_category", "ferrous-metals")
        else:
            centroid_id = nearest.centroid_id
            centroid_material = nearest.material_category

        logger.info(
            "[run=%s] nearest_centroid_match selected centroid=%s material=%s",
            state["run_id"],
            centroid_id,
            centroid_material,
        )
        return {
            "centroid_id": centroid_id,
            "centroid_material": centroid_material,
        }

    def market_synthesis(self, state: AgentState) -> AgentState:
        logger.info("[run=%s] market_synthesis started", state["run_id"])
        material = state.get("centroid_material") or state.get("material_category", "ferrous-metals")
        volume = float(state.get("target_volume") or 50.0)
        price = float(state.get("target_price") or 200.0)

        processor_result = run_processor_adapter_stub(
            ProcessorNodeInput(
                company_id=state["company_id"],
                locality=state["locality"],
                material_category=material,
                target_volume=volume,
                target_price=price,
            )
        )

        llm_meta = {
            "provider": "none",
            "model": "deterministic",
            "enabled": False,
            "fallback_used": True,
            "error_type": None,
        }
        offer_content, request_content = self._deterministic_synthesis(material, volume, price)

        if self.llm_adapter is not None:
            try:
                llm_result = self.llm_adapter.synthesize(
                    material_category=material,
                    target_price=price,
                    target_volume=volume,
                    centroid_id=state.get("centroid_id", "centroid::fallback"),
                )
                offer_content = llm_result.offer_content
                request_content = llm_result.request_content
                llm_meta = llm_result.llm_meta
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "[run=%s] LLM synthesis failed; using deterministic fallback: %s",
                    state["run_id"],
                    exc,
                )
                llm_meta = {
                    "provider": "groq",
                    "model": getattr(self.llm_adapter, "model", "unknown"),
                    "enabled": True,
                    "fallback_used": True,
                    "error_type": type(exc).__name__,
                }

        offer_content.update(
            {
                "material_category": material,
                "material_subtype": offer_content.get("material_subtype") or material,
                "material": offer_content.get("material") or material,
                "unit": "tons",
                "centroid_id": state.get("centroid_id"),
                "run_id": state["run_id"],
                "final_only": True,
            }
        )
        request_content.update(
            {
                "material_category": material,
                "material_subtype": request_content.get("material_subtype") or material,
                "request_scope": request_content.get("request_scope") or "langgraph_mvp_request",
                "centroid_id": state.get("centroid_id"),
                "run_id": state["run_id"],
                "final_only": True,
            }
        )

        logger.info(
            "[run=%s] market_synthesis generated offer/request around centroid=%s",
            state["run_id"],
            state.get("centroid_id"),
        )
        return {
            "synthesis": {
                "processor_stub_status": processor_result.status,
                "processor_stub_notes": processor_result.notes,
            },
            "offer_content": offer_content,
            "request_content": request_content,
            "llm_meta": llm_meta,
        }

    def _deterministic_synthesis(
        self,
        material: str,
        volume: float,
        price: float,
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        offer_price = round(max(1.0, price * 0.98), 2)
        request_price = round(max(1.0, price * 1.03), 2)

        offer_content = {
            "material_category": material,
            "material_subtype": material,
            "material": material,
            "volume": round(volume, 2),
            "unit": "tons",
            "price": offer_price,
            "quality_tier": 2,
            "strategy": "langgraph_mvp_offer",
        }
        request_content = {
            "material_category": material,
            "material_subtype": material,
            "volume_needed": round(volume, 2),
            "max_price": request_price,
            "quality_tier_max": 2,
            "request_scope": "langgraph_mvp_request",
            "strategy": "langgraph_mvp_request",
        }
        return offer_content, request_content

    def pause_gate(self, state: AgentState) -> AgentState:
        logger.info("[run=%s] pause_gate reached; waiting for manual resume", state["run_id"])
        return {
            "status": "paused",
            "pause_reason": "Manual checkpoint reached. Resume via /runs/{run_id}/resume.",
        }

    def finalize_output(self, state: AgentState) -> AgentState:
        logger.info("[run=%s] finalize_output started", state["run_id"])
        offer_id = self.repository.create_agent_feed_post(
            agent_id=state["agent_id"],
            post_type="offer",
            locality=state["locality"],
            visibility=self.offer_visibility,
            content=state["offer_content"],
        )
        request_id = self.repository.create_agent_feed_post(
            agent_id=state["agent_id"],
            post_type="request",
            locality=state["locality"],
            visibility=self.request_visibility,
            content=state["request_content"],
        )

        logger.info(
            "[run=%s] finalize_output completed offer_id=%s request_id=%s",
            state["run_id"],
            offer_id,
            request_id,
        )
        return {
            "status": "completed",
            "output": {
                "offer_post_id": offer_id,
                "request_post_id": request_id,
                "run_id": state["run_id"],
                "centroid_id": state.get("centroid_id"),
            },
        }
