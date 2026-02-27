"""User and session state models."""
from typing import Optional
from pydantic import BaseModel, Field


class SessionFeedbackReport(BaseModel):
    """Post-session feedback from Fastino + optional LLM synthesis."""
    session_id: str
    overall_trend: str = ""
    strengths: list[str] = Field(default_factory=list)
    focus_areas: list[str] = Field(default_factory=list)
    suggested_next_steps: list[str] = Field(default_factory=list)
    fact_check_summary: Optional[str] = None
    disputed_claims: list[str] = Field(default_factory=list)


class UserProfile(BaseModel):
    """User profile from Fastino."""
    user_id: str
    summary: Optional[str] = None
    weak_areas: list[str] = Field(default_factory=list)
    strong_areas: list[str] = Field(default_factory=list)
    baseline_stress: Optional[float] = None
    recent_topics: list[str] = Field(default_factory=list)
    sample_snippets: list[str] = Field(default_factory=list)


class SessionState(BaseModel):
    """In-memory session state (can be replaced by DB)."""
    session_id: str
    user_id: str
    role: str
    company: str
    difficulty: str
    level: str = "mid"
    job_description: str = ""
    question_count: int = 0
    current_question: str = ""
    topics_covered: list[str] = Field(default_factory=list)
    questions_asked: list[str] = Field(default_factory=list)
    yutori_scout_id: Optional[str] = None
    company_brief: Optional[str] = None
    modulate_history: list[dict] = Field(default_factory=list)
    ended: bool = False


class SessionEndResponse(BaseModel):
    """Response from ending a session."""
    session_id: str
    questions_asked: int
    feedback: SessionFeedbackReport
