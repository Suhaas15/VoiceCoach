/** Legacy/alternate UI — not used in current App. */
export interface SkillChip {
  label: string;
  status: 'done' | 'weak' | 'next' | 'pending';
}

interface SkillChipsProps {
  chips: SkillChip[];
}

export function SkillChips({ chips }: SkillChipsProps) {
  const classMap = {
    done: 'bg-[rgba(0,229,160,.09)] text-[var(--mint)] border-[rgba(0,229,160,.2)]',
    weak: 'bg-[rgba(255,77,141,.09)] text-[var(--rose)] border-[rgba(255,77,141,.2)]',
    next: 'bg-[rgba(6,214,245,.09)] text-[var(--cyan)] border-[rgba(6,214,245,.2)]',
    pending: 'bg-white/[0.04] text-[var(--muted)] border-white/[0.07]',
  };
  const prefix = { done: '✅', weak: '⚠️', next: '🎯', pending: '⏳' };
  return (
    <div className="rounded-[20px] border border-[var(--glassBorder)] bg-[var(--card)] p-5 px-6">
      <div className="text-[0.62rem] font-bold uppercase tracking-widest text-[var(--muted)] mb-4 flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
        <span>🧠</span> Fastino Memory — Topic Coverage
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <span
            key={c.label}
            className={`py-1.5 px-3.5 rounded-[20px] text-[0.72rem] font-semibold flex items-center gap-1.5 border cursor-default transition-transform hover:scale-105 ${classMap[c.status]}`}
          >
            {prefix[c.status]} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
