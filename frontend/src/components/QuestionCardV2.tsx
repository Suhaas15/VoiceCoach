/** Legacy/alternate UI — not used in current App. */
interface QuestionCardV2Props {
  question: string;
  difficulty?: string;
  typeLabel?: string;
}

export function QuestionCardV2({
  question,
  difficulty = 'Medium',
  typeLabel = 'Behavioral · Leadership',
}: QuestionCardV2Props) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[var(--glassBorder)] bg-[var(--card)] p-7">
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: 'linear-gradient(90deg, var(--rose), var(--violet), var(--cyan))',
          backgroundSize: '200% 100%',
          animation: 'progShimmer 3s linear infinite',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none rounded-[24px]"
        style={{
          background: 'radial-gradient(ellipse at 0% 0%, rgba(139,92,246,.08) 0%, transparent 60%)',
        }}
      />
      <div className="relative z-10 flex flex-wrap items-center gap-2 mb-3.5 text-[0.62rem] font-bold uppercase tracking-widest text-[var(--violet)]" style={{ fontFamily: 'Syne, sans-serif' }}>
        <span>Current Question</span>
        <span
          className="ml-auto py-1 px-2.5 rounded-[10px] text-[0.62rem] font-bold bg-[rgba(255,184,48,.1)] text-[var(--amber)] border border-[rgba(255,184,48,.2)]"
        >
          🔥 {difficulty}
        </span>
      </div>
      <div
        className="relative z-10 text-[1.25rem] font-bold leading-snug text-[var(--text)] tracking-tight"
        style={{ fontFamily: 'Syne, sans-serif' }}
      >
        {question}
      </div>
      <span className="inline-flex items-center gap-1.5 mt-4 py-1.5 px-3.5 rounded-[20px] text-[0.68rem] font-semibold bg-[rgba(6,214,245,.08)] text-[var(--cyan)] border border-[rgba(6,214,245,.2)]">
        💬 {typeLabel}
      </span>
    </div>
  );
}
