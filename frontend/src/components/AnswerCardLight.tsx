import { useRef } from 'react';

export function AnswerCardLight({
  transcript,
  placeholder,
  factCheck,
  recording,
  recordSeconds,
  statusText,
  hintText,
  processing,
  onStartRecord,
  onStopRecord,
  onRecorded,
  onError,
}: {
  transcript: string;
  placeholder: string;
  factCheck: { correct: boolean; text: string } | null;
  recording: boolean;
  recordSeconds: number;
  statusText: string;
  hintText: string;
  processing: boolean;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onRecorded: (blob: Blob, durationSeconds: number) => void;
  onError?: (message: string) => void;
}) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const duration = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
        onRecorded(blob, duration);
      };
      mr.start(200);
      mediaRecorderRef.current = mr;
      onStartRecord();
    } catch (e) {
      console.error('Mic access failed', e);
      onError?.('Microphone access denied. Allow mic in browser settings and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    onStopRecord();
  };

  const toggleRec = () => {
    if (recording) stopRecording();
    else startRecording();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div
      className="flex flex-col gap-3 min-w-0"
      style={{
        background: 'var(--bg)',
        border: '4px solid var(--fg)',
        borderRadius: 0,
        padding: '22px 24px',
        boxShadow: 'var(--sh4)',
      }}
      role="region"
      aria-label="Your answer"
    >
      {/* Header label */}
      <div
        className="flex items-center gap-2.5"
        style={{
          fontFamily: 'var(--f)',
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--fg)',
          opacity: 0.5,
        }}
      >
        Your Answer
        <span
          style={{
            flex: 1,
            height: 2,
            background: 'var(--fg)',
            opacity: 0.12,
          }}
        />
      </div>

      {/* Text box */}
      <div
        className="min-w-0 break-words"
        style={{
          background: 'var(--white)',
          border: '3px solid var(--fg)',
          padding: '14px 16px',
          minHeight: 90,
          fontFamily: 'var(--f)',
          fontSize: 14,
          lineHeight: 1.6,
          fontWeight: 500,
          color: 'var(--fg)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: recording ? '4px 4px 0 0 var(--blue)' : 'none',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        }}
      >
        {!transcript && !recording ? (
          <span style={{ color: '#888888', fontStyle: 'italic', fontSize: 13 }}>
            {placeholder}
          </span>
        ) : (
          <span className="break-words">{transcript}</span>
        )}
      </div>

      {/* Fact check: only show when we actually ran a check (not deferred to report) */}
      {factCheck && factCheck.text !== 'Fact-check in session report' && (
        <span
          className="inline-flex items-center gap-1.5 pop-in"
          style={{
            fontFamily: 'var(--f)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '5px 14px',
            borderRadius: 9999,
            border: '2px solid var(--fg)',
            background: factCheck.correct ? 'var(--yellow)' : 'var(--red)',
            color: factCheck.correct ? 'var(--fg)' : '#FFFFFF',
            boxShadow: 'var(--sh-sm)',
          }}
        >
          {factCheck.correct ? '✓ YUTORI VERIFIED' : '✗ CLAIM DISPUTED'}
        </span>
      )}

      {/* Record row */}
      <div className="flex items-center gap-3.5">
        {/* Record button */}
        <button
          type="button"
          onClick={toggleRec}
          disabled={processing}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
          aria-pressed={recording}
          data-cursor="hover"
          className="relative shrink-0 flex items-center justify-center outline-none bauhaus-interactive disabled:opacity-70"
          style={{
            width: 64,
            height: 64,
            borderRadius: 0,
            border: '4px solid var(--fg)',
            background: processing ? 'var(--muted)' : recording ? 'var(--blue)' : 'var(--red)',
            color: 'var(--white)',
            fontSize: 24,
            boxShadow: 'var(--sh6)',
            animation: recording ? 'recordPulse 1s ease-in-out infinite' : undefined,
            cursor: processing ? 'not-allowed' : 'pointer',
            minWidth: 44,
            minHeight: 44,
          }}
        >
          {processing ? '⟳' : recording ? '⏹' : '🎙'}
        </button>

        {/* Info */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div
            style={{
              fontFamily: 'var(--f)',
              fontSize: 14,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--fg)',
            }}
          >
            {statusText}
          </div>
          <div
            style={{
              fontFamily: 'var(--f)',
              fontSize: 11,
              fontWeight: 500,
              color: 'rgba(18,18,18,0.5)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {hintText}
          </div>
          {recording && (
            <div
              style={{
                fontFamily: 'var(--f)',
                fontSize: 13,
                fontWeight: 900,
                color: 'var(--blue)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatTime(recordSeconds)}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
