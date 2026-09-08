from app.graph import AgentGraph
from app.llm_adapter import GroqSynthesisAdapter
from tests.test_support import (
    FakeFailingLLMAdapter,
    FakeSuccessChatModel,
    InMemoryRepository,
)


def test_graph_pause_then_finalize_produces_dual_posts() -> None:
    repo = InMemoryRepository()
    graph = AgentGraph(repo, offer_visibility="local", request_visibility="local")

    paused = graph.run_until_pause(
        {
            "run_id": "run-1",
            "company_id": "company-1",
            "agent_id": "agent-1",
            "locality": "hyderabad",
            "status": "running",
        }
    )
    assert paused["status"] == "paused"
    assert "offer_content" in paused
    assert "request_content" in paused

    completed = graph.resume_to_completion(paused, {"notes": "approved"})
    assert completed["status"] == "completed"
    assert completed["output"]["offer_post_id"].startswith("offer-")
    assert completed["output"]["request_post_id"].startswith("request-")
    assert len(repo.created_posts) == 2
    assert {p["post_type"] for p in repo.created_posts} == {"offer", "request"}


def test_graph_uses_llm_when_available() -> None:
    repo = InMemoryRepository()
    llm_adapter = GroqSynthesisAdapter(
        api_key="test",
        model="llama-3.1-8b-instant",
        chat_model=FakeSuccessChatModel(),
    )
    graph = AgentGraph(
        repo,
        offer_visibility="local",
        request_visibility="local",
        llm_adapter=llm_adapter,
    )
    paused = graph.run_until_pause(
        {
            "run_id": "run-llm",
            "company_id": "company-1",
            "agent_id": "agent-1",
            "locality": "hyderabad",
            "status": "running",
        }
    )
    assert paused["llm_meta"]["provider"] == "groq"
    assert paused["llm_meta"]["fallback_used"] is False
    assert paused["offer_content"]["strategy"] == "langgraph_llm_offer"


def test_graph_falls_back_when_llm_errors() -> None:
    repo = InMemoryRepository()
    graph = AgentGraph(
        repo,
        offer_visibility="local",
        request_visibility="local",
        llm_adapter=FakeFailingLLMAdapter(),
    )
    paused = graph.run_until_pause(
        {
            "run_id": "run-fallback",
            "company_id": "company-1",
            "agent_id": "agent-1",
            "locality": "hyderabad",
            "status": "running",
        }
    )
    assert paused["llm_meta"]["fallback_used"] is True
    assert paused["llm_meta"]["error_type"] == "RuntimeError"
    assert paused["offer_content"]["strategy"] == "langgraph_mvp_offer"
