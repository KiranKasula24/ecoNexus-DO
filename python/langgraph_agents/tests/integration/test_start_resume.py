from fastapi.testclient import TestClient

from app.graph import AgentGraph
from app.llm_adapter import GroqSynthesisAdapter
from app.main import create_app
from app.service import AgentRunService
from tests.test_support import (
    FakeFailingLLMAdapter,
    FakeSuccessChatModel,
    InMemoryRepository,
)


def _build_test_client(llm_adapter=None) -> TestClient:
    repo = InMemoryRepository()
    graph = AgentGraph(
        repo,
        offer_visibility="local",
        request_visibility="local",
        llm_adapter=llm_adapter,
    )
    app = create_app(service=AgentRunService(graph=graph, repository=repo))
    return TestClient(app)


def test_start_pause_resume_flow() -> None:
    client = _build_test_client()

    start = client.post("/runs/start", json={"company_id": "company-1", "locality": "hyderabad"})
    assert start.status_code == 200
    start_json = start.json()
    assert start_json["status"] == "paused"
    run_id = start_json["run_id"]

    status_before_resume = client.get(f"/runs/{run_id}")
    assert status_before_resume.status_code == 200
    assert status_before_resume.json()["status"] == "paused"

    resume = client.post(
        f"/runs/{run_id}/resume",
        json={"action": "resume", "notes": "ship final output"},
    )
    assert resume.status_code == 200
    resume_json = resume.json()
    assert resume_json["status"] == "completed"
    assert resume_json["output"]["offer_post_id"]
    assert resume_json["output"]["request_post_id"]


def test_start_pause_resume_flow_with_llm_success() -> None:
    llm_adapter = GroqSynthesisAdapter(
        api_key="test",
        model="llama-3.1-8b-instant",
        chat_model=FakeSuccessChatModel(),
    )
    client = _build_test_client(llm_adapter=llm_adapter)

    start = client.post("/runs/start", json={"company_id": "company-1", "locality": "hyderabad"})
    assert start.status_code == 200
    run_id = start.json()["run_id"]

    resume = client.post(f"/runs/{run_id}/resume", json={"action": "resume"})
    assert resume.status_code == 200
    payload = resume.json()
    assert payload["status"] == "completed"
    assert payload["state"]["llm_meta"]["fallback_used"] is False


def test_start_pause_resume_flow_with_llm_fallback() -> None:
    client = _build_test_client(llm_adapter=FakeFailingLLMAdapter())
    start = client.post("/runs/start", json={"company_id": "company-1", "locality": "hyderabad"})
    assert start.status_code == 200
    run_id = start.json()["run_id"]

    resume = client.post(f"/runs/{run_id}/resume", json={"action": "resume"})
    assert resume.status_code == 200
    payload = resume.json()
    assert payload["status"] == "completed"
    assert payload["state"]["llm_meta"]["fallback_used"] is True
