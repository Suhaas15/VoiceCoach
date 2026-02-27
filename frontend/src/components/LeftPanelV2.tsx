/** Legacy/alternate UI — not used in current App. */
import { AriaAvatarV2 } from './AriaAvatarV2';

interface EmotionBar {
  label: string;
  icon: string;
  value: number;
  color: string;
  gradient: string;
}

interface LeftPanelV2Props {
  ariaMessage: string;
  isAriaTalking: boolean;
  emotionBars: EmotionBar[];
  speakBarsIdle: boolean;
}

const WAVE_BARS = [
  { h: 10, spd: '0.4s', del: '0s' },
  { h: 20, spd: '0.5s', del: '0.06s' },
  { h: 28, spd: '0.45s', del: '0.12s' },
  { h: 32, spd: '0.55s', del: '0.04s' },
  { h: 22, spd: '0.42s', del: '0.18s' },
  { h: 16, spd: '0.48s', del: '0.09s' },
  { h: 26, spd: '0.5s', del: '0.14s' },
  { h: 20, spd: '0.44s', del: '0.02s' },
];

export function LeftPanelV2({
  ariaMessage,
  isAriaTalking,
  emotionBars,
  speakBarsIdle,
}: LeftPanelV2Props) {
  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-8" style={{ animation: 'entryL 0.8s cubic-bezier(.34,1.56,.64,1) both' }}>
      {/* Aria stage */}
      <div className="relative overflow-hidden rounded-[24px] border border-[var(--glassBorder)] bg-[var(--card)] px-6 pt-8 pb-6 flex flex-col items-center gap-5">
        <div
          className="pointer-events-none absolute inset-0 rounded-[24px]"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,.15) 0%, transparent 65%)',
          }}
        />
        {/* Orbit rings */}
        <div
          className="absolute rounded-full border border-[rgba(139,92,246,.12)] animate-[orbitSpin_18s_linear_infinite]"
          style={{ width: 310, height: 310, top: -35, left: -35 }}
        >
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--violet)] shadow-[0_0_10px_var(--violet)]" />
        </div>
        <div
          className="absolute rounded-full border border-[rgba(255,77,141,.08)] animate-[orbitSpin_28s_linear_infinite_reverse]"
          style={{ width: 370, height: 370, top: -65, left: -65 }}
        >
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--rose)] shadow-[0_0_10px_var(--rose)]" />
        </div>
        <div
          className="absolute rounded-full border border-[rgba(6,214,245,.06)] animate-[orbitSpin_40s_linear_infinite] hidden lg:block"
          style={{ width: 440, height: 440, top: -100, left: -100 }}
        >
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--cyan)] shadow-[0_0_10px_var(--cyan)]" />
        </div>

        <div className="relative z-10 w-[240px] h-[260px] shrink-0">
          <AriaAvatarV2 isTalking={isAriaTalking} />
        </div>

        <div className="relative z-10 text-center">
          <div
            className="text-[1.6rem] font-extrabold tracking-tight bg-gradient-to-br from-white to-[var(--violet)] bg-clip-text text-transparent"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Aria ✨
          </div>
          <div className="text-[0.72rem] font-medium text-[var(--muted)] uppercase tracking-widest mt-0.5">
            AI Interview Coach · Powered by Modulate
          </div>
        </div>

        <div className={`flex items-center gap-1 h-8 ${speakBarsIdle ? 'opacity-30' : ''}`}>
          {WAVE_BARS.map((w, i) => (
            <div
              key={i}
              className="w-1 rounded bg-gradient-to-t from-[var(--rose)] to-[var(--violet)] transition-opacity duration-300"
              style={{
                height: speakBarsIdle ? 4 : undefined,
                maxHeight: 26,
                animation: speakBarsIdle ? 'none' : `waveBar ${w.spd} ease-in-out infinite alternate ${w.del}`,
                ['--h' as string]: `${w.h}px`,
              }}
            />
          ))}
        </div>

        <div
          className="relative z-10 w-full min-h-[70px] rounded-[18px] rounded-bl-[4px] border border-white/10 bg-white/[0.04] px-4 py-4 text-[0.85rem] leading-relaxed text-[var(--soft)] backdrop-blur-md"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {ariaMessage}
        </div>
      </div>

      {/* Emotion card */}
      <div className="rounded-[20px] border border-[var(--glassBorder)] bg-[var(--card)] p-5">
        <div className="flex items-center gap-2 mb-4 text-[0.65rem] font-bold uppercase tracking-widest text-[var(--muted)]" style={{ fontFamily: 'Syne, sans-serif' }}>
          <span
            className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] shadow-[0_0_8px_var(--amber)]"
            style={{ animation: 'ecPulse 1.5s ease-in-out infinite' }}
          />
          Modulate Voice Analysis
        </div>
        {emotionBars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-3 mb-3 last:mb-0">
            <span className="text-base w-5 text-center">{bar.icon}</span>
            <span className="text-[0.72rem] font-medium text-[var(--muted)] w-[68px]">{bar.label}</span>
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-[10px] overflow-hidden">
              <div
                className="h-full rounded-[10px] transition-[width] duration-500"
                style={{ width: `${bar.value}%`, background: bar.gradient }}
              />
            </div>
            <span className="text-[0.72rem] font-semibold w-7 text-right tabular-nums" style={{ color: bar.color }}>
              {Math.round(bar.value)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
