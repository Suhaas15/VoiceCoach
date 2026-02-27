interface FeedbackCardLightProps {
  visible: boolean;
  feedbackText: string;
  coachTone?: string;
  voicePacingScore?: number | null;
  voiceCoachingTip?: string | null;
}

export function FeedbackCardLight({
  visible,
  feedbackText,
  coachTone,
  voicePacingScore,
  voiceCoachingTip,
}: FeedbackCardLightProps) {
  if (!visible) return null;

  return (
    <div className="pop-in" style={{ display: visible ? 'block' : 'none' }}>
      <div
        className="overflow-hidden min-w-0"
        style={{
          background: 'var(--white)',
          borderRadius: 0,
          border: '4px solid var(--fg)',
          boxShadow: 'var(--sh6)',
        }}
        role="alert"
      >
        {/* Header strip */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '10px 18px',
            background: 'var(--fg)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--f)',
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--yellow)',
            }}
          >
            ARIA FEEDBACK
          </div>
          <div
            style={{
              fontFamily: 'var(--f)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            {coachTone || ''}
          </div>
        </div>

        {/* Body */}
        <div
          className="break-words"
          style={{
            padding: '18px 20px',
            fontFamily: 'var(--f)',
            fontSize: 13.5,
            fontWeight: 500,
            lineHeight: 1.65,
            color: 'var(--fg)',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          {feedbackText}
        </div>

        {/* Voice pacing strip */}
        {(voicePacingScore != null || voiceCoachingTip) && (
          <div
            style={{
              borderTop: '2px solid var(--muted)',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {/* Pacing score */}
            {voicePacingScore != null && (
              <div>
                <div
                  style={{
                    fontFamily: 'var(--f)',
                    fontSize: 22,
                    fontWeight: 900,
                    color: 'var(--fg)',
                  }}
                >
                  {voicePacingScore}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--f)',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(18,18,18,0.5)',
                  }}
                >
                  Voice Pacing
                </div>
              </div>
            )}

            {/* Pacing bar */}
            {voicePacingScore != null && (
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: 'var(--muted)',
                  border: '2px solid var(--fg)',
                  position: 'relative',
                  overflow: 'hidden',
                  marginRight: 8,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(0, Math.min(100, voicePacingScore))}%`,
                    background: 'var(--blue)',
                    transition: 'width 800ms ease-out',
                  }}
                />
              </div>
            )}

            {/* Coaching tip */}
            {voiceCoachingTip && (
              <div
                style={{
                  fontFamily: 'var(--f)',
                  fontSize: 12,
                  fontWeight: 500,
                  fontStyle: 'italic',
                  flex: 1,
                }}
              >
                {voiceCoachingTip}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

