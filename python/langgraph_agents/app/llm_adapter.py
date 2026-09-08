from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Protocol

from pydantic import BaseModel, Field, ValidationError


class ChatModel(Protocol):
    def invoke(self, messages: list[tuple[str, str]]) -> Any:
        ...


class OfferContentSchema(BaseModel):
    material_category: str = Field(min_length=1)
    material_subtype: str | None = None
    material: str | None = None
    volume: float = Field(gt=0, le=1_000_000)
    unit: str = "tons"
    price: float = Field(gt=0, le=1_000_000)
    quality_tier: int = Field(default=2, ge=1, le=4)
    strategy: str = "langgraph_llm_offer"


class RequestContentSchema(BaseModel):
    material_category: str = Field(min_length=1)
    material_subtype: str | None = None
    volume_needed: float = Field(gt=0, le=1_000_000)
    max_price: float = Field(gt=0, le=1_000_000)
    quality_tier_max: int = Field(default=2, ge=1, le=4)
    request_scope: str = "langgraph_mvp_request"
    strategy: str = "langgraph_llm_request"


class SynthesisSchema(BaseModel):
    offer_content: OfferContentSchema
    request_content: RequestContentSchema


@dataclass
class LLMResult:
    offer_content: dict[str, Any]
    request_content: dict[str, Any]
    llm_meta: dict[str, Any]


class LLMOutputError(ValueError):
    pass


def _extract_json(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        return "\n".join(lines).strip()
    return stripped


class GroqSynthesisAdapter:
    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        timeout_s: float = 20.0,
        chat_model: ChatModel | None = None,
    ) -> None:
        self.model = model
        self.timeout_s = timeout_s
        if chat_model is not None:
            self._chat_model = chat_model
            return

        from langchain_groq import ChatGroq  # Imported lazily to keep deterministic mode lightweight.

        self._chat_model = ChatGroq(
            api_key=api_key,
            model=model,
            temperature=0,
            timeout=timeout_s,
            max_retries=1,
        )

    def synthesize(
        self,
        *,
        material_category: str,
        target_price: float,
        target_volume: float,
        centroid_id: str,
    ) -> LLMResult:
        prompt = (
            "You are generating marketplace payloads for an industrial circular economy agent.\n"
            "Return STRICT JSON only with this exact top-level object keys:\n"
            "offer_content, request_content\n"
            "Constraints:\n"
            "- offer_content.volume > 0, price > 0\n"
            "- request_content.volume_needed > 0, max_price > 0\n"
            "- quality tiers must be integers between 1 and 4\n"
            "- unit must be 'tons'\n"
            f"- material_category: {material_category}\n"
            f"- target_price: {target_price}\n"
            f"- target_volume: {target_volume}\n"
            f"- centroid_id: {centroid_id}\n"
            "No prose, no markdown, JSON object only."
        )
        messages = [("system", "You are a strict JSON generator."), ("human", prompt)]
        response = self._chat_model.invoke(messages)
        raw_content = getattr(response, "content", "")
        if not isinstance(raw_content, str) or not raw_content.strip():
            raise LLMOutputError("LLM returned empty response content.")

        try:
            parsed = json.loads(_extract_json(raw_content))
        except json.JSONDecodeError as exc:
            raise LLMOutputError(f"Invalid JSON from LLM: {exc}") from exc

        try:
            validated = SynthesisSchema.model_validate(parsed)
        except ValidationError as exc:
            raise LLMOutputError(f"Schema validation failed: {exc}") from exc

        offer = validated.offer_content.model_dump()
        request = validated.request_content.model_dump()

        offer["material"] = offer.get("material") or offer["material_category"]
        offer["material_category"] = offer["material_category"].strip().lower()
        request["material_category"] = request["material_category"].strip().lower()
        if offer.get("material_subtype") is None:
            offer["material_subtype"] = offer["material_category"]
        if request.get("material_subtype") is None:
            request["material_subtype"] = request["material_category"]

        return LLMResult(
            offer_content=offer,
            request_content=request,
            llm_meta={
                "provider": "groq",
                "model": self.model,
                "enabled": True,
                "fallback_used": False,
                "error_type": None,
            },
        )

