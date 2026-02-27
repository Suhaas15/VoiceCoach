export function MetricsRowLight({
  overallScore,
  factAccuracyPct,
  vsLastSession,
}: {
  overallScore: number;
  factAccuracyPct: number;
  vsLastSession: number;
}) {
  const deltaLabel = vsLastSession >= 0 ? `+${vsLastSession}` : `${vsLastSession}`;

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      role="region"
      aria-label="Session metrics"
    >
      <StatCard
        label="Overall Score"
        icon="🎯"
        iconBg="var(--yellow)"
        value={overallScore}
        valueColor="var(--red)"
        barColor="var(--red)"
        barWidth={overallScore}
        showBar
      />
      <StatCard
        label="Fact Accuracy"
        icon="⚡"
        iconBg="var(--blue)"
        value={factAccuracyPct}
        valueColor="var(--blue)"
        barColor="var(--blue)"
        barWidth={factAccuracyPct}
        showBar
      />
      <StatCard
        label="vs Last Session"
        icon="📈"
        iconBg="var(--red)"
        value={deltaLabel}
        valueColor="var(--fg)"
        barColor="var(--fg)"
        barWidth={Math.min(100, Math.max(0, 50 + vsLastSession))}
      />
    </div>
  );
}

function StatCard({
  label,
  icon,
  iconBg,
  value,
  valueColor,
  barWidth,
  barColor,
  showBar,
}: {
  label: string;
  icon: string;
  iconBg: string;
  value: number | string;
  valueColor: string;
  barWidth: number;
  barColor: string;
  showBar?: boolean;
}) {
  return (
    <div
      className="relative overflow-visible cursor-default"
      style={{
        padding: '20px 18px 16px',
        border: '4px solid var(--fg)',
        borderRadius: 0,
        background: 'var(--white)',
        boxShadow: 'var(--sh6)',
      }}
    >
      {/* Floating icon blob */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -14,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 28,
          height: 28,
          borderRadius: 9999,
          border: '2px solid var(--fg)',
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          boxShadow: 'var(--sh-sm)',
        }}
      >
        {icon}
      </div>
      <div style={{
        fontFamily: 'var(--f)', fontSize: 9, fontWeight: 700,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'var(--fg)', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--f)',
        fontSize: 32,
        fontWeight: 900,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        color: valueColor,
      }}>
        {typeof value === 'number' && label !== 'vs Last Session' ? `${value}` : value}
      </div>
      <div
        style={{
          fontFamily: 'var(--f)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(18,18,18,0.5)',
          marginTop: 5,
        }}
      >
        {label}
      </div>
      {showBar && (
        <div
          style={{
            marginTop: 10,
            height: 7,
            background: 'var(--muted)',
            border: '2px solid var(--fg)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.max(0, Math.min(100, barWidth))}%`,
              background: barColor,
              transition: 'width 1.2s ease-out',
            }}
          />
        </div>
      )}
    </div>
  );
}
