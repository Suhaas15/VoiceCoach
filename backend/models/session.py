"""Pydantic models for session and answer flow."""
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Level(str, Enum):
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    STAFF = "staff"
    PRINCIPAL = "principal"


class Tone(str, Enum):
    SUPPORTIVE = "supportive"
    NEUTRAL = "neutral"
    CHALLENGING = "challenging"


class SessionStart(BaseModel):
    """Request to start a new interview session."""
    user_id: str = Field(..., description="User identifier")
    role: str = Field(..., description="Target role e.g. Product Manager")
    company: str = Field(..., description="Target company e.g. Google")
    difficulty: Difficulty = Field(default=Difficulty.MEDIUM, description="easy | medium | hard")
    level: Level = Field(default=Level.MID, description="junior | mid | senior | staff | principal")
    job_description: str = Field(default="", description="Optional job description text to tailor questions")


class SessionStartResponse(BaseModel):
    """Response from session start."""
    session_id: str
    first_question: str
    question_number: int = 1
    topics_covered: list[str] = Field(default_factory=list)
    difficulty: Difficulty = Difficulty.MEDIUM


class ModulateResult(BaseModel):
    """Result from Modulate Velma voice analysis."""
    transcript: str = ""
    stress_score: float = 0.0
    confidence_level: str = "medium"
    confidence_score: float = 0.5
    hesitation_count: int = 0
    emotion: Optional[dict] = None
    deception_score: Optional[float] = None


class FactCheckResult(BaseModel):
    """Result from Yutori Research fact-check."""
    claim: Optional[str] = None
    correct: bool = True
    actual_value: Optional[str] = None
    source_url: Optional[str] = None
    summary: Optional[str] = None


class OrchestratorResponse(BaseModel):
    """Response from orchestrator LLM."""
    next_question: str
    difficulty_delta: int = 0  # -1, 0, 1
    tone: Tone = Tone.NEUTRAL  # supportive | neutral | challenging
    feedback_note: str = ""
    reasoning: Optional[str] = None


class AnswerResponse(BaseModel):
    """Response from POST /session/answer."""
    next_question: str
    feedback_note: str = ""
    tone: Tone = Tone.NEUTRAL
    question_number: int = 1
    modulate_summary: Optional[ModulateResult] = None
    fact_check: Optional[FactCheckResult] = None
    transcript: str = ""
    overall_score: Optional[int] = None
    fact_accuracy_pct: Optional[float] = None
    modulate_trend: list[dict] = Field(default_factory=list)  # [{ stress_score, confidence_score }, ...] last N
    extracted_entities: list[dict] = Field(default_factory=list)  # [{ text, label }, ...] from GLiNER-2
    voice_coaching_tip: Optional[str] = None  # Modulate-derived hint for judges
    voice_pacing_score: Optional[float] = None  # 0-100 from hesitations + stress
