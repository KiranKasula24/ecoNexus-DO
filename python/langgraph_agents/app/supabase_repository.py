from __future__ import annotations

from typing import Any

from supabase import Client, create_client

from .models import AgentInfo, MarketplacePost, MaterialInput
from .repository import AgentRepository


class SupabaseAgentRepository(AgentRepository):
    def __init__(self, *, supabase_url: str, supabase_key: str) -> None:
        self._client: Client = create_client(supabase_url, supabase_key)

    def get_active_agent_for_company(self, company_id: str) -> AgentInfo:
        response = (
            self._client.table("agents")
            .select("id, company_id, locality, name")
            .eq("company_id", company_id)
            .eq("status", "active")
            .limit(1)
            .execute()
        )
        rows = response.data or []
        if not rows:
            raise ValueError(f"No active agent found for company {company_id}")
        row = rows[0]
        return AgentInfo(
            id=row["id"],
            company_id=row["company_id"],
            locality=row.get("locality") or "unknown",
            name=row.get("name") or "agent",
        )

    def get_company_material_inputs(self, company_id: str) -> list[MaterialInput]:
        response = (
            self._client.table("materials")
            .select("material_category, material_subtype, monthly_volume, cost_per_unit")
            .eq("company_id", company_id)
            .eq("category", "input")
            .execute()
        )
        rows = response.data or []
        items: list[MaterialInput] = []
        for row in rows:
            material_category = (row.get("material_category") or "").strip().lower()
            if not material_category:
                continue
            items.append(
                MaterialInput(
                    material_category=material_category,
                    material_subtype=row.get("material_subtype"),
                    monthly_volume=float(row.get("monthly_volume") or 0),
                    cost_per_unit=float(row.get("cost_per_unit") or 0),
                )
            )
        return items

    def get_active_market_offers(self, locality: str | None = None) -> list[MarketplacePost]:
        query = (
            self._client.table("agent_feed")
            .select("locality, content")
            .eq("post_type", "offer")
            .eq("is_active", True)
            .limit(500)
        )
        if locality:
            query = query.eq("locality", locality)
        response = query.execute()
        rows = response.data or []

        posts: list[MarketplacePost] = []
        for row in rows:
            content = row.get("content") or {}
            material_category = str(
                content.get("material_category")
                or content.get("material_subtype")
                or content.get("material")
                or ""
            ).strip().lower()
            if not material_category:
                continue
            posts.append(
                MarketplacePost(
                    material_category=material_category,
                    material_subtype=content.get("material_subtype"),
                    price=float(content.get("price") or 0),
                    volume=float(content.get("volume") or 0),
                    locality=row.get("locality") or "unknown",
                )
            )
        return posts

    def create_agent_feed_post(
        self,
        *,
        agent_id: str,
        post_type: str,
        locality: str,
        visibility: str,
        content: dict[str, Any],
    ) -> str:
        response = (
            self._client.table("agent_feed")
            .insert(
                {
                    "agent_id": agent_id,
                    "post_type": post_type,
                    "locality": locality,
                    "visibility": visibility,
                    "is_active": True,
                    "content": content,
                }
            )
            .execute()
        )
        rows = response.data or []
        if not rows:
            raise RuntimeError("Failed to insert agent_feed post")
        return rows[0]["id"]

