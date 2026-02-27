import { MetricsRowLight } from './MetricsRowLight';

interface EmotionBar {
  label: string;
  value: number;
  color: string;
  bg: string;
}

interface ModulateTrendPoint {
  stress_score: number;
  confidence_score: number;
}

interface AriaAsideProps {
  isTalking: boolean;
  emotionBars: EmotionBar[];
  speakBarsIdle: boolean;
  modulateTrend?: ModulateTrendPoint[]; // accepted but not currently rendered
  overallScore: number;
  vsLastSession: number;
  className?: string;
}

const SPEAK_BARS = new Array(7).fill(null);

export function AriaAside({
  isTalking,
  emotionBars,
  speakBarsIdle,
  overallScore,
  vsLastSession,
  className,
}: AriaAsideProps) {
  return (
    <aside
      className={`min-w-0 flex flex-col overflow-y-auto overflow-x-hidden relative ${className ?? ''}`}
      style={{
        background: 'transparent',
        borderRight: '4px solid var(--fg)',
      }}
      aria-label="AI Interviewer Aria"
    >
      {/* Section 1 — Avatar header strip */}
      <div
        className="relative flex flex-col items-center gap-3"
        style={{
          background: 'var(--blue)',
          borderBottom: '4px solid var(--fg)',
          padding: '20px 18px 16px',
          overflow: 'hidden',
        }}
      >
        {/* Decorative shapes */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 160,
            height: 160,
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: -20,
            left: -10,
            width: 60,
            height: 60,
            borderRadius: 0,
            background: 'rgba(240,192,32,0.12)',
            transform: 'rotate(45deg)',
          }}
        />

        {/* ARIA SVG avatar */}
        <div
          style={{
            width: 180,
            height: 200,
            filter: 'drop-shadow(4px 4px 0 #121212)',
          }}
        >
          <AriaAvatar isTalking={isTalking} />
        </div>

        {/* Name badge */}
        <div
          style={{
            position: 'relative',
            background: 'var(--yellow)',
            border: '3px solid var(--fg)',
            padding: '8px 20px',
            boxShadow: 'var(--sh4)',
            textAlign: 'center',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              width: 18,
              height: 18,
              background: 'var(--red)',
              border: '2px solid var(--fg)',
            }}
          />
          <div
            style={{
              fontFamily: 'var(--f)',
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            ARIA
          </div>
          <div
            style={{
              fontFamily: 'var(--f)',
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              opacity: 0.65,
            }}
          >
            Voice Intelligence
          </div>
        </div>

        {/* Speak bars */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 3,
            height: 24,
            opacity: speakBarsIdle ? 0.25 : 1,
          }}
        >
          {SPEAK_BARS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 5,
                height: speakBarsIdle ? 4 : 6 + (i % 4) * 4,
                background: 'var(--yellow)',
                border: '1.5px solid var(--fg)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Signal meters */}
      <div
        className="shrink-0"
        style={{
          margin: '16px 16px 0',
          border: '3px solid var(--fg)',
          borderRadius: 0,
          background: 'var(--bg)',
          overflow: 'visible',
        }}
        role="region"
        aria-label="Voice signals"
      >
        <div
          style={{
            background: 'var(--fg)',
            padding: '8px 12px',
            fontFamily: 'var(--f)',
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--yellow)',
            borderBottom: '2px solid var(--yellow)',
          }}
        >
          🎵 Modulate Analysis
        </div>
        <ModulateRadar emotionBars={emotionBars} />
        <div
          style={{
            padding: '12px',
            borderTop: '2px solid var(--fg)',
          }}
        >
          <MetricsRowLight
            overallScore={overallScore}
            vsLastSession={vsLastSession}
          />
        </div>
      </div>
    </aside>
  );
}

