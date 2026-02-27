interface SessionRowProps {
  questionNumber: number;
  totalQuestions?: number;
  role?: string;
  company?: string;
}

export function SessionRow({
  questionNumber,
  totalQuestions = 8,
  role = 'Staff PM',
  company = 'Google',
}: SessionRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        padding: '10px 0',
        marginBottom: 4,
      }}
    >
      {/* Live chip */}
      <Chip bg="var(--fg)" color="var(--yellow)" dataCursor>
        <LiveDot />
        Live
      </Chip>

      {/* Role chip */}
      <Chip bg="#EDE9FE" color="var(--fg)">
        {role}
      </Chip>

      {/* Company chip */}
      <Chip bg="#DBEAFE" color="var(--fg)">
        {company}
      </Chip>

      {/* Question number chip */}
      <Chip
        bg="var(--white)"
        color="rgba(18,18,18,0.5)"
        alignRight
      >
        Q{questionNumber}/{totalQuestions}
      </Chip>
    </div>
  );
}

function Chip({
  children,
  bg,
  color,
  alignRight,
  dataCursor,
}: {
  children: React.ReactNode;
  bg: string;
  color: string;
  alignRight?: boolean;
  dataCursor?: boolean;
}) {
  return (
    <div
      className="bauhaus-interactive"
      data-cursor={dataCursor ? 'hover' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 9999,
        border: '2px solid var(--fg)',
        boxShadow: 'var(--sh-sm)',
        fontFamily: 'var(--f)',
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        background: bg,
        color,
        marginLeft: alignRight ? 'auto' : undefined,
        minHeight: 44,
      }}
    >
      {children}
    </div>
  );
}

function LiveDot() {
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
