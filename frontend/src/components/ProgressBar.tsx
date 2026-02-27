/** Legacy/alternate UI — not used in current App. */
interface ProgressBarProps {
  percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
  return (
    <div className="w-full h-[3px] bg-white/[0.05] rounded-[10px] overflow-hidden">
      <div
        className="h-full rounded-[10px] transition-[width] duration-300"
        style={{
          width: `${Math.min(100, percent)}%`,
          background: 'linear-gradient(90deg, var(--rose), var(--violet), var(--cyan))',
          backgroundSize: '200% 100%',
          animation: 'progShimmer 2s linear infinite',
        }}
      />
    </div>
  );
}
