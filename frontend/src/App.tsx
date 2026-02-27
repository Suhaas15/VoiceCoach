import { useState, useEffect, useCallback, useRef } from 'react';
import { HeaderV2 } from './components/HeaderV2';
import { AriaAside } from './components/AriaAside';
import { SessionRow } from './components/SessionRow';
import { QuestionCardLight } from './components/QuestionCardLight';
import { AnswerCardLight } from './components/AnswerCardLight';
import { FeedbackCardLight } from './components/FeedbackCardLight';
import { MetricsRowLight } from './components/MetricsRowLight';
import { Modal } from './components/Modal';
import { SessionSetup } from './components/SessionSetup';
import { CompetencyMap, type Entity } from './components/CompetencyMap';
import {
  startSession,
  submitAnswer,
  endSession,
  getSessionFeedback,
  getUserProfile,
  getScoutUpdates,
  getSessionGraph,
  postCompanyBrief,
  triggerFinetuning,
  type AnswerResponse,
  type ModulateSummary,
  type SessionFeedbackReport,
  type UserProfileResponse,
  type ScoutUpdate,
  type SessionGraphResponse,
  type CompanyBriefResponse,
  type FastinoFinetuneResponse,
} from './api/client';
import BauhausCursor from './components/BauhausCursor';

function getUserId(): string {
  const KEY = 'voicecoach_user_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `user_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

const DEFAULT_EMOTION_BARS = [
  { label: 'Confidence', value: 0, color: 'var(--fg)', bg: '' },
  { label: 'Stress', value: 0, color: 'var(--fg)', bg: '' },
  { label: 'Clarity', value: 0, color: 'var(--fg)', bg: '' },
  { label: 'Pace', value: 0, color: 'var(--fg)', bg: '' },
  { label: 'Hesitation', value: 0, color: 'var(--fg)', bg: '' },
];

function modulateToEmotionBars(m: ModulateSummary | null, voicePacingScore?: number | null): typeof DEFAULT_EMOTION_BARS {
  if (!m) return DEFAULT_EMOTION_BARS;
  const conf = Math.round((m.confidence_score ?? 0.72) * 100);
  const stress = Math.round((m.stress_score ?? 0.28) * 100);
  const clarity = Math.max(50, Math.min(100, 85 - (m.hesitation_count ?? 0) * 5));
  const pace =
    typeof voicePacingScore === 'number' && Number.isFinite(voicePacingScore)
      ? Math.round(Math.max(0, Math.min(100, voicePacingScore)))
      : 50 + Math.round((1 - (m.stress_score ?? 0.3)) * 35);
  const hesit = Math.min(100, Math.max(0, (m.hesitation_count ?? 0) * 9));
  return [
    { label: 'Confidence', value: conf, color: 'var(--fg)', bg: '' },
    { label: 'Stress', value: stress, color: 'var(--fg)', bg: '' },
    { label: 'Clarity', value: clarity, color: 'var(--fg)', bg: '' },
    { label: 'Pace', value: Math.min(100, pace), color: 'var(--fg)', bg: '' },
    { label: 'Hesitation', value: hesit, color: 'var(--fg)', bg: '' },
  ];
}

type AppPhase = 'setup' | 'interview' | 'complete';

interface SessionConfig {
  company: string;
  role: string;
  level: string;
  difficulty: string;
  jobDescription: string;
}

function App() {
  const userId = useRef(getUserId()).current;

  // Phase state machine
  const [phase, setPhase] = useState<AppPhase>('setup');
  const [setupLoading, setSetupLoading] = useState(false);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [factCheck, setFactCheck] = useState<{ correct: boolean; text: string } | null>(null);
  const [emotionBars, setEmotionBars] = useState(DEFAULT_EMOTION_BARS);
  const [overallScore, setOverallScore] = useState(0);
  const [vsLastSession, setVsLastSession] = useState(0);
  const [coachTone, setCoachTone] = useState<string>('');
  const [modulateTrend, setModulateTrend] = useState<Array<{ stress_score: number; confidence_score: number }>>([]);
  const [extractedEntities, setExtractedEntities] = useState<Entity[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [ariaTalking, setAriaTalking] = useState(false);
  const [speakBarsIdle, setSpeakBarsIdle] = useState(true);
  const [voiceCoachingTip, setVoiceCoachingTip] = useState<string | null>(null);
  const [voicePacingScore, setVoicePacingScore] = useState<number | null>(null);

  // Modals
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [sessionReport, setSessionReport] = useState<SessionFeedbackReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // End session modal
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [endReport, setEndReport] = useState<SessionFeedbackReport | null>(null);
  const [endLoading, setEndLoading] = useState(false);

  // Features (secondary content — collapsed by default so question + answer are primary focus)
  const [scoutExpanded, setScoutExpanded] = useState(false);
  const [companyBriefExpanded, setCompanyBriefExpanded] = useState(false);
  const [scoutUpdates, setScoutUpdates] = useState<ScoutUpdate[]>([]);
  const [scoutStatus, setScoutStatus] = useState<'live' | 'no_scout' | null>(null);
  const [scoutLoading, setScoutLoading] = useState(false);
  const [companyBrief, setCompanyBrief] = useState<CompanyBriefResponse | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [finetuneInfo, setFinetuneInfo] = useState<FastinoFinetuneResponse | null>(null);
  const [finetuneLoading, setFinetuneLoading] = useState(false);
  const [graphExpanded, setGraphExpanded] = useState(false);
  const [graphData, setGraphData] = useState<SessionGraphResponse | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reportTriggerRef = useRef<HTMLButtonElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  // -- Session start --
  const handleStartSession = useCallback(async (config: SessionConfig) => {
    setSetupLoading(true);
    setSessionConfig(config);
    try {
      const res = await startSession({
        user_id: userId,
        role: config.role,
        company: config.company,
        difficulty: config.difficulty,
        level: config.level,
        job_description: config.jobDescription,
      });
      setSessionId(res.session_id);
      setCurrentQuestion(res.first_question);
      setQuestionNumber(res.question_number);
      setPhase('interview');
    } catch (e) {
      console.error('Session start failed', e);
      setSessionId('offline');
      setCurrentQuestion("Tell me about a time you had to influence without authority — what was your approach?");
      setQuestionNumber(1);
      setPhase('interview');
    } finally {
      setSetupLoading(false);
    }
  }, [userId]);

  // -- End session --
  const handleEndSession = useCallback(async () => {
    if (!sessionId || sessionId === 'offline') {
      resetToSetup();
      return;
    }
    setPhase('complete');
    setEndModalOpen(true);
    setEndLoading(true);
    setEndReport(null);
    try {
      const res = await endSession(sessionId);
      setEndReport(res.feedback);
    } catch (e) {
      console.error('End session failed', e);
      setEndReport({
        session_id: sessionId,
        overall_trend: 'Session ended. Enable backend services for a full report.',
        strengths: [],
        focus_areas: [],
        suggested_next_steps: [],
      });
    } finally {
      setEndLoading(false);
    }
  }, [sessionId]);

  const resetToSetup = useCallback(() => {
    setPhase('setup');
    setSessionId(null);
    setSessionConfig(null);
    setCurrentQuestion('');
    setQuestionNumber(0);
    setTranscript('');
    setFeedbackText('');
    setFeedbackVisible(false);
    setFactCheck(null);
    setEmotionBars(DEFAULT_EMOTION_BARS);
    setOverallScore(0);
    setVsLastSession(0);
    setCoachTone('');
    setModulateTrend([]);
    setExtractedEntities([]);
    setRecording(false);
    setRecordSeconds(0);
    setProcessing(false);
    setAriaTalking(false);
    setSpeakBarsIdle(true);
    setReportModalOpen(false);
    setSessionReport(null);
    setProfileModalOpen(false);
    setUserProfile(null);
    setEndModalOpen(false);
    setEndReport(null);
    setScoutExpanded(false);
    setGraphExpanded(false);
    setGraphData(null);
    setScoutUpdates([]);
    setScoutStatus(null);
    setCompanyBrief(null);
    setVoiceCoachingTip(null);
    setVoicePacingScore(null);
  }, []);

  // -- Answer flow --
  const applyAnswerResponse = useCallback((r: AnswerResponse) => {
    setCurrentQuestion(r.next_question);
    setQuestionNumber(r.question_number);
    setFeedbackText(r.feedback_note);
    setFeedbackVisible(true);
    setFactCheck(
      r.fact_check
        ? {
          correct: r.fact_check.correct,
          text: (r.fact_check.summary && r.fact_check.summary.includes('session report'))
            ? 'Fact-check in session report'
            : r.fact_check.correct
              ? 'Yutori verified claim'
              : (r.fact_check.actual_value || 'Claim incorrect'),
        }
        : null
    );
    setTranscript(r.transcript);
    setEmotionBars(modulateToEmotionBars(r.modulate_summary ?? null, r.voice_pacing_score));
    if (r.overall_score != null) {
      setVsLastSession((prev) =>
        overallScore === 0 ? 0 : r.overall_score! - overallScore
      );
      setOverallScore(r.overall_score);
    }
    if (r.tone) setCoachTone(r.tone);
    if (r.modulate_trend && r.modulate_trend.length > 0) setModulateTrend(r.modulate_trend);
    if (r.extracted_entities) setExtractedEntities(r.extracted_entities);
    if (r.voice_coaching_tip != null) setVoiceCoachingTip(r.voice_coaching_tip);
    if (r.voice_pacing_score != null) setVoicePacingScore(r.voice_pacing_score);
    setAriaTalking(true);
    setSpeakBarsIdle(false);
    setTimeout(() => {
      setAriaTalking(false);
      setSpeakBarsIdle(true);
    }, 2000);
  }, [overallScore]);

  useEffect(() => {
    if (!recording) return;
    timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recording]);

  const handleRecorded = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      if (!sessionId || sessionId === 'offline') return;
      setProcessing(true);
      setRecordSeconds(0);
      try {
        const r = await submitAnswer(sessionId, blob, currentQuestion, durationSeconds);
        applyAnswerResponse(r);
      } catch (e) {
        console.error('Submit answer failed', e);
        setFeedbackText('Could not reach server. Try Run Demo or check backend.');
        setFeedbackVisible(true);
      } finally {
        setProcessing(false);
      }
    },
    [sessionId, currentQuestion, applyAnswerResponse]
  );

  const handleViewReport = useCallback(async () => {
    if (!sessionId || sessionId === 'offline') return;
    setReportModalOpen(true);
    setReportLoading(true);
    setSessionReport(null);
    try {
      const report = await getSessionFeedback(sessionId);
      setSessionReport(report);
    } catch (e) {
      console.error('Session report failed', e);
      setSessionReport({
        session_id: sessionId,
        overall_trend: 'Could not load report. Check backend and Fastino.',
        strengths: [],
        focus_areas: [],
        suggested_next_steps: [],
      });
    } finally {
      setReportLoading(false);
    }
  }, [sessionId]);

  const handleViewProfile = useCallback(async () => {
    setProfileModalOpen(true);
    setProfileLoading(true);
    setUserProfile(null);
    try {
      const profile = await getUserProfile(userId);
      setUserProfile(profile);
    } catch (e) {
      console.error('Profile failed', e);
      setUserProfile({
        user_id: userId,
        summary: 'Could not load profile. Enable Fastino and run a few answers.',
        weak_areas: [],
        strong_areas: [],
        baseline_stress: null,
        recent_topics: [],
        sample_snippets: [],
      });
    } finally {
      setProfileLoading(false);
    }
  }, [userId]);

  const handleToggleScout = useCallback(async () => {
    const next = !scoutExpanded;
    setScoutExpanded(next);
    if (next && sessionId && sessionId !== 'offline' && scoutUpdates.length === 0) {
      setScoutLoading(true);
      try {
        const { updates, scout_status } = await getScoutUpdates(sessionId);
        setScoutUpdates(updates);
        setScoutStatus(scout_status ?? null);
      } catch {
        setScoutUpdates([]);
        setScoutStatus(null);
      } finally {
        setScoutLoading(false);
      }
    }
  }, [scoutExpanded, sessionId, scoutUpdates.length]);

  const handleToggleGraph = useCallback(async () => {
    const next = !graphExpanded;
    setGraphExpanded(next);
    const shouldFetch = next && sessionId && sessionId !== 'offline' && (!graphData || graphData.session_id !== sessionId);
    if (shouldFetch) {
      setGraphLoading(true);
      try {
        const data = await getSessionGraph(sessionId);
        setGraphData(data);
      } catch {
        setGraphData({ session_id: sessionId, nodes: [], edges: [] });
      } finally {
        setGraphLoading(false);
      }
    }
  }, [graphExpanded, sessionId, graphData]);

  const handleGetCompanyBrief = useCallback(async () => {
    if (!sessionConfig) return;
    setBriefLoading(true);
    setCompanyBrief(null);
    try {
      const brief = await postCompanyBrief(sessionConfig.role, sessionConfig.company, sessionId ?? undefined);
      setCompanyBrief(brief);
    } catch {
      setCompanyBrief({ expectations: [], hints: [], source_urls: [] });
    } finally {
      setBriefLoading(false);
    }
  }, [sessionId, sessionConfig]);

  const handleTriggerFinetune = useCallback(async () => {
    if (!userId) return;
    setFinetuneLoading(true);
    try {
      const res = await triggerFinetuning(userId);
      setFinetuneInfo(res);
    } catch {
      setFinetuneInfo({
        status: 'stubbed',
        platform: 'Fastino Pioneer',
        target_model: 'GLiNER-2-vcoach-specialized',
        estimated_improvement: '+0% F1 (no API key)',
      });
    } finally {
      setFinetuneLoading(false);
    }
  }, [userId]);

  const roleLabel = sessionConfig ? `${sessionConfig.role}` : '';
  const companyLabel = sessionConfig?.company ?? '';
  const difficultyLabel = sessionConfig?.difficulty ?? 'medium';
  const normalizedDifficultyLabel = (() => {
    const d = (difficultyLabel || '').toLowerCase();
    if (d === 'mediun' || d === 'meduim') return 'Medium';
    if (d === 'easy') return 'Easy';
    if (d === 'hard') return 'Hard';
    return (d === 'medium' ? 'Medium' : difficultyLabel.charAt(0).toUpperCase() + difficultyLabel.slice(1));
  })();
  const levelLabel = sessionConfig?.level ?? 'mid';

  return (
    <>
      {phase === 'setup' ? (
        <SessionSetup onStart={handleStartSession} loading={setupLoading} />
      ) : (
        <div className="app-shell-grid relative z-10">
          <BauhausCursor />
          <header className="app-shell-header min-w-0">
            <HeaderV2 onEndSession={handleEndSession} sessionActive={!!sessionId} />
          </header>
          <AriaAside
            className="app-shell-aside"
            isTalking={ariaTalking}
            emotionBars={emotionBars}
            speakBarsIdle={speakBarsIdle}
            modulateTrend={modulateTrend}
            overallScore={overallScore}
            vsLastSession={vsLastSession}
          />
          <main className="app-shell-main flex flex-col items-center min-w-0 p-8 lg:p-12 overflow-x-hidden">
            <div
              className="flex flex-col min-w-0 w-full max-w-5xl mx-auto"
              style={{ gap: 'var(--gap-section)' }}
            >
            <SessionRow questionNumber={questionNumber} totalQuestions={4} role={`${levelLabel.charAt(0).toUpperCase() + levelLabel.slice(1)} ${roleLabel}`} company={companyLabel} />

            {/* Primary: Question + Answer first for focus */}
            <QuestionCardLight
              question={currentQuestion || 'Loading...'}
              difficulty={normalizedDifficultyLabel}
              typeLabel="Behavioral · Leadership"
            />
            <AnswerCardLight
              transcript={transcript}
              placeholder="Click record and begin speaking. ARIA monitors your voice in real-time."
              factCheck={factCheck}
              recording={recording}
              recordSeconds={recordSeconds}
              statusText={processing ? 'Processing…' : recording ? 'Recording…' : 'Ready'}
              hintText={processing ? 'Running ARIA analysis' : recording ? (recordSeconds >= 75 ? 'Wrap up soon (90s max)' : 'Modulate analyzing · 90s max') : 'Click mic · 90s max'}
              processing={processing}
              onStartRecord={() => setRecording(true)}
              onStopRecord={() => setRecording(false)}
              onRecorded={handleRecorded}
              onError={(msg) => { setFeedbackText(msg); setFeedbackVisible(true); }}
            />
            {/* Voice Coaching Feedback */}
            <FeedbackCardLight
              visible={feedbackVisible}
              feedbackText={feedbackText}
              coachTone={coachTone}
              voicePacingScore={voicePacingScore}
              voiceCoachingTip={voiceCoachingTip}
            />

            {/* Secondary: Yutori Scout (collapsible) */}
            <div
              style={{
                border: '3px solid var(--fg)',
                background: 'var(--white)',
                boxShadow: 'var(--sh4)',
                marginTop: 16,
              }}
            >
              <button
                type="button"
                onClick={handleToggleScout}
                aria-expanded={scoutExpanded}
                data-cursor="hover"
                className="bauhaus-interactive w-full text-left flex justify-between items-center outline-none"
                style={{
                  padding: '12px 16px',
                  fontFamily: 'var(--f)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  borderBottom: scoutExpanded ? '2px solid var(--fg)' : 'none',
                  background: scoutExpanded ? 'var(--muted)' : 'var(--white)',
                }}
              >
                <span>Yutori Scout · Web Updates</span>
                <span
                  style={{
                    transition: 'transform 200ms ease-out',
                    transform: scoutExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
              {scoutExpanded && (
                <div className="pop-in" style={{ padding: '16px', fontSize: 13, fontFamily: 'var(--f)' }}>
                  {scoutLoading ? (
                    <p>Loading updates…</p>
                  ) : scoutUpdates.length === 0 ? (
                    <p>
                      {scoutStatus === 'live'
                        ? 'No updates yet from your scout. Check back later.'
                        : 'No Yutori Scout updates yet. Start a session and wait a bit, or add your Yutori API key and billing to enable live scouting updates.'}
                    </p>
                  ) : (
                    <div>
                      {scoutStatus === 'no_scout' && (
                        <p style={{ color: 'var(--muted)', marginBottom: 12, fontSize: 12 }}>
                          Demo scout tips (Scout could not be created — check Yutori API key and billing).
                        </p>
                      )}
                      {scoutUpdates.map((u, i) => (
                        <div
                          key={i}
                          style={{
                            borderBottom: '1px solid var(--muted)',
                            padding: '8px 0',
                          }}
                        >
                          <a
                            href={u.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: 'var(--blue)',
                              fontWeight: 700,
                              fontSize: 10,
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                              textDecoration: 'none',
                            }}
                          >
                            {u.title || 'Update'}
                          </a>
                          {u.summary && (
                            <div style={{ marginTop: 4, fontSize: 13, fontWeight: 500 }}>
                              {u.summary}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Secondary: Company Insights (collapsible) */}
            <div
              style={{
                border: '3px solid var(--fg)',
                background: 'var(--white)',
                boxShadow: 'var(--sh4)',
                marginTop: 16,
              }}
            >
              <button
                type="button"
                onClick={() => setCompanyBriefExpanded((e) => !e)}
                aria-expanded={companyBriefExpanded}
                data-cursor="hover"
                className="bauhaus-interactive w-full text-left flex justify-between items-center outline-none"
                style={{
                  padding: '12px 16px',
                  fontFamily: 'var(--f)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  borderBottom: companyBriefExpanded ? '2px solid var(--fg)' : 'none',
                  background: companyBriefExpanded ? 'var(--muted)' : 'var(--white)',
                }}
              >
                <span>Company Insights · Yutori</span>
                <span
                  style={{
                    transition: 'transform 200ms ease-out',
                    transform: companyBriefExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
              {companyBriefExpanded && (
                <div className="pop-in" style={{ padding: '16px', fontFamily: 'var(--f)' }}>
                  <p
                    style={{
                      fontSize: 13,
                      marginBottom: 12,
                      fontWeight: 500,
                    }}
                  >
                    Get role expectations and hints for {roleLabel} at {companyLabel}.
                  </p>
                  <button
                    type="button"
                    onClick={handleGetCompanyBrief}
                    disabled={briefLoading}
                    data-cursor="hover"
                    className="bauhaus-interactive outline-none disabled:opacity-60 font-bold"
                    style={{
                      fontFamily: 'var(--f)',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      padding: '10px 20px',
                      borderRadius: 0,
                      border: '3px solid var(--fg)',
                      background: 'var(--yellow)',
                      color: 'var(--fg)',
                      boxShadow: 'var(--sh4)',
                      minHeight: 44,
                    }}
                  >
                    {briefLoading ? 'Loading…' : 'Get company expectations'}
                  </button>
                  {companyBrief && (
                    <div style={{ marginTop: 12, fontSize: 13 }}>
                      {companyBrief.expectations.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div
                            style={{
                              fontFamily: 'var(--f)',
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: '0.16em',
                              textTransform: 'uppercase',
                            }}
                          >
                            Expectations
                          </div>
                          <ul className="list-disc pl-5 space-y-1">
                            {companyBrief.expectations.slice(0, 3).map((e, i) => (
                              <li key={i} className="break-words">
                                {e}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {companyBrief.hints.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div
                            style={{
                              fontFamily: 'var(--f)',
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: '0.16em',
                              textTransform: 'uppercase',
                            }}
                          >
                            Hints
                          </div>
                          <ul className="list-disc pl-5 space-y-1">
                            {companyBrief.hints.slice(0, 3).map((h, i) => (
                              <li key={i} className="break-words">
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {companyBrief.source_urls.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div
                            style={{
                              fontFamily: 'var(--f)',
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: '0.16em',
                              textTransform: 'uppercase',
                            }}
                          >
                            Sources
                          </div>
                          <ul className="list-none pl-0 space-y-1">
                            {companyBrief.source_urls.slice(0, 3).map((url, i) => (
                              <li key={i}>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: 'var(--blue)',
                                    fontWeight: 700,
                                    fontSize: 10,
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    textDecoration: 'underline',
                                  }}
                                >
                                  {url.slice(0, 50)}
                                  {url.length > 50 ? '…' : ''}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Neo4j context graph (collapsible) */}
            <div
              style={{
                border: '3px solid var(--fg)',
                background: 'var(--white)',
                boxShadow: 'var(--sh4)',
                marginTop: 16,
              }}
            >
              <button
                type="button"
                onClick={handleToggleGraph}
                aria-expanded={graphExpanded}
                data-cursor="hover"
                className="bauhaus-interactive w-full text-left flex justify-between items-center outline-none"
                style={{
                  padding: '12px 16px',
                  fontFamily: 'var(--f)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  borderBottom: graphExpanded ? '2px solid var(--fg)' : 'none',
                  background: graphExpanded ? 'var(--muted)' : 'var(--white)',
                }}
              >
                <span>Neo4j context graph</span>
                <span
                  style={{
                    transition: 'transform 200ms ease-out',
                    transform: graphExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
              {graphExpanded && (
                <div className="pop-in" style={{ padding: '16px', fontFamily: 'var(--f)', fontSize: 13 }}>
                  {graphLoading ? (
                    <p>Loading graph…</p>
                  ) : graphData && (graphData.nodes.length > 0 || graphData.edges.length > 0) ? (
                    <div>
                      <p style={{ marginBottom: 12, fontWeight: 600 }}>
                        Session <code style={{ background: 'var(--muted)', padding: '2px 6px' }}>{graphData.session_id}</code>{' '}
                        — {graphData.nodes.length} nodes, {graphData.edges.length} edges
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {graphData.nodes.map((n) => (
                          <div
                            key={n.id}
                            style={{
                              border: '2px solid var(--fg)',
                              padding: '10px 12px',
                              background: n.type === 'Session' ? 'var(--yellow)' : n.type === 'Answer' ? 'var(--white)' : 'var(--muted)',
                            }}
                          >
                            <span style={{ fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                              {n.type}
                            </span>
                            <div style={{ marginTop: 4 }}>
                              {n.type === 'Session' && (n.role || n.company) && (
                                <span>{[n.role, n.company].filter(Boolean).join(' · ')}</span>
                              )}
                              {n.type === 'Answer' && (
                                <span>Q{n.question_number}: {(n.transcript_preview ?? '').slice(0, 60)}{(n.transcript_preview?.length ?? 0) > 60 ? '…' : ''}</span>
                              )}
                              {n.type === 'Entity' && <span>{n.label}: {n.text}</span>}
                              {n.type === 'Decision' && <span>{n.next_question_preview}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)' }}>
                        Relationships: {[...new Set(graphData.edges.map((e) => e.type))].join(', ')}
                      </div>
                    </div>
                  ) : graphData?.neo4j_configured === false ? (
                    <p>
                      Neo4j is not configured. Set <code style={{ background: 'var(--muted)', padding: '2px 4px' }}>NEO4J_URI</code>,{' '}
                      <code style={{ background: 'var(--muted)', padding: '2px 4px' }}>NEO4J_USERNAME</code>, and{' '}
                      <code style={{ background: 'var(--muted)', padding: '2px 4px' }}>NEO4J_PASSWORD</code> in <code style={{ background: 'var(--muted)', padding: '2px 4px' }}>backend/.env</code> to persist and view the context graph.
                    </p>
                  ) : (
                    <p>
                      No graph data yet. Submit at least one answer (or use Demo answer) to see the context graph (Session → Answer → Entity / Decision) in Neo4j.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* GLiNER Competency Map + Fastino debug */}
            {(phase === 'interview' || phase === 'complete') && extractedEntities.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                }}
              >
                <CompetencyMap entities={extractedEntities} />
                {/* Fastino / GLiNER debug strip for judges */}
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 10px',
                    border: '3px solid var(--fg)',
                    background: 'var(--bg)',
                    fontFamily: 'var(--f)',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>GLiNER Entities → Fastino ingest</span>
                  <span>
                    TECH: {extractedEntities.filter((e) => e.label === 'TECHNICAL_SKILL').length}
                  </span>
                  <span>
                    SOFT: {extractedEntities.filter((e) => e.label === 'SOFT_SKILL').length}
                  </span>
                  <span>
                    FRAMEWORK: {extractedEntities.filter((e) => e.label === 'FRAMEWORK').length}
                  </span>
                </div>
              </div>
            )}
            {/* Action buttons */}
            <div className="flex justify-end gap-2 flex-wrap">
              <button
                ref={reportTriggerRef}
                type="button"
                onClick={handleViewReport}
                data-cursor="hover"
                className="bauhaus-interactive outline-none font-bold"
                style={{
                  fontFamily: 'var(--f)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '12px 24px',
                  borderRadius: 0,
                  border: '3px solid var(--fg)',
                  background: 'var(--white)',
                  color: 'var(--fg)',
                  boxShadow: 'var(--sh4)',
                  minHeight: 44,
                }}
              >
                View session report
              </button>
              <button
                ref={profileTriggerRef}
                type="button"
                onClick={handleViewProfile}
                data-cursor="hover"
                className="bauhaus-interactive outline-none font-bold"
                style={{
                  fontFamily: 'var(--f)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '12px 24px',
                  borderRadius: 0,
                  border: '3px solid var(--fg)',
                  background: 'var(--yellow)',
                  color: 'var(--fg)',
                  boxShadow: 'var(--sh4)',
                  minHeight: 44,
                }}
              >
                Your Profile
              </button>
              <button
                type="button"
                onClick={handleTriggerFinetune}
                disabled={finetuneLoading}
                data-cursor="hover"
                className="bauhaus-interactive outline-none font-bold"
                style={{
                  fontFamily: 'var(--f)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '12px 24px',
                  borderRadius: 0,
                  border: '3px solid var(--fg)',
                  background: 'var(--red)',
                  color: 'var(--white)',
                  boxShadow: 'var(--sh4)',
                  minHeight: 44,
                }}
              >
                {finetuneLoading ? 'Optimizing…' : 'Trigger Pioneer Optimization'}
              </button>
            </div>

            {/* Session report modal */}
            <Modal open={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Session Report" ariaLabel="Session report" loading={reportLoading} triggerRef={reportTriggerRef}>
              {sessionReport ? <ReportContent report={sessionReport} /> : null}
            </Modal>

            {/* Profile modal */}
            <Modal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} title="Profile (Fastino)" ariaLabel="User profile" loading={profileLoading} triggerRef={profileTriggerRef}>
              {userProfile ? (
                <div className="flex flex-col gap-4">
                  {userProfile.summary && <p className="break-words">{userProfile.summary}</p>}
                  {userProfile.strong_areas.length > 0 && <ReportSection title="Strong areas" color="var(--btc)" items={userProfile.strong_areas} />}
                  {userProfile.weak_areas.length > 0 && <ReportSection title="Areas to improve" color="#FCA5A5" items={userProfile.weak_areas} />}
                  {userProfile.recent_topics.length > 0 && <ReportSection title="Recent topics" color="var(--muted)" items={userProfile.recent_topics} />}
                  {userProfile.sample_snippets.length > 0 && <ReportSection title="Sample snippets" color="var(--muted)" items={userProfile.sample_snippets.slice(0, 3).map(s => s.slice(0, 120) + (s.length > 120 ? '…' : ''))} />}
                </div>
              ) : null}
            </Modal>

            {/* End session modal */}
            <Modal
              open={endModalOpen}
              onClose={() => {
                setEndModalOpen(false);
                resetToSetup();
              }}
              title="Session Complete"
              ariaLabel="Session end report"
              loading={endLoading}
            >
              {endReport ? (
                <div className="flex flex-col gap-4">
                  <ReportContent report={endReport} />
                  <button
                    type="button"
                    onClick={() => {
                      setEndModalOpen(false);
                      resetToSetup();
                    }}
                    data-cursor="hover"
                    className="bauhaus-interactive w-full outline-none mt-2"
                    style={{
                      fontFamily: 'var(--f)',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      padding: '12px 24px',
                      borderRadius: 0,
                      border: '3px solid var(--fg)',
                      background: 'var(--yellow)',
                      color: 'var(--fg)',
                      boxShadow: 'var(--sh4)',
                      minHeight: 44,
                    }}
                  >
                    Start New Session
                  </button>
                </div>
              ) : null}
            </Modal>
          </div>
        </main>
        </div>
      )}
    </>
  );
}

function ReportContent({ report }: { report: SessionFeedbackReport }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="break-words">{report.overall_trend}</p>
      {report.strengths.length > 0 && <ReportSection title="Strengths" color="var(--btc)" items={report.strengths} />}
      {report.focus_areas.length > 0 && <ReportSection title="Focus areas" color="var(--gold)" items={report.focus_areas} />}
      {report.suggested_next_steps.length > 0 && <ReportSection title="Suggested next steps" color="var(--muted)" items={report.suggested_next_steps} />}
      {report.fact_check_summary && (
        <div>
          <h3 style={{ fontFamily: 'var(--fm)', fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 6 }}>Yutori fact-check</h3>
          <p className="break-words">{report.fact_check_summary}</p>
          {report.disputed_claims && report.disputed_claims.length > 0 && (
            <>
              <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Claims to verify or cite:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                {report.disputed_claims.map((s, i) => <li key={i} className="break-words">{s}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ReportSection({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div>
      <h3 style={{ fontFamily: 'var(--fm)', fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color, marginBottom: 6 }}>{title}</h3>
      <ul className="list-disc pl-5 space-y-1">{items.map((s, i) => <li key={i} className="break-words">{s}</li>)}</ul>
    </div>
  );
}

export default App;
