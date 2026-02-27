interface HeaderV2Props {
  onEndSession?: () => void;
  sessionActive?: boolean;
}

export function HeaderV2({ onEndSession, sessionActive = false }: HeaderV2Props) {
  return (
    <header
      role="banner"
      className="w-full min-w-0 overflow-hidden"
      style={{
        height: 64,
        background: 'var(--fg)',
        borderBottom: '4px solid var(--fg)',
        boxShadow: '0 4px 0 0 var(--yellow)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 0,
      }}
    >
      {/* LEFT: Logo block */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          paddingRight: 20,
          borderRight: '3px solid rgba(255,255,255,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 14,
              height: 14,
              background: 'var(--red)',
              borderRadius: 0,
            }}
          />
          <div
            style={{
              width: 14,
              height: 14,
              background: 'var(--yellow)',
              borderRadius: 9999,
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '14px solid var(--blue)',
            }}
          />
        </div>
        <div
          style={{
            marginLeft: 10,
            fontFamily: 'var(--f)',
            fontWeight: 900,
            fontSize: 16,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--white)',
          }}
        >
          VOICECOACH
        </div>
      </div>

      {/* CENTER: Single Interview tab */}
      <nav
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          paddingLeft: 16,
          gap: 0,
        }}
      >
        <button
          type="button"
          data-cursor="hover"
          className="bauhaus-interactive"
          style={{
            height: '100%',
            padding: '0 18px',
            fontFamily: 'var(--f)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--white)',
            border: 'none',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            background: 'var(--blue)',
            cursor: 'default',
            minWidth: 44,
          }}
          aria-current="page"
        >
          Interview
        </button>
      </nav>

      {/* RIGHT: Status pills + End Session */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginLeft: 'auto',
          borderLeft: '2px solid rgba(255,255,255,0.1)',
          paddingLeft: 20,
        }}
      >
        <HeaderPill live>
          Live
        </HeaderPill>
        <HeaderPill>Modulate</HeaderPill>
        <HeaderPill>Yutori</HeaderPill>
        <HeaderPill>Fastino</HeaderPill>
        <button
          type="button"
          data-cursor="hover"
          className="bauhaus-interactive"
          onClick={onEndSession}
          disabled={!sessionActive}
          style={{
            padding: '8px 18px',
            borderRadius: 0,
            border: '2px solid var(--fg)',
            background: 'var(--yellow)',
            color: 'var(--fg)',
            fontFamily: 'var(--f)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            boxShadow: 'var(--sh4)',
            opacity: sessionActive ? 1 : 0.4,
            cursor: sessionActive ? 'pointer' : 'not-allowed',
            minHeight: 44,
            minWidth: 44,
          }}
        >
          End Session
        </button>
      </div>
    </header>
  );
}

function HeaderPill({ children, live = false }: { children: React.ReactNode; live?: boolean }) {
  return (
    <div
      data-cursor="hover"
      className="bauhaus-interactive"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: 9999,
        border: '2px solid rgba(255,255,255,0.2)',
        fontFamily: 'var(--f)',
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: live ? '#22C55E' : 'rgba(255,255,255,0.7)',
        minHeight: 44,
      }}
    >
      {live && <LivePingDot />}
      <span>{children}</span>
    </div>
  );
}

function LivePingDot() {
  return (
    <span
      aria-hidden
      style={{
        position: 'relative',
        width: 6,
        height: 6,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 9999,
          background: '#22C55E',
        }}
      />
      <span
        style={{
          position: 'absolute',
          width: 6,
          height: 6,
          borderRadius: 9999,
          boxShadow: '0 0 0 0 rgba(34,197,94,0.6)',
          animation: 'pill-ping 1.4s ease-out infinite',
        }}
      />
    </span>
  );
}
