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
  /** "modulate" = real per-answer metrics; "stub" = demo/fallback */
  metrics_source?: 'modulate' | 'stub' | null;
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

const REPORT_FETCH_TIMEOUT_MS = 28_000;

/** Post-session feedback from Fastino + optional LLM synthesis. Times out after 28s so UI doesn't hang. */
export async function getSessionFeedback(sessionId: string): Promise<SessionFeedbackReport> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REPORT_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/session/${sessionId}/feedback`, { signal: controller.signal });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Report took too long. Try again or check the backend.');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
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

/** Scout status: live = real scout; no_scout = creation failed or no key, showing demo tips. */
export type ScoutStatus = 'live' | 'no_scout';

/** Yutori Scout updates for this session (role/company). */
export async function getScoutUpdates(sessionId: string): Promise<{ updates: ScoutUpdate[]; scout_status?: ScoutStatus }> {
  const res = await fetch(`${API_BASE}/session/${sessionId}/scout-updates`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Neo4j session graph: nodes and edges for the context graph (Session → Answer → Entity / Decision). */
export interface SessionGraphNode {
  id: string;
  type: 'Session' | 'Answer' | 'Entity' | 'Decision';
  label?: string;
  role?: string;
  company?: string;
  question_number?: number;
  transcript_preview?: string;
  text?: string;
  next_question_preview?: string;
}

export interface SessionGraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface SessionGraphResponse {
  session_id: string;
  nodes: SessionGraphNode[];
  edges: SessionGraphEdge[];
  /** When false, Neo4j env vars are not set; graph will stay empty until configured. */
  neo4j_configured?: boolean;
}

const GRAPH_FETCH_TIMEOUT_MS = 15_000;

/** Neo4j session subgraph for the current session (proves graph is working). Times out after 15s so UI doesn't hang. */
export async function getSessionGraph(sessionId: string): Promise<SessionGraphResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GRAPH_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/session/${sessionId}/graph`, { signal: controller.signal });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Graph request timed out. Try again or check the backend.');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
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

export interface VisionAnalyzeResponse {
  feedback: string;
}

const VISION_FETCH_TIMEOUT_MS = 25_000;

export async function analyzeVision(sessionId: string, base64Image: string): Promise<VisionAnalyzeResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VISION_FETCH_TIMEOUT_MS);
  try {
    const form = new FormData();
    form.append('image_base64', base64Image);
    const res = await fetch(`${API_BASE}/session/${sessionId}/vision-analyze`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Vision analysis timed out.');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}
