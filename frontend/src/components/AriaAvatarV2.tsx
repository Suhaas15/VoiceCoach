/** Aria avatar from voicecoach_v2.html — headset design, viewBox 320x280 */
interface AriaAvatarV2Props {
  isTalking?: boolean;
}

export function AriaAvatarV2({ isTalking = false }: AriaAvatarV2Props) {
  return (
    <div className="relative w-full max-w-[240px] aspect-[240/260] shrink-0">
      <svg
        className="w-full h-full drop-shadow-[0_16px_48px_rgba(139,92,246,.35)]"
        viewBox="0 0 320 280"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="sk" cx="50%" cy="38%" r="58%">
            <stop offset="0%" stopColor="#FFD4A3" />
            <stop offset="100%" stopColor="#E8A870" />
          </radialGradient>
          <linearGradient id="hg" x1="0%" y1="0%" x2="60%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#4C1D95" />
          </linearGradient>
          <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1040" />
            <stop offset="100%" stopColor="#312060" />
          </linearGradient>
          <linearGradient id="col1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff4d8d" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          <radialGradient id="iris" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="60%" stopColor="#5b21b6" />
            <stop offset="100%" stopColor="#2e1065" />
          </radialGradient>
          <radialGradient id="blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6b9d" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ff6b9d" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g
          className="origin-center"
          style={{
            animation: 'ariaFloat 4s ease-in-out infinite',
            transformOrigin: 'center 220px',
          }}
        >
          <ellipse cx="160" cy="268" rx="88" ry="28" fill="url(#bg1)" opacity="0.5" />
          <path d="M 72 255 Q 80 220 160 218 Q 240 220 248 255 Q 240 270 160 272 Q 80 270 72 255 Z" fill="url(#bg1)" />
          <path d="M 130 230 Q 160 250 190 230" fill="url(#col1)" opacity="0.7" />
          <path d="M 140 230 Q 160 245 180 230" fill="white" opacity="0.15" />
          <path d="M 150 214 Q 145 226 145 233 L 175 233 Q 175 226 170 214 Z" fill="url(#sk)" />
          <ellipse cx="160" cy="158" rx="62" ry="66" fill="url(#sk)" />
          <ellipse cx="101" cy="160" rx="9" ry="12" fill="url(#sk)" />
          <ellipse cx="219" cy="160" rx="9" ry="12" fill="url(#sk)" />
          <ellipse cx="101" cy="160" rx="5" ry="7" fill="#E8A870" />
          <ellipse cx="219" cy="160" rx="5" ry="7" fill="#E8A870" />
          <circle cx="101" cy="170" r="5" fill="#c084fc" filter="url(#glow)" />
          <circle cx="101" cy="170" r="3" fill="#e879f9" />
          <circle cx="219" cy="170" r="5" fill="#c084fc" filter="url(#glow)" />
          <circle cx="219" cy="170" r="3" fill="#e879f9" />
          <g style={{ animation: 'hairWave 4s ease-in-out infinite', transformOrigin: '160px 100px' }}>
            <path d="M 102 152 Q 94 88 100 60 Q 120 18 160 14 Q 200 18 220 60 Q 226 88 218 152" fill="url(#hg)" opacity="0.65" />
            <path d="M 103 158 Q 84 196 88 228 Q 94 242 106 238 Q 114 204 110 168 Z" fill="url(#hg)" />
            <path d="M 217 158 Q 236 196 232 228 Q 226 242 214 238 Q 206 204 210 168 Z" fill="url(#hg)" />
          </g>
          <g style={{ animation: 'hairWave 4s ease-in-out infinite', transformOrigin: '160px 100px' }}>
            <path d="M 100 155 Q 98 85 160 77 Q 222 85 220 155 Q 208 110 160 106 Q 112 110 100 155 Z" fill="url(#hg)" />
            <path d="M 108 138 Q 116 100 140 98 Q 130 114 128 142 Z" fill="url(#hg)" opacity="0.9" />
            <path d="M 212 138 Q 204 100 180 98 Q 190 114 192 142 Z" fill="url(#hg)" opacity="0.9" />
            <path d="M 138 84 Q 160 80 182 84 Q 168 82 160 81 Q 152 82 138 84 Z" fill="white" opacity="0.2" />
          </g>
          <circle cx="142" cy="98" r="7" fill="#ff4d8d" filter="url(#glow)" />
          <circle cx="142" cy="98" r="4" fill="#ffb830" />
          <circle cx="178" cy="95" r="6" fill="#06d6f5" filter="url(#glow)" />
          <circle cx="178" cy="95" r="3.5" fill="white" opacity="0.6" />
          <path d="M 122 131 Q 134 124 148 128" stroke="url(#hg)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 172 128 Q 186 124 198 131" stroke="url(#hg)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <g style={{ animation: 'blink 5s ease-in-out infinite', transformOrigin: '135px 145px' }}>
            <ellipse cx="135" cy="145" rx="15" ry="16" fill="white" />
            <ellipse cx="135" cy="147" rx="12" ry="13" fill="url(#iris)" />
            <ellipse cx="135" cy="147" rx="7.5" ry="8" fill="#0f0520" />
            <ellipse cx="139" cy="143" rx="4" ry="4.5" fill="white" opacity="0.9" />
            <ellipse cx="131" cy="151" rx="1.8" ry="1.8" fill="white" opacity="0.45" />
            <path d="M 122 140 Q 135 135 148 140" stroke="#2e1065" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M 123 151 Q 135 155 147 151" stroke="#2e1065" strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round" />
          </g>
          <g style={{ animation: 'blink 5s ease-in-out infinite 0.08s', transformOrigin: '185px 145px' }}>
            <ellipse cx="185" cy="145" rx="15" ry="16" fill="white" />
            <ellipse cx="185" cy="147" rx="12" ry="13" fill="url(#iris)" />
            <ellipse cx="185" cy="147" rx="7.5" ry="8" fill="#0f0520" />
            <ellipse cx="189" cy="143" rx="4" ry="4.5" fill="white" opacity="0.9" />
            <ellipse cx="181" cy="151" rx="1.8" ry="1.8" fill="white" opacity="0.45" />
            <path d="M 172 140 Q 185 135 198 140" stroke="#2e1065" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M 173 151 Q 185 155 197 151" stroke="#2e1065" strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round" />
          </g>
          <ellipse cx="118" cy="165" rx="18" ry="11" fill="url(#blush)" />
          <ellipse cx="202" cy="165" rx="18" ry="11" fill="url(#blush)" />
          <path d="M 157 162 Q 160 172 163 162" stroke="#c8905c" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path
            d={isTalking ? 'M148 178 Q160 192 172 178' : 'M148 178 Q160 185 172 178'}
            stroke="#d63e6e"
            strokeWidth="2.5"
            fill="#ff6b9d"
            fillOpacity="0.3"
            strokeLinecap="round"
          />
          <path d="M 151 176 Q 158 174 165 176" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
          <path d="M 104 152 Q 97 126 102 105" stroke="#8b5cf6" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M 218 152 Q 225 126 218 105" stroke="#8b5cf6" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M 102 105 Q 130 78 160 76 Q 190 78 218 105" stroke="#7C3AED" strokeWidth="5" fill="none" strokeLinecap="round" />
          <ellipse cx="100" cy="157" rx="10" ry="12" fill="#5b21b6" stroke="#8b5cf6" strokeWidth="1.5" />
          <ellipse cx="100" cy="157" rx="5.5" ry="7" fill="#7C3AED" />
          <ellipse cx="100" cy="157" rx="2.5" ry="3.5" fill="#c084fc" filter="url(#glow)" />
          <ellipse cx="220" cy="157" rx="10" ry="12" fill="#5b21b6" stroke="#8b5cf6" strokeWidth="1.5" />
          <ellipse cx="220" cy="157" rx="5.5" ry="7" fill="#7C3AED" />
          <ellipse cx="220" cy="157" rx="2.5" ry="3.5" fill="#c084fc" filter="url(#glow)" />
          <path d="M 94 163 Q 82 182 88 194" stroke="#8b5cf6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="88" cy="197" r="6" fill="#ff4d8d" filter="url(#glow)" />
          <circle cx="88" cy="197" r="3.5" fill="#ffb0cc" />
        </g>
      </svg>
    </div>
  );
}
