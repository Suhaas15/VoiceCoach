/** Legacy/alternate UI — not used in current App (used only by LeftPanel). */
interface AriaAvatarProps {
  isTalking?: boolean;
}

export function AriaAvatar({ isTalking = false }: AriaAvatarProps) {
  return (
    <div className="relative w-full max-w-[260px] aspect-[260/280] flex-shrink-0">
      <svg
        className="w-full h-full drop-shadow-[0_8px_32px_rgba(192,132,252,0.4)]"
        viewBox="0 0 320 320"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="skinGrad" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#FFD4A8" />
            <stop offset="100%" stopColor="#F4A96A" />
          </radialGradient>
          <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF9DAB" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF9DAB" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="eyeGrad" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#6B3FA0" />
            <stop offset="100%" stopColor="#3B1F6B" />
          </radialGradient>
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9B59B6" />
            <stop offset="100%" stopColor="#6C3483" />
          </linearGradient>
          <linearGradient id="outfitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
          <linearGradient id="collarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B9D" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
          <filter id="softShadow">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.3)" />
          </filter>
        </defs>
        <g
          className="origin-center"
          style={{
            filter: 'url(#softShadow)',
            animation: 'bob 3s ease-in-out infinite',
            transformOrigin: 'center bottom',
          }}
        >
          <ellipse cx="160" cy="290" rx="90" ry="50" fill="url(#outfitGrad)" opacity="0.9" />
          <rect x="80" y="248" width="160" height="60" rx="30" fill="url(#outfitGrad)" />
          <path d="M 130 252 Q 160 275 190 252" fill="url(#collarGrad)" opacity="0.8" />
          <path d="M 145 252 Q 160 268 175 252" fill="white" opacity="0.3" />
          <rect x="148" y="218" width="24" height="36" rx="10" fill="url(#skinGrad)" />
          <ellipse cx="160" cy="170" rx="62" ry="68" fill="url(#skinGrad)" />
          <ellipse cx="101" cy="172" rx="10" ry="13" fill="url(#skinGrad)" />
          <ellipse cx="101" cy="172" rx="6" ry="8" fill="#F4A96A" />
          <circle cx="101" cy="182" r="5" fill="#C084FC" />
          <circle cx="101" cy="182" r="3" fill="#E879F9" />
          <ellipse cx="219" cy="172" rx="10" ry="13" fill="url(#skinGrad)" />
          <ellipse cx="219" cy="172" rx="6" ry="8" fill="#F4A96A" />
          <circle cx="219" cy="182" r="5" fill="#C084FC" />
          <circle cx="219" cy="182" r="3" fill="#E879F9" />
          <g style={{ animation: 'hairBounce 3s ease-in-out infinite', transformOrigin: '160px 120px' }}>
            <path d="M 104 145 Q 96 100 100 70 Q 120 30 160 25 Q 200 30 220 70 Q 224 100 216 145" fill="url(#hairGrad)" opacity="0.7" />
            <path d="M 103 150 Q 88 180 92 220 Q 98 240 108 235 Q 115 200 112 165 Z" fill="url(#hairGrad)" />
            <path d="M 217 150 Q 232 180 228 220 Q 222 240 212 235 Q 205 200 208 165 Z" fill="url(#hairGrad)" />
          </g>
          <g style={{ animation: 'hairBounce 3s ease-in-out infinite', transformOrigin: '160px 120px' }}>
            <path d="M 100 148 Q 100 90 160 82 Q 220 90 220 148 Q 210 120 160 115 Q 110 120 100 148 Z" fill="url(#hairGrad)" />
            <path d="M 108 136 Q 115 108 135 106 Q 128 120 126 140 Z" fill="url(#hairGrad)" opacity="0.85" />
            <path d="M 212 136 Q 205 108 185 106 Q 192 120 194 140 Z" fill="url(#hairGrad)" opacity="0.85" />
            <path d="M 135 90 Q 155 85 175 90 Q 165 88 160 87 Q 148 88 135 90 Z" fill="white" opacity="0.25" />
          </g>
          <circle cx="145" cy="100" r="6" fill="#FF6B9D" />
          <circle cx="175" cy="97" r="5" fill="#67E8F9" />
          <path d="M 132 142 Q 143 136 155 140" stroke="#6C3483" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 168 140 Q 180 136 191 142" stroke="#6C3483" strokeWidth="3" fill="none" strokeLinecap="round" />
          <g style={{ animation: 'blink 4s ease-in-out infinite', transformOrigin: '145px 148px' }}>
            <ellipse cx="145" cy="154" rx="14" ry="15" fill="white" />
            <ellipse cx="145" cy="156" rx="11" ry="12" fill="url(#eyeGrad)" />
            <ellipse cx="145" cy="156" rx="7" ry="8" fill="#1A0A2E" />
            <ellipse cx="148" cy="152" rx="3.5" ry="4" fill="white" opacity="0.85" />
            <ellipse cx="141" cy="159" rx="1.5" ry="1.5" fill="white" opacity="0.5" />
            <path d="M 133 148 Q 138 144 145 143 Q 152 144 157 148" stroke="#3B1F6B" strokeWidth="1.5" fill="none" />
          </g>
          <g style={{ animation: 'blink 4s ease-in-out infinite', transformOrigin: '175px 148px' }}>
            <ellipse cx="175" cy="154" rx="14" ry="15" fill="white" />
            <ellipse cx="175" cy="156" rx="11" ry="12" fill="url(#eyeGrad)" />
            <ellipse cx="175" cy="156" rx="7" ry="8" fill="#1A0A2E" />
            <ellipse cx="178" cy="152" rx="3.5" ry="4" fill="white" opacity="0.85" />
            <ellipse cx="171" cy="159" rx="1.5" ry="1.5" fill="white" opacity="0.5" />
            <path d="M 163 148 Q 168 144 175 143 Q 182 144 187 148" stroke="#3B1F6B" strokeWidth="1.5" fill="none" />
          </g>
          <ellipse cx="128" cy="175" rx="17" ry="10" fill="url(#blushGrad)" />
          <ellipse cx="192" cy="175" rx="17" ry="10" fill="url(#blushGrad)" />
          <path d="M 157 168 Q 160 178 163 168" stroke="#F4A96A" strokeWidth="2" fill="none" strokeLinecap="round" />
          <g>
            <path
              d={isTalking ? 'M 148 184 Q 160 198 172 184' : 'M 148 184 Q 160 194 172 184'}
              stroke="#E05880"
              strokeWidth="2.5"
              fill="#FF6B9D"
              fillOpacity="0.4"
              strokeLinecap="round"
              style={{ transition: 'd 0.1s ease' }}
            />
            <path d="M 152 184 Q 160 188 168 184" fill="white" opacity="0.6" />
            <path d="M 151 182 Q 157 180 163 182" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
          </g>
          <path d="M 102 158 Q 96 140 100 118" stroke="#C084FC" strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="100" cy="160" rx="8" ry="10" fill="#7C3AED" stroke="#C084FC" strokeWidth="1.5" />
          <ellipse cx="100" cy="160" rx="4" ry="5" fill="#C084FC" />
          <path d="M 96 164 Q 86 178 90 188" stroke="#C084FC" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="90" cy="191" r="5" fill="#FF6B9D" />
          <circle cx="90" cy="191" r="3" fill="#FF9DBB" />
          <rect x="186" y="245" width="60" height="72" rx="6" fill="#2A2545" stroke="#C084FC" strokeWidth="1.5" />
          <rect x="191" y="250" width="50" height="62" rx="4" fill="#1A1630" />
          <line x1="196" y1="260" x2="236" y2="260" stroke="#C084FC" strokeWidth="1.5" opacity="0.5" />
          <line x1="196" y1="270" x2="236" y2="270" stroke="#C084FC" strokeWidth="1.5" opacity="0.5" />
          <line x1="196" y1="280" x2="220" y2="280" stroke="#FF6B9D" strokeWidth="1.5" opacity="0.6" />
          <line x1="196" y1="290" x2="230" y2="290" stroke="#C084FC" strokeWidth="1.5" opacity="0.5" />
          <path d="M 222 258 L 226 263 L 234 254" stroke="#4ADE80" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="207" y="243" width="20" height="8" rx="4" fill="#7C3AED" />
          <ellipse cx="208" cy="266" rx="16" ry="10" fill="url(#skinGrad)" transform="rotate(-10, 208, 266)" />
        </g>
      </svg>
    </div>
  );
}
