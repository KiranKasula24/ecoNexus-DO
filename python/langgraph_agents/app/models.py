from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal


RunStatus = Literal["running", "paused", "completed", "failed"]
PostType = Literal["offer", "request"]


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class AgentInfo:
    id: str
    company_id: str
    locality: str
    name: str


@dataclass
class MaterialInput:
    material_category: str
    material_subtype: str | None
    monthly_volume: float
    cost_per_unit: float


@dataclass
class MarketplacePost:
    material_category: str
    material_subtype: str | None
    price: float
    volume: float
    locality: str


@dataclass
class RunRecord:
    run_id: str
    status: RunStatus
    company_id: str
    locality: str
    state: dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=utc_now_iso)
    updated_at: str = field(default_factory=utc_now_iso)
    error: str | None = None

