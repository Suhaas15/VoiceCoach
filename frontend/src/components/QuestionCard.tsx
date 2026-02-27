/** Legacy/alternate UI — not used in current App. */
interface QuestionCardProps {
  question: string;
  questionNumber?: number;
  difficulty?: string;
  typeLabel?: string;
}

export function QuestionCard({
  question,
  difficulty = 'Medium',
  typeLabel = 'Behavioral · Leadership',
}: QuestionCardProps) {
  return (
    <div className="bg-[var(--card2)] rounded-[var(--radius-xl)] sm:rounded-[20px] p-[var(--space-lg)] sm:p-6 border border-[rgba(192,132,252,0.15)] relative overflow-hidden min-h-0">
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[var(--radius-xl)] sm:rounded-t-[20px]"
        style={{
          background: 'linear-gradient(90deg, var(--accent), var(--accent2), var(--accent3))',
        }}
      />
      <div className="text-[var(--text-xs)] font-extrabold uppercase tracking-[2px] text-[var(--accent2)] mb-2 sm:mb-3 flex flex-wrap items-center gap-2">
        <span>📋 Current Question</span>
        <span className="ml-auto text-[var(--text-xs)] text-[var(--muted)] font-semibold">
          Difficulty: {difficulty} 🔥
        </span>
      </div>
      <div
        className="text-[var(--text-lg)] sm:text-xl font-extrabold leading-snug text-[var(--text)] tracking-wide break-words"
        style={{ fontFamily: 'Fredoka One, cursive' }}
      >
        {question}
      </div>
      <span className="inline-block mt-2 sm:mt-3 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[var(--text-xs)] font-bold bg-[rgba(103,232,249,0.1)] text-[var(--accent3)] border border-[rgba(103,232,249,0.2)]">
        💬 {typeLabel}
      </span>
    </div>
  );
}
