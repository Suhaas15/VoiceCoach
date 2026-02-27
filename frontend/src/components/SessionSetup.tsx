import { useState } from 'react';

const LEVELS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'staff', label: 'Staff' },
  { value: 'principal', label: 'Principal / Director' },
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

interface SessionSetupProps {
  onStart: (config: {
    company: string;
    role: string;
    level: string;
    difficulty: string;
    jobDescription: string;
  }) => void;
  loading: boolean;
}

export function SessionSetup({ onStart, loading }: SessionSetupProps) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [level, setLevel] = useState('mid');
  const [difficulty, setDifficulty] = useState('medium');
  const [jobDescription, setJobDescription] = useState('');

  const canSubmit = company.trim() && role.trim() && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onStart({
      company: company.trim(),
      role: role.trim(),
      level,
      difficulty,
      jobDescription: jobDescription.trim(),
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background shapes */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: -100,
          right: -80,
          width: 300,
          height: 300,
          borderRadius: 9999,
          background: 'var(--yellow)',
          opacity: 0.12,
          border: '3px solid var(--fg)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          bottom: 80,
          left: 40,
          width: 120,
          height: 120,
          borderRadius: 0,
          background: 'var(--blue)',
          opacity: 0.1,
          transform: 'rotate(20deg)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          bottom: 200,
          right: 60,
          width: 0,
          height: 0,
          borderLeft: '40px solid transparent',
          borderRight: '40px solid transparent',
          borderTop: '60px solid var(--red)',
          opacity: 0.08,
        }}
      />

      <div className="relative" style={{ zIndex: 1, width: '100%', maxWidth: 520 }}>
        {/* Header inside card */}
        <form
          onSubmit={handleSubmit}
          style={{
            position: 'relative',
            background: 'var(--white)',
            border: '4px solid var(--fg)',
            boxShadow: 'var(--sh8)',
            padding: '40px 36px',
            width: '100%',
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  background: 'var(--red)',
                  borderRadius: 0,
                }}
              />
              <div
                style={{
                  width: 20,
                  height: 20,
                  background: 'var(--yellow)',
                  borderRadius: 9999,
                }}
              />
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderBottom: '20px solid var(--blue)',
                }}
              />
            </div>
            <h1
              style={{
                fontFamily: 'var(--f)',
                fontWeight: 900,
                fontSize: 28,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              VOICECOACH
            </h1>
            <p
              style={{
                fontFamily: 'var(--f)',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.28em',
                color: '#64748B',
                marginTop: 4,
              }}
            >
              ARIA Intelligence · Secure Link Established
            </p>
          </div>

          {/* Form card */}
          <div className="flex flex-col gap-5">
            {/* Company */}
            <Field label="Company" required>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google, Stripe, Meta"
                style={fieldInputStyle}
              />
            </Field>

            {/* Position */}
            <Field label="Position" required>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Product Manager, Software Engineer"
                style={fieldInputStyle}
              />
            </Field>

            {/* Level + Difficulty row */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Level">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  style={fieldInputStyle}
                >
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Difficulty">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={fieldInputStyle}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Job Description */}
            <Field label="Job Description" hint="Optional — paste from a job posting for tailored questions">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here to get role-specific questions..."
                rows={5}
                style={{
                  ...fieldInputStyle,
                  height: 100,
                  paddingTop: 12,
                  paddingBottom: 12,
                  resize: 'vertical' as const,
                }}
              />
            </Field>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            data-cursor="hover"
            className="w-full mt-4 bauhaus-interactive outline-none disabled:opacity-40 disabled:cursor-not-allowed font-bold"
            style={{
              fontFamily: 'var(--f)',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              width: '100%',
              height: 52,
              borderRadius: 0,
              border: '3px solid var(--fg)',
              background: 'var(--red)',
              color: '#FFFFFF',
              boxShadow: 'var(--sh6)',
              minHeight: 44,
            }}
          >
            {loading ? 'INITIALIZING…' : 'Begin Assessment'}
          </button>
        </form>
      </div>
    </div>
  );
}

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  background: 'var(--white)',
  border: '2px solid var(--fg)',
  borderRadius: 0,
  padding: '0 14px',
  fontFamily: 'var(--f)',
  fontSize: 14,
  fontWeight: 500,
  boxShadow: 'none',
  outline: 'none',
  transition: 'box-shadow 200ms, border-color 200ms',
};

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5">
        <span style={{
          fontFamily: 'var(--fm)', fontSize: 'var(--text-xs)', fontWeight: 600,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--muted)',
        }}>
          {label}
        </span>
        {required && (
          <span style={{ color: 'var(--btc)', fontSize: 'var(--text-sm)', fontWeight: 800 }}>*</span>
        )}
      </span>
      {hint && (
        <span style={{
          fontFamily: 'var(--fm)', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.02em',
        }}>
          {hint}
        </span>
      )}
      {children}
    </label>
  );
}
