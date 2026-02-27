/** Legacy/alternate UI — not used in current App. */
import { useRef, useState } from 'react';

interface AnswerAreaProps {
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
  onDemoAnswer: () => void;
}

export function AnswerArea({
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
  onDemoAnswer,
}: AnswerAreaProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartSecondsRef = useRef(0);

  const handleRecordClick = async () => {
    if (processing) return;
    if (recording) {
      const duration = Math.max(1, Math.floor(Date.now() / 1000 - recordStartSecondsRef.current));
      const rec = recorderRef.current;
      stream?.getTracks().forEach((t) => t.stop());
      setStream(null);
      onStopRecord();
      if (rec) {
        rec.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: rec.mimeType });
          if (blob.size > 0) onRecorded(blob, duration);
        };
        rec.stop();
      }
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(s);
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const rec = new MediaRecorder(s, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorderRef.current = rec;
      rec.start();
      recordStartSecondsRef.current = Math.floor(Date.now() / 1000);
      onStartRecord();
    } catch (err) {
      console.error(err);
      onStartRecord(); // still start timer for demo
    }
  };

  const m = Math.floor(recordSeconds / 60);
  const sec = recordSeconds % 60;
  const timerStr = `⏱ ${m}:${sec.toString().padStart(2, '0')}`;

  return (
    <div className="rounded-[24px] border border-[var(--glassBorder)] bg-[var(--card)] p-6 flex flex-col gap-4">
      <div className="text-[0.62rem] font-bold uppercase tracking-widest text-[var(--muted)]" style={{ fontFamily: 'Syne, sans-serif' }}>
        Your Answer
      </div>
      <div
        className={`min-h-[100px] rounded-[14px] border px-4 py-4 text-[0.88rem] leading-relaxed text-[var(--text)] transition-colors ${
          recording ? 'border-[rgba(255,77,141,.3)]' : 'border-white/[0.05]'
        }`}
        style={{ background: 'rgba(0,0,0,.25)' }}
      >
        {transcript ? (
          <span>{transcript}</span>
        ) : (
          <span className="text-[var(--muted)] italic text-[0.85rem]">{placeholder}</span>
        )}
      </div>
      {factCheck && (
        <div
          className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-[20px] text-[0.68rem] font-bold ${
            factCheck.correct
              ? 'bg-[rgba(0,229,160,.1)] text-[var(--mint)] border border-[rgba(0,229,160,.25)]'
              : 'bg-[rgba(255,77,141,.1)] text-[var(--rose)] border border-[rgba(255,77,141,.25)]'
          }`}
          style={{ animation: 'slideUp 0.5s cubic-bezier(.34,1.56,.64,1) both' }}
        >
          {factCheck.correct ? '✅' : '❌'} {factCheck.text}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleRecordClick}
            disabled={processing}
            className={`relative w-[62px] h-[62px] rounded-full border-0 flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-200 hover:scale-[1.12] active:scale-95 ${
              recording
                ? 'bg-gradient-to-br from-red-500 to-red-800 shadow-[0_4px_24px_rgba(239,68,68,.5)] animate-[recPulse_1.2s_ease-in-out_infinite]'
                : 'bg-gradient-to-br from-[var(--rose)] to-[#c0368d] shadow-[0_4px_24px_rgba(255,77,141,.4)]'
            }`}
          >
            {recording ? (
              <>
                <span className="absolute -inset-2 rounded-full border-2 border-red-500/40 animate-[recRing_1.2s_ease-in-out_infinite]" />
                ⏹️
              </>
            ) : (
              '🎙️'
            )}
          </button>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="text-[0.88rem] font-bold text-[var(--text)] truncate" style={{ fontFamily: 'Syne, sans-serif' }}>{statusText}</div>
            <div className="text-[0.75rem] text-[var(--muted)] line-clamp-2">{hintText}</div>
            {(recording || recordSeconds > 0) && (
              <div className="text-[0.8rem] font-bold text-[var(--rose)] tabular-nums">
                {timerStr}
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onDemoAnswer}
          disabled={processing || recording}
          className="ml-auto py-2.5 px-5 rounded-[30px] border border-[rgba(139,92,246,.25)] bg-[rgba(139,92,246,.12)] text-[var(--violet)] font-bold text-[0.75rem] tracking-wide transition-all duration-200 hover:bg-[rgba(139,92,246,.22)] hover:border-[rgba(139,92,246,.5)] hover:-translate-y-0.5 hover:scale-[1.03] disabled:opacity-50"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          ▶ Run Demo
        </button>
      </div>
    </div>
  );
}