function ModulateRadar({ emotionBars }: { emotionBars: EmotionBar[] }) {
  // Use up to 5 stats in a fixed ordering to keep the polygon stable.
  const stats = emotionBars.slice(0, 5);
  const count = stats.length || 1;
  const size = 180;
  const center = size / 2;
  const radius = 70;

  const toAngle = (index: number) => (Math.PI * 2 * index) / count - Math.PI / 2;

  const polarToCartesian = (value: number, index: number) => {
    const angle = toAngle(index);
    const r = Math.max(0, Math.min(1, value / 100)) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Radar grid rings (33%, 66%, 100%).
  const ringFractions = [0.33, 0.66, 1];

  const rings = ringFractions.map((fraction, ringIdx) => {
    const points = stats.map((_, i) => {
      const angle = toAngle(i);
      const r = radius * fraction;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      };
    });
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    return (
      <path
        key={ringIdx}
        d={d}
        fill="none"
        stroke="rgba(18,18,18,0.18)"
        strokeWidth={1}
      />
    );
  });

  const valuePoints = stats.map((bar, i) => polarToCartesian(bar.value, i));
  const valuePath =
    valuePoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z';

  const axes = stats.map((_, i) => {
    const { x, y } = polarToCartesian(100, i);
    return (
      <line
        key={i}
        x1={center}
        y1={center}
        x2={x}
        y2={y}
        stroke="rgba(18,18,18,0.35)"
        strokeWidth={1}
      />
    );
  });

  const statDots = stats.map((bar, i) => {
    const { x, y } = polarToCartesian(bar.value, i);
    return (
      <circle
        key={bar.label}
        cx={x}
        cy={y}
        r={3}
        fill={getSignalColor(bar.label, i)}
        stroke="#121212"
        strokeWidth={0.8}
      />
    );
  });

  const summaryLabel =
    'Modulate voice analysis: ' +
    stats
      .map((s) => `${s.label} ${Math.round(s.value)} percent`)
      .join(', ');

  return (
    <div
      style={{
        padding: '16px 16px 18px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={summaryLabel}
      >
        {/* Background panel */}
        <rect
          x={10}
          y={10}
          width={size - 20}
          height={size - 20}
          fill="var(--bg)"
          stroke="#121212"
          strokeWidth={1.5}
        />
        <g transform={`translate(0, 0)`}>
          {rings}
          {axes}
          <path
            d={valuePath}
            fill="rgba(16,64,192,0.25)"
            stroke="#1040C0"
            strokeWidth={2}
          />
          {statDots}
        </g>
      </svg>
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          justifyContent: 'space-between',
        }}
      >
        {stats.map((bar) => (
          <div
            key={bar.label}
            style={{
              fontFamily: 'var(--f)',
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--fg)',
              whiteSpace: 'nowrap',
            }}
          >
            {bar.label}: {Math.round(bar.value)}%
          </div>
        ))}
      </div>
    </div>
  );
}

function getSignalColor(label: string, index: number): string {
  switch (label) {
    case 'Confidence':
      return 'var(--yellow)';
    case 'Stress':
      return 'var(--red)';
    case 'Clarity':
      return 'var(--blue)';
    case 'Pace':
      return 'var(--fg)';
    case 'Hesitation':
      return '#7C3AED';
    default:
      return ['var(--yellow)', 'var(--red)', 'var(--blue)', 'var(--fg)', '#7C3AED'][index % 5];
  }
}

