/** Legacy/alternate UI — not used in current App. VoiceCoach v2 — nav with wordmark + sponsor pills */
export function Nav() {
  return (
    <nav className="flex items-center gap-6 py-5 border-b border-[var(--glassBorder)] mb-8">
      <div
        className="font-['Syne',sans-serif] font-extrabold text-[1.3rem] tracking-tight bg-gradient-to-br from-[var(--rose)] to-[var(--violet)] bg-clip-text text-transparent"
        style={{ fontFamily: 'Syne, sans-serif' }}
      >
        Voice<span className="font-normal opacity-70">Coach</span>
      </div>
      <div className="hidden sm:flex gap-2 ml-auto">
        <div
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-[20px] text-[0.7rem] font-semibold uppercase tracking-wide border border-[rgba(255,184,48,.25)] bg-[rgba(255,184,48,.07)] text-[var(--amber)]"
          style={{ animation: 'pillIn 0.6s cubic-bezier(.34,1.56,.64,1) both' }}
        >
          <i className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] block shadow-[0_0_6px_var(--amber)]" />
          Modulate
        </div>
        <div
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-[20px] text-[0.7rem] font-semibold uppercase tracking-wide border border-[rgba(0,229,160,.25)] bg-[rgba(0,229,160,.07)] text-[var(--mint)]"
          style={{ animation: 'pillIn 0.6s cubic-bezier(.34,1.56,.64,1) 0.1s both' }}
        >
          <i className="w-1.5 h-1.5 rounded-full bg-[var(--mint)] block shadow-[0_0_6px_var(--mint)]" />
          Yutori
        </div>
        <div
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-[20px] text-[0.7rem] font-semibold uppercase tracking-wide border border-[rgba(139,92,246,.25)] bg-[rgba(139,92,246,.07)] text-[var(--violet)]"
          style={{ animation: 'pillIn 0.6s cubic-bezier(.34,1.56,.64,1) 0.2s both' }}
        >
          <i className="w-1.5 h-1.5 rounded-full bg-[var(--violet)] block shadow-[0_0_6px_var(--violet)]" />
          Fastino
        </div>
      </div>
    </nav>
  );
}
