/** Legacy/alternate UI — not used in current App. */
import { AriaAvatar } from './AriaAvatar';

interface EmotionBar {
  label: string;
  value: number;
  color: string;
  gradient: string;
}

interface LeftPanelProps {
  ariaMessage: string;
  isAriaTalking: boolean;
  emotionBars: EmotionBar[];
  speakBarsIdle: boolean;
}

const SPEAK_BAR_STYLES = [
  { h: 14, spd: '0.5s', del: '0s' },
  { h: 24, spd: '0.4s', del: '0.1s' },
  { h: 28, spd: '0.6s', del: '0.05s' },
  { h: 20, spd: '0.45s', del: '0.15s' },
  { h: 30, spd: '0.55s', del: '0.2s' },
  { h: 18, spd: '0.35s', del: '0.08s' },
  { h: 22, spd: '0.5s', del: '0.12s' },
];

export function LeftPanel({
  ariaMessage,
  isAriaTalking,
  emotionBars,
  speakBarsIdle,
}: LeftPanelProps) {
  return (
    <div className="bg-[var(--card)] lg:border-r border-[rgba(192,132,252,0.1)] flex flex-col items-center py-[var(--space-xl)] px-[var(--space-md)] sm:py-7 sm:px-5 gap-[var(--space-md)] sm:gap-5 overflow-x-hidden overflow-y-auto relative w-full max-w-full lg:max-w-[380px]">
      <div
        className="absolute top-12 sm:top-[60px] w-[clamp(140px,40vw,260px)] h-[clamp(140px,40vw,260px)] left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(192,132,252,0.25) 0%, transparent 70%)',
          animation: 'pulseGlow 3s ease-in-out infinite',
        }}
      />
      <div className="absolute top-16 left-3 text-xs sm:text-sm pointer-events-none hidden sm:block" style={{ animation: 'floatSparkle 3.5s ease-in-out infinite', ['--sx' as string]: '6px', ['--sy' as string]: '-14px' }}>✨</div>
      <div className="absolute top-20 right-4 text-xs sm:text-sm pointer-events-none hidden sm:block" style={{ animation: 'floatSparkle 4s ease-in-out infinite 1s', ['--sx' as string]: '-8px', ['--sy' as string]: '-10px' }}>⭐</div>
      <div className="absolute top-36 left-2 text-xs pointer-events-none hidden sm:block" style={{ animation: 'floatSparkle 3s ease-in-out infinite 0.5s', ['--sx' as string]: '10px', ['--sy' as string]: '-8px' }}>💫</div>
      <div className="absolute top-40 right-2 text-xs pointer-events-none hidden sm:block" style={{ animation: 'floatSparkle 4.5s ease-in-out infinite 2s', ['--sx' as string]: '-6px', ['--sy' as string]: '-16px' }}>✨</div>

      <AriaAvatar isTalking={isAriaTalking} />

      <div
        className="rounded-[var(--radius-xl)] py-2 px-[var(--space-lg)] text-center border border-[rgba(192,132,252,0.3)] w-full max-w-[280px]"
        style={{
          background: 'linear-gradient(135deg, rgba(255,107,157,0.2), rgba(192,132,252,0.2))',
        }}
      >
        <div className="text-[var(--text-xl)] text-[var(--accent2)] tracking-wide" style={{ fontFamily: 'Fredoka One, cursive' }}>
          Aria ✨
        </div>
        <div className="text-[var(--text-xs)] text-[var(--muted)] font-semibold uppercase tracking-wider mt-0.5">
          Your AI Interview Coach
        </div>
      </div>

      <div className={`flex items-end gap-0.5 sm:gap-1 h-6 sm:h-8 justify-center ${speakBarsIdle ? 'opacity-60' : ''}`}>
        {SPEAK_BAR_STYLES.map((s, i) => (
          <div
            key={i}
            className="w-1 sm:w-[5px] rounded-[3px] bg-gradient-to-t from-[var(--accent)] to-[var(--accent2)]"
            style={{
              height: speakBarsIdle ? 4 : undefined,
              maxHeight: 28,
              animation: speakBarsIdle ? 'none' : `speakBar ${s.spd} ease-in-out infinite alternate ${s.del}`,
              ['--h' as string]: `${s.h}px`,
            }}
          />
        ))}
      </div>

      <div
        className="w-full min-h-[4rem] bg-[var(--bubble)] border border-[rgba(192,132,252,0.2)] rounded-[var(--radius-lg)] rounded-bl-[var(--radius-sm)] py-[var(--space-md)] px-[var(--space-lg)] text-[var(--text-sm)] sm:text-sm leading-relaxed text-[var(--text)] relative break-words overflow-visible shrink-0"
        style={{ animation: 'bubbleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {ariaMessage}
      </div>

      <div className="w-full bg-[rgba(15,12,26,0.5)] rounded-[var(--radius-md)] p-[var(--space-sm)] px-[var(--space-md)] border border-[rgba(192,132,252,0.1)]">
        <div className="text-[var(--text-xs)] font-extrabold uppercase tracking-[1.5px] text-[var(--muted)] mb-2">
          🎵 Modulate Voice Signals
        </div>
        {emotionBars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 last:mb-0">
            <span className="text-[var(--text-xs)] font-bold text-[var(--muted)] w-14 sm:w-[70px] shrink-0">{bar.label}</span>
            <div className="flex-1 min-w-0 h-1.5 bg-white/[0.06] rounded overflow-hidden">
              <div
                className="h-full rounded transition-[width] duration-300"
                style={{ width: `${bar.value}%`, background: bar.gradient }}
              />
            </div>
            <span className="text-[var(--text-xs)] font-extrabold w-7 sm:w-8 text-right shrink-0" style={{ color: bar.color }}>
              {Math.round(bar.value)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
