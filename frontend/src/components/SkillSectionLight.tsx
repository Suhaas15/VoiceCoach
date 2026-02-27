export type ChipStatus = 'done' | 'weak' | 'next' | 'pending';

export interface SkillChipLight {
  label: string;
  status: ChipStatus;
}

const STATUS_STYLE: Record<ChipStatus, { bg: string; border: string; color: string }> = {
  done: { bg: 'rgba(247,147,26,0.1)', border: 'rgba(247,147,26,0.3)', color: 'var(--btc)' },
  weak: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', color: '#FCA5A5' },
  next: { bg: 'rgba(255,214,0,0.07)', border: 'rgba(255,214,0,0.22)', color: 'var(--gold)' },
  pending: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', color: 'var(--muted)' },
};

const STATUS_PREFIX: Record<ChipStatus, string> = {
  done: '✓',
  weak: '⚠',
  next: '→',
  pending: '○',
};

export function SkillSectionLight({ chips }: { chips: SkillChipLight[] }) {
  return (
    <div
      className="overflow-hidden shrink-0"
      style={{
        border: '3px solid var(--fg)',
        borderRadius: 0,
        background: 'var(--bg)',
      }}
      role="region"
      aria-label="Topic coverage"
    >
      <div style={{
        padding: '8px 14px',
        background: 'var(--red)',
        borderBottom: '3px solid var(--fg)',
        fontFamily: 'var(--f)', fontSize: 9, fontWeight: 700,
        letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--white)',
      }}>
        ◈ Fastino · Coverage
      </div>
      <div className="flex flex-wrap gap-[5px]" style={{ padding: '10px 14px' }}>
        {chips.map((c) => {
          const s = STATUS_STYLE[c.status];
          return (
            <span
              key={c.label}
              className="cursor-default transition-transform duration-200 hover:-translate-y-px"
              style={{
                fontFamily: 'var(--f)', fontSize: 9, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '4px 9px', borderRadius: 0,
                border: `2px solid ${s.border}`,
                background: s.bg, color: s.color,
              }}
            >
              {STATUS_PREFIX[c.status]} {c.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
