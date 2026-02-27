import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  ariaLabel: string;
  loading?: boolean;
  children: React.ReactNode;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function Modal({ open, onClose, title, ariaLabel, loading = false, children, triggerRef }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(open);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    } else if (prevOpenRef.current) {
      triggerRef?.current?.focus();
    }
    prevOpenRef.current = open;
  }, [open, triggerRef]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(18,18,18,0.82)' }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
        if (e.key === 'Tab') {
          const panel = panelRef.current;
          if (!panel) return;
          const focusable = panel.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          } else if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        }
      }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="max-w-xl w-full max-h-[80vh] flex flex-col"
        style={{
          background: 'var(--white)',
          border: '4px solid var(--fg)',
          borderRadius: 0,
          boxShadow: 'var(--sh8)',
          animation: 'popIn 280ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header strip */}
        <div
          style={{
            background: 'var(--fg)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            id="modal-title"
            style={{
              fontFamily: 'var(--f)',
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
            }}
          >
            {title}
          </h2>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            data-cursor="hover"
            className="bauhaus-interactive outline-none"
            style={{
              width: 32,
              height: 32,
              borderRadius: 0,
              border: '2px solid rgba(255,255,255,0.3)',
              background: 'transparent',
              color: '#FFFFFF',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 32,
              minHeight: 32,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '24px 20px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {loading ? (
            <div
              className="flex items-center gap-3"
              style={{
                fontFamily: 'var(--f)',
                fontSize: 10,
                color: 'var(--fg)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              <span
                className="inline-block w-4 h-4"
                style={{
                  border: '1.5px solid rgba(247,147,26,0.3)',
                  borderTopColor: 'var(--btc)',
                  borderRadius: 9999,
                  animation: 'spin 1s linear infinite',
                }}
                aria-hidden
              />
              <span>Loading…</span>
            </div>
          ) : (
            <div
              style={{
                fontFamily: 'var(--f)',
                fontSize: 13,
                lineHeight: 1.65,
                color: 'var(--fg)',
              }}
            >
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
