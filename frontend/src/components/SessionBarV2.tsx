/** Legacy/alternate UI — not used in current App. */
interface SessionBarV2Props {
  questionNumber: number;
  totalQuestions?: number;
}

export function SessionBarV2({ questionNumber, totalQuestions = 2 }: SessionBarV2Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 py-1.5 px-3.5 rounded-[20px] bg-[rgba(0,229,160,.08)] border border-[rgba(0,229,160,.2)] text-[0.7rem] font-bold text-[var(--mint)] uppercase tracking-wide">
        <span
          className="w-[7px] h-[7px] rounded-full bg-[var(--mint)]"
          style={{ boxShadow: '0 0 0 0 rgba(0,229,160,.5)', animation: 'livePulse 1.6s ease-in-out infinite' }}
        />
        Live Session
      </div>
      <div className="py-1.5 px-3.5 rounded-[20px] bg-[rgba(255,77,141,.08)] border border-[rgba(255,77,141,.2)] text-[0.7rem] font-bold text-[var(--rose)] tracking-wide">
        🏢 Staff PM · Google
      </div>
      <div className="ml-auto text-[0.78rem] text-[var(--muted)] font-medium tabular-nums">
        Question {questionNumber} / {totalQuestions}
      </div>
    </div>
  );
}
