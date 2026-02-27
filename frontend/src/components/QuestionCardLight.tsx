import { useState, useEffect, useRef } from 'react';

export function QuestionCardLight({
  question,
  difficulty = 'Medium',
  typeLabel = 'Behavioral · Leadership',
}: {
  question: string;
  difficulty?: string;
  typeLabel?: string;
}) {
  const [displayText, setDisplayText] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!question) {
      setDisplayText('');
      return;
    }
    setDisplayText('');
    let index = 0;
    const id = setInterval(() => {
      index += 1;
      setDisplayText((prev) => {
        const next = question.slice(0, Math.min(question.length, prev.length + 1));
        return next;
      });
      if (index >= question.length) {
        clearInterval(id);
        intervalRef.current = null;
      }
    }, 28);
    intervalRef.current = id;
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [question]);

  return (
    <div
      className="relative min-w-0"
      style={{
        background: 'var(--white)',
        borderRadius: 0,
        border: '4px solid var(--fg)',
        padding: '28px 28px 24px',
        overflow: 'visible',
        boxShadow: 'var(--sh8)',
      }}
      role="region"
      aria-label={question ? `Current question: ${question}` : 'Current question'}
    >
      {/* Meta badges */}
      <div className="flex items-center gap-[7px] mb-3.5 flex-wrap">
        <QBadge bg="var(--blue)" border="var(--fg)" color="var(--white)">
          {typeLabel.split('·')[0]?.trim() || 'Behavioral'}
        </QBadge>
        <QBadge bg="var(--yellow)" border="var(--fg)" color="var(--fg)">
          {typeLabel.split('·')[1]?.trim() || 'Leadership'}
        </QBadge>
        <QBadge bg="var(--muted)" border="var(--fg)" color="var(--fg)">
          {difficulty}
        </QBadge>
      </div>

      {/* Question text — typewriter + wrap so text never overflows */}
      <p
        className="min-w-0 break-words"
        style={{
          fontFamily: 'var(--f)',
          fontSize: 22,
          fontWeight: 900,
          lineHeight: 1.3,
          color: 'var(--fg)',
          letterSpacing: '0.01em',
          textTransform: 'uppercase',
          position: 'relative',
          zIndex: 1,
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        }}
        aria-label={question}
      >
        {displayText || question}
        {displayText.length < question.length && question && (
          <span className="blink-cursor" aria-hidden />
        )}
      </p>

      {/* Corner decoration */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -8,
          right: -8,
          width: 16,
          height: 16,
          background: 'var(--red)',
          border: '2px solid var(--fg)',
        }}
      />

      {/* Geometric underline */}
      <div className="flex items-center gap-2 mt-3.5" aria-hidden>
        <div
          style={{ width: 12, height: 12, background: 'var(--red)', border: '2px solid var(--fg)' }}
        />
        <div style={{ flex: 1, height: 4, background: 'var(--fg)' }} />
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 9999,
            background: 'var(--yellow)',
            border: '2px solid var(--fg)',
          }}
        />
        <div style={{ maxWidth: 60, height: 4, background: 'var(--fg)' }} />
        <div
          style={{ width: 12, height: 12, background: 'var(--blue)', border: '2px solid var(--fg)' }}
        />
      </div>
    </div>
  );
}

function QBadge({
  children,
  bg,
  border,
  color,
}: {
  children: React.ReactNode;
  bg: string;
  border: string;
  color: string;
}) {
  return (
    <span style={{
      fontFamily: 'var(--f)',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      padding: '4px 12px',
      borderRadius: 9999,
      border: `2px solid ${border}`,
      background: bg,
      color,
      boxShadow: 'var(--sh4)',
    }}>
      {children}
    </span>
  );
}
