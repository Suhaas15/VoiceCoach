/** Legacy/alternate UI — not used in current App. */
interface FeedbackToastProps {
  text: string;
  visible: boolean;
}

export function FeedbackToast({ text, visible }: FeedbackToastProps) {
  if (!visible) return null;
  return (
    <div
      className="rounded-[18px] border border-[rgba(139,92,246,.18)] py-4 px-5 flex gap-3 items-start"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,.08), rgba(255,77,141,.06))',
        animation: 'slideUp 0.5s cubic-bezier(.34,1.56,.64,1) both',
      }}
    >
      <span className="text-[1.3rem] flex-shrink-0">💡</span>
      <span className="text-[0.83rem] leading-relaxed text-[var(--soft)] min-w-0 break-words">{text}</span>
    </div>
  );
}
