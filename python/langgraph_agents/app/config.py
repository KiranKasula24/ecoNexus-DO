from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_service_role_key: str
    default_offer_visibility: str = "local"
    default_request_visibility: str = "local"
    groq_api_key: str | None = None
    groq_model: str = "llama-3.1-8b-instant"
    groq_timeout_s: float = 20.0

    @staticmethod
    def from_env() -> "Settings":
        supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
        supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url:
            raise ValueError(
                "Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL."
            )
        if not supabase_service_role_key:
            raise ValueError("Missing SUPABASE_SERVICE_ROLE_KEY.")

        return Settings(
            supabase_url=supabase_url,
            supabase_service_role_key=supabase_service_role_key,
            default_offer_visibility=os.getenv("AGENT_OFFER_VISIBILITY", "local"),
            default_request_visibility=os.getenv("AGENT_REQUEST_VISIBILITY", "local"),
            groq_api_key=os.getenv("GROQ_API_KEY"),
            groq_model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
            groq_timeout_s=float(os.getenv("GROQ_TIMEOUT_S", "20")),
        )