function AriaAvatar({ isTalking }: { isTalking: boolean }) {
  return (
    <svg
      viewBox="0 0 320 300"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Aria, AI interview coach"
    >
      <defs>
        <radialGradient id="aria-skg" cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#FFD4A8" />
          <stop offset="100%" stopColor="#F4A96A" />
        </radialGradient>
        <radialGradient id="aria-blg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF9DAB" stopOpacity={0.7} />
          <stop offset="100%" stopColor="#FF9DAB" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="aria-eyg" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#1040C0" />
          <stop offset="100%" stopColor="#0A2060" />
        </radialGradient>
        <linearGradient id="aria-hag" x1="0%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%" stopColor="#F0C020" />
          <stop offset="100%" stopColor="#D09000" />
        </linearGradient>
        <linearGradient id="aria-otg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1040C0" />
          <stop offset="100%" stopColor="#0A2870" />
        </linearGradient>
      </defs>

      {/* Backing plate behind avatar */}
      <rect
        x="70"
        y="110"
        width="180"
        height="110"
        fill="#D02020"
        stroke="#F0C020"
        strokeWidth={6}
      />

      <g className="body-bob">
        {/* Base shadow + torso plate */}
        <ellipse cx={160} cy={285} rx={88} ry={42} fill="url(#aria-otg)" stroke="#121212" strokeWidth={2.5} />
        <rect x={85} y={250} width={150} height={50} fill="url(#aria-otg)" stroke="#121212" strokeWidth={2.5} />

        {/* Collar */}
        <path d="M 130 252 Q 160 274 190 252" fill="#D02020" stroke="#121212" strokeWidth={2} />
        <path d="M 145 252 Q 160 265 175 252" fill="#F0C020" opacity={0.6} />

        {/* Neck */}
        <rect x={149} y={220} width={22} height={34} fill="url(#aria-skg)" stroke="#121212" strokeWidth={2} />

        {/* Head */}
        <ellipse cx={160} cy={165} rx={62} ry={65} fill="url(#aria-skg)" stroke="#121212" strokeWidth={2.5} />

        {/* Ears + earrings */}
        <ellipse cx={100} cy={168} rx={10} ry={13} fill="url(#aria-skg)" stroke="#121212" strokeWidth={2} />
        <rect x={95} y={174} width={10} height={10} fill="#F0C020" stroke="#121212" strokeWidth={1.5} />
        <ellipse cx={220} cy={168} rx={10} ry={13} fill="url(#aria-skg)" stroke="#121212" strokeWidth={2} />
        <rect x={215} y={174} width={10} height={10} fill="#F0C020" stroke="#121212" strokeWidth={1.5} />

        {/* Hair */}
        <g className="hair-bob">
          <path
            d="M 103 142 Q 96 96 100 66 Q 120 24 160 20 Q 200 24 220 66 Q 224 96 217 142"
            fill="url(#aria-hag)"
            stroke="#121212"
            strokeWidth={2}
            opacity={0.75}
          />
          <path
            d="M 104 148 Q 90 180 94 218 Q 100 237 110 232 Q 116 198 114 162 Z"
            fill="url(#aria-hag)"
            stroke="#121212"
            strokeWidth={2}
          />
          <path
            d="M 216 148 Q 230 180 226 218 Q 220 237 210 232 Q 204 198 206 162 Z"
            fill="url(#aria-hag)"
            stroke="#121212"
            strokeWidth={2}
          />
          <path
            d="M 100 146 Q 100 86 160 78 Q 220 86 220 146 Q 210 116 160 111 Q 110 116 100 146 Z"
            fill="url(#aria-hag)"
            stroke="#121212"
            strokeWidth={2}
          />
          <path d="M 110 134 Q 117 106 137 104 Q 130 118 128 138 Z" fill="url(#aria-hag)" opacity={0.9} />
          <path d="M 210 134 Q 203 106 183 104 Q 190 118 192 138 Z" fill="url(#aria-hag)" opacity={0.9} />
        </g>

        {/* Hair clips */}
        <rect x={137} y={93} width={14} height={14} fill="#D02020" stroke="#121212" strokeWidth={2} />
        <circle cx={177} cy={95} r={8} fill="#1040C0" stroke="#121212" strokeWidth={2} />

        {/* Eyebrows */}
        <line x1={131} y1={137} x2={155} y2={133} stroke="#121212" strokeWidth={3} strokeLinecap="square" />
        <line x1={165} y1={133} x2={189} y2={137} stroke="#121212" strokeWidth={3} strokeLinecap="square" />

        {/* Eyes */}
        <g className="eye-left">
          <rect x={131} y={140} width={28} height={24} fill="#FFFFFF" stroke="#121212" strokeWidth={2} />
          <ellipse cx={145} cy={152} rx={9} ry={10} fill="url(#aria-eyg)" />
          <ellipse cx={145} cy={152} rx={5.5} ry={6} fill="#070E24" />
          <ellipse cx={147} cy={148} rx={2.5} ry={3} fill="#FFFFFF" opacity={0.9} />
        </g>
        <g className="eye-right">
          <rect x={161} y={140} width={28} height={24} fill="#FFFFFF" stroke="#121212" strokeWidth={2} />
          <ellipse cx={175} cy={152} rx={9} ry={10} fill="url(#aria-eyg)" />
          <ellipse cx={175} cy={152} rx={5.5} ry={6} fill="#070E24" />
          <ellipse cx={177} cy={148} rx={2.5} ry={3} fill="#FFFFFF" opacity={0.9} />
        </g>

        {/* Blush */}
        <rect x={112} y={167} width={22} height={10} fill="url(#aria-blg)" opacity={0.5} />
        <rect x={186} y={167} width={22} height={10} fill="url(#aria-blg)" opacity={0.5} />

        {/* Nose */}
        <path d="M 156 162 L 160 174 L 164 162" stroke="#C07040" strokeWidth={2} fill="none" strokeLinecap="square" />

        {/* Mouth (animated) */}
        <path
          d={isTalking ? 'M 148 182 Q 160 196 172 182' : 'M 148 182 Q 160 194 172 182'}
          stroke="#D02020"
          strokeWidth={3}
          strokeLinecap="square"
          fill="#F472B6"
          fillOpacity={0.3}
        />

        {/* Headset */}
        <path d="M 103 155 Q 97 130 101 110" stroke="#F0C020" strokeWidth={3.5} fill="none" />
        <rect x={92} y={148} width={16} height={18} fill="#1040C0" stroke="#121212" strokeWidth={2} />
        <rect x={96} y={152} width={8} height={10} fill="#F0C020" />
        <path d="M 97 165 Q 87 177 90 187" stroke="#F0C020" strokeWidth={2.5} fill="none" />
        <rect x={84} y={184} width={12} height={10} fill="#D02020" stroke="#121212" strokeWidth={2} />

        {/* Clipboard */}
        <rect x={188} y={240} width={60} height={68} fill="#FFFFFF" stroke="#121212" strokeWidth={2.5} />
        <rect x={193} y={246} width={50} height={58} fill="#F0F0F0" />
        <line x1={198} y1={256} x2={238} y2={256} stroke="#E0E0E0" strokeWidth={2} />
        <line x1={198} y1={266} x2={238} y2={266} stroke="#E0E0E0" strokeWidth={2} />
        <line x1={198} y1={276} x2={225} y2={276} stroke="#D02020" strokeWidth={2.5} />
        <line x1={198} y1={286} x2={232} y2={286} stroke="#E0E0E0" strokeWidth={2} />
        <path
          d="M 221 254 L 226 260 L 236 249"
          stroke="#1040C0"
          strokeWidth={3}
          fill="none"
          strokeLinecap="square"
        />
        <rect x={207} y={237} width={22} height={9} fill="#F0C020" stroke="#121212" strokeWidth={2} />
        <ellipse
          cx={209}
          cy={263}
          rx={15}
          ry={10}
          fill="url(#aria-skg)"
          stroke="#121212"
          strokeWidth={2}
          transform="rotate(-8,209,263)"
        />
      </g>
    </svg>
  );
}

