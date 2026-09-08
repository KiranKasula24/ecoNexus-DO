from __future__ import annotations

from typing import Any

from app.models import AgentInfo, MarketplacePost, MaterialInput
from app.repository import AgentRepository


class InMemoryRepository(AgentRepository):
    def __init__(self) -> None:
        self.agent = AgentInfo(
            id="agent-1",
            company_id="company-1",
            locality="hyderabad",
            name="Nexa Test Agent",
        )
        self.inputs = [
            MaterialInput(
                material_category="ferrous-metals",
                material_subtype="shredded-ferrous-scrap",
                monthly_volume=120.0,
                cost_per_unit=220.0,
            )
        ]
        self.offers = [
            MarketplacePost(
                material_category="ferrous-metals",
                material_subtype="shredded-ferrous-scrap",
                price=210.0,
                volume=100.0,
                locality="hyderabad",
            ),
            MarketplacePost(
                material_category="ferrous-metals",
                material_subtype="mixed-steel-offcuts",
                price=230.0,
                volume=140.0,
                locality="hyderabad",
            ),
            MarketplacePost(
                material_category="polymers",
                material_subtype="pet-flakes",
                price=180.0,
                volume=90.0,
                locality="hyderabad",
            ),
        ]
        self.created_posts: list[dict[str, Any]] = []

    def get_active_agent_for_company(self, company_id: str) -> AgentInfo:
        if company_id != self.agent.company_id:
            raise ValueError("Unknown company")
        return self.agent

    def get_company_material_inputs(self, company_id: str) -> list[MaterialInput]:
        if company_id != self.agent.company_id:
            return []
        return self.inputs

    def get_active_market_offers(self, locality: str | None = None) -> list[MarketplacePost]:
        if not locality:
            return self.offers
        return [o for o in self.offers if o.locality == locality]

    def create_agent_feed_post(
        self,
        *,
        agent_id: str,
        post_type: str,
        locality: str,
        visibility: str,
        content: dict[str, Any],
    ) -> str:
        post_id = f"{post_type}-{len(self.created_posts) + 1}"
        self.created_posts.append(
            {
                "id": post_id,
                "agent_id": agent_id,
                "post_type": post_type,
                "locality": locality,
                "visibility": visibility,
                "content": content,
            }
        )
        return post_id


class FakeAIMessage:
    def __init__(self, content: str) -> None:
        self.content = content


class FakeSuccessChatModel:
    def invoke(self, messages: list[tuple[str, str]]) -> FakeAIMessage:
        _ = messages
        return FakeAIMessage(
            """
            {
              "offer_content": {
                "material_category": "ferrous-metals",
                "material_subtype": "shredded-ferrous-scrap",
                "material": "shredded-ferrous-scrap",
                "volume": 120,
                "unit": "tons",
                "price": 215,
                "quality_tier": 2,
                "strategy": "langgraph_llm_offer"
              },
              "request_content": {
                "material_category": "ferrous-metals",
                "material_subtype": "shredded-ferrous-scrap",
                "volume_needed": 120,
                "max_price": 228,
                "quality_tier_max": 2,
                "request_scope": "langgraph_mvp_request",
                "strategy": "langgraph_llm_request"
              }
            }
            """
        )


class FakeMalformedChatModel:
    def invoke(self, messages: list[tuple[str, str]]) -> FakeAIMessage:
        _ = messages
        return FakeAIMessage("this is not json")


class FakeFailingLLMAdapter:
    model = "llama-3.1-8b-instant"

    def synthesize(
        self,
        *,
        material_category: str,
        target_price: float,
        target_volume: float,
        centroid_id: str,
    ) -> Any:
        _ = (material_category, target_price, target_volume, centroid_id)
        raise RuntimeError("simulated groq outage")
