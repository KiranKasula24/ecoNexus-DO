from app.main import create_app


def test_create_app_without_groq_key_runs_deterministic(monkeypatch) -> None:
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    app = create_app()
    assert app.state.agent_service.graph.llm_adapter is None


def test_create_app_with_groq_key_enables_llm(monkeypatch) -> None:
    monkeypatch.setenv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role")
    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    monkeypatch.setenv("GROQ_MODEL", "llama-3.1-8b-instant")
    app = create_app()
    assert app.state.agent_service.graph.llm_adapter is not None
