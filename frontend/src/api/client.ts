/**
 * VoiceCoach API client. Use proxy /api in dev (vite.config) or set VITE_API_BASE.
 */
const API_BASE = (import.meta.env.VITE_API_BASE as string) || '/api';

export interface SessionStartRequest {
  user_id: string;
  role: string;
  company: string;
  difficulty?: string;
  level?: string;
  job_description?: string;
}

export interface SessionStartResponse {
  session_id: string;
  first_question: string;
  question_number: number;
  topics_covered: string[];
  difficulty: string;
}

export interface ModulateSummary {
  transcript: string;
  stress_score: number;
  confidence_level: string;
  confidence_score: number;
  hesitation_count: number;
  emotion?: Record<string, number>;
  deception_score?: number;
}

export interface FactCheckResult {
  claim: string | null;
  correct: boolean;
  actual_value: string | null;
  source_url: string | null;
  summary: string | null;
}

export interface ModulateTrendPoint {
  stress_score: number;
  confidence_score: number;
}

export interface AnswerResponse {
  next_question: string;
  feedback_note: string;
  tone: string;
  question_number: number;
  modulate_summary: ModulateSummary | null;
  fact_check: FactCheckResult | null;
  transcript: string;
  overall_score: number | null;
  fact_accuracy_pct: number | null;
  modulate_trend?: ModulateTrendPoint[];
  extracted_entities?: { text: string; label: string }[];
  voice_coaching_tip?: string | null;
  voice_pacing_score?: number | null;
}

export async function startSession(body: SessionStartRequest): Promise<SessionStartResponse> {
  const res = await fetch(`${API_BASE}/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function submitAnswer(
  sessionId: string,
  audioBlob: Blob,
  currentQuestion: string,
  durationSeconds: number
): Promise<AnswerResponse> {
  const form = new FormData();
  form.append('session_id', sessionId);
  form.append('current_question', currentQuestion);
  form.append('duration_seconds', String(durationSeconds));
  form.append('audio', audioBlob, 'answer.webm');
  const res = await fetch(`${API_BASE}/session/answer`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface SessionFeedbackReport {
  session_id: string;
  overall_trend: string;
  strengths: string[];
  focus_areas: string[];
  suggested_next_steps: string[];
  fact_check_summary?: string | null;
  disputed_claims?: string[];
}

/** Post-session feedback from Fastino + optional LLM synthesis. */
export async function getSessionFeedback(sessionId: string): Promise<SessionFeedbackReport> {
  const res = await fetch(`${API_BASE}/session/${sessionId}/feedback`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface SessionEndResponse {
  session_id: string;
  questions_asked: number;
  feedback: SessionFeedbackReport;
}

/** End a session and get the final feedback report. */
export async function endSession(sessionId: string): Promise<SessionEndResponse> {
  const res = await fetch(`${API_BASE}/session/${sessionId}/end`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface UserProfileResponse {
  user_id: string;
  summary: string | null;
  weak_areas: string[];
  strong_areas: string[];
  baseline_stress: number | null;
  recent_topics: string[];
  sample_snippets: string[];
  skill_map?: Record<string, string[]>; // label -> texts
}

/** User profile from Fastino (longitudinal). */
export async function getUserProfile(userId: string): Promise<UserProfileResponse> {
  const res = await fetch(`${API_BASE}/user/${userId}/profile`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface ScoutUpdate {
  title: string;
  url: string;
  summary: string;
}

/** Yutori Scout updates for this session (role/company). */
export async function getScoutUpdates(sessionId: string): Promise<{ updates: ScoutUpdate[] }> {
  const res = await fetch(`${API_BASE}/session/${sessionId}/scout-updates`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface CompanyBriefResponse {
  expectations: string[];
  hints: string[];
  source_urls: string[];
}

/** Yutori Browsing company brief for role at company. Pass sessionId to attach to session for orchestrator. */
export async function postCompanyBrief(
  role: string,
  company: string,
  sessionId?: string
): Promise<CompanyBriefResponse> {
  const res = await fetch(`${API_BASE}/research/company-brief`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, company, session_id: sessionId ?? null }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface FastinoFinetuneResponse {
  status: string;
  platform: string;
  target_model: string;
  estimated_improvement: string;
}

/** Trigger or simulate Pioneer/Fastino fine-tuning for this user. */
export async function triggerFinetuning(userId: string): Promise<FastinoFinetuneResponse> {
  const res = await fetch(`${API_BASE}/user/${userId}/trigger-finetuning`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
