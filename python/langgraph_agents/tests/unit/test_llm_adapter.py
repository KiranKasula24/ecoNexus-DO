import pytest

from app.llm_adapter import GroqSynthesisAdapter, LLMOutputError
from tests.test_support import FakeMalformedChatModel, FakeSuccessChatModel


def test_llm_adapter_returns_valid_schema_output() -> None:
    adapter = GroqSynthesisAdapter(
        api_key="test",
        model="llama-3.1-8b-instant",
        chat_model=FakeSuccessChatModel(),
    )
    result = adapter.synthesize(
        material_category="ferrous-metals",
        target_price=220.0,
        target_volume=120.0,
        centroid_id="centroid::ferrous-metals",
    )
    assert result.offer_content["material_category"] == "ferrous-metals"
    assert result.offer_content["volume"] > 0
    assert result.request_content["volume_needed"] > 0
    assert result.llm_meta["provider"] == "groq"
    assert result.llm_meta["fallback_used"] is False


def test_llm_adapter_rejects_malformed_json() -> None:
    adapter = GroqSynthesisAdapter(
        api_key="test",
        model="llama-3.1-8b-instant",
        chat_model=FakeMalformedChatModel(),
    )
    with pytest.raises(LLMOutputError):
        adapter.synthesize(
            material_category="ferrous-metals",
            target_price=220.0,
            target_volume=120.0,
            centroid_id="centroid::ferrous-metals",
        )


def test_llm_adapter_rejects_out_of_range_schema() -> None:
    class OutOfRangeChatModel:
        def invoke(self, messages):
            _ = messages
            return type(
                "Obj",
                (),
                {
                    "content": """
                    {
                      "offer_content": {
                        "material_category": "ferrous-metals",
                        "volume": 120,
                        "unit": "tons",
                        "price": 215,
                        "quality_tier": 9
                      },
                      "request_content": {
                        "material_category": "ferrous-metals",
                        "volume_needed": 120,
                        "max_price": 228,
                        "quality_tier_max": 2
                      }
                    }
                    """
                },
            )()

    adapter = GroqSynthesisAdapter(
        api_key="test",
        model="llama-3.1-8b-instant",
        chat_model=OutOfRangeChatModel(),
    )
    with pytest.raises(LLMOutputError):
        adapter.synthesize(
            material_category="ferrous-metals",
            target_price=220.0,
            target_volume=120.0,
            centroid_id="centroid::ferrous-metals",
        )
