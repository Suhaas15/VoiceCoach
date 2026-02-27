/** Legacy/alternate UI — not used in current App. */
interface MetricsRowProps {
  overallScore: number;
  factAccuracyPct: number;
  vsLastSession?: number;
}

export function MetricsRow({
  overallScore,
  factAccuracyPct,
  vsLastSession = 0,
}: MetricsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <div
        className="rounded-[20px] border border-[var(--glassBorder)] bg-[var(--card)] p-5 flex flex-col gap-2 relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-white/[0.14]"
        style={{ ['--mglow' as string]: 'rgba(139,92,246,.12)' }}
      >
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none rounded-[20px]" style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--mglow, 0.1) 0%, transparent 70%)' }} />
        <span className="text-[1.6rem]">🎯</span>
        <div className="text-[2rem] font-extrabold leading-none tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--violet)' }}>
          {overallScore}
        </div>
        <div className="text-[0.68rem] font-semibold text-[var(--muted)] uppercase tracking-wider">
          Overall Score
        </div>
        <div className="h-[3px] bg-white/[0.05] rounded-[10px] overflow-hidden mt-1">
          <div className="h-full rounded-[10px] transition-[width] duration-500" style={{ width: `${overallScore}%`, background: 'linear-gradient(90deg, var(--violet), var(--rose))' }} />
        </div>
      </div>
      <div
        className="rounded-[20px] border border-[var(--glassBorder)] bg-[var(--card)] p-5 flex flex-col gap-2 relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-white/[0.14]"
        style={{ ['--mglow' as string]: 'rgba(0,229,160,.1)' }}
      >
        <span className="text-[1.6rem]">✅</span>
        <div className="text-[2rem] font-extrabold leading-none tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--mint)' }}>
          {Math.round(factAccuracyPct)}%
        </div>
        <div className="text-[0.68rem] font-semibold text-[var(--muted)] uppercase tracking-wider">
          Fact Accuracy
        </div>
        <div className="h-[3px] bg-white/[0.05] rounded-[10px] overflow-hidden mt-1">
          <div className="h-full rounded-[10px] transition-[width] duration-500" style={{ width: `${factAccuracyPct}%`, background: 'linear-gradient(90deg, var(--mint), var(--cyan))' }} />
        </div>
      </div>
      <div
        className="rounded-[20px] border border-[var(--glassBorder)] bg-[var(--card)] p-5 flex flex-col gap-2 relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-white/[0.14] sm:col-span-2 md:col-span-1"
        style={{ ['--mglow' as string]: 'rgba(255,184,48,.1)' }}
      >
        <span className="text-[1.6rem]">📈</span>
        <div className="text-[2rem] font-extrabold leading-none tracking-tight" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--amber)' }}>
          {vsLastSession >= 0 ? '+' : ''}{vsLastSession}
        </div>
        <div className="text-[0.68rem] font-semibold text-[var(--muted)] uppercase tracking-wider">
          vs Last Session
        </div>
        <div className="h-[3px] bg-white/[0.05] rounded-[10px] overflow-hidden mt-1">
          <div className="h-full rounded-[10px] transition-[width] duration-500" style={{ width: `${Math.min(100, 55)}%`, background: 'linear-gradient(90deg, var(--amber), var(--rose))' }} />
        </div>
      </div>
    </div>
  );
}
