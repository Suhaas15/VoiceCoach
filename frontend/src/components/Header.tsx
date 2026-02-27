/** Legacy/alternate UI — not used in current App. */
interface HeaderProps {
  className?: string;
}

export function Header({ className = '' }: HeaderProps) {
  return (
    <header
      className={`flex flex-wrap items-center py-2 px-[var(--space-lg)] sm:px-6 lg:px-7 gap-2 sm:gap-4 bg-[rgba(26,22,48,0.9)] backdrop-blur-[20px] border-b border-[rgba(192,132,252,0.15)] min-h-[56px] sm:min-h-[70px] ${className}`}
    >
      <span className="text-lg sm:text-[22px] mr-0.5" aria-hidden>🎙️</span>
      <div
        className="font-['Fredoka_One',cursive] text-[var(--text-2xl)] sm:text-2xl bg-gradient-to-br from-[var(--accent2)] to-[var(--accent)] bg-clip-text text-transparent tracking-wide shrink-0"
        style={{ fontFamily: 'Fredoka One, cursive' }}
      >
        VoiceCoach AI
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2 ml-auto">
        <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[var(--text-xs)] font-bold uppercase tracking-wide bg-[rgba(250,204,21,0.15)] text-[var(--accent4)] border border-[rgba(250,204,21,0.3)]">
          🎵 Modulate
        </span>
        <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[var(--text-xs)] font-bold uppercase tracking-wide bg-[rgba(74,222,128,0.15)] text-[var(--green)] border border-[rgba(74,222,128,0.3)]">
          🤖 Yutori
        </span>
        <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[var(--text-xs)] font-bold uppercase tracking-wide bg-[rgba(192,132,252,0.15)] text-[var(--accent2)] border border-[rgba(192,132,252,0.3)]">
          🧠 Fastino
        </span>
      </div>
    </header>
  );
}
