from __future__ import annotations

from typing import Any, Protocol

from .models import AgentInfo, MaterialInput, MarketplacePost


class AgentRepository(Protocol):
    def get_active_agent_for_company(self, company_id: str) -> AgentInfo:
        ...

    def get_company_material_inputs(self, company_id: str) -> list[MaterialInput]:
        ...

    def get_active_market_offers(self, locality: str | None = None) -> list[MarketplacePost]:
        ...

    def create_agent_feed_post(
        self,
        *,
        agent_id: str,
        post_type: str,
        locality: str,
        visibility: str,
        content: dict[str, Any],
    ) -> str:
        ...

