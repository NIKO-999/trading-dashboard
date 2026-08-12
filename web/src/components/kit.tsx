import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/* ---------- modal ---------- */

export function Modal({
  children,
  onClose,
  width = 520,
}: {
  children: ReactNode;
  onClose: () => void;
  width?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Portalled to <body> rather than rendered in place: `position: fixed`
  // only escapes to the viewport if nothing between here and <body> sets a
  // transform, filter, or backdrop-filter — and every `.glass` card does
  // (that's the frosted look). A modal opened from inside one would
  // otherwise be boxed into that card's own bounds instead of the screen.
  return createPortal(
    <div className="mc-modal-overlay" onClick={onClose}>
      <div className="mc-modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ModalHead({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <h2 style={{ fontSize: 17, fontWeight: 300, letterSpacing: '-0.3px', margin: 0 }}>{title}</h2>
      <button className="mc-icon-btn" onClick={onClose} aria-label="Close">
        <X size={15} />
      </button>
    </div>
  );
}

/* ---------- lightbox ---------- */

export function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Same reasoning as Modal above — portalled so a backdrop-filter card
  // upstream can't box it in.
  return createPortal(
    <div className="mc-lightbox" onClick={onClose}>
      <img src={src} alt="" />
    </div>,
    document.body,
  );
}

/* ---------- segmented control ---------- */

export function Seg<T extends string | number | null>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mc-seg">
      {options.map((o) => (
        <button
          key={String(o.value)}
          className={`mc-seg-btn ${o.value === value ? 'active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- empty state ---------- */

export function Empty({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="mc-empty">
      {icon && <div className="mc-empty-icon">{icon}</div>}
      <div>{children}</div>
    </div>
  );
}

/* ---------- section title ---------- */

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
      <div className="mc-section-title">{children}</div>
      {right}
    </div>
  );
}

/* ---------- outcome badge ---------- */

export function Badge({ grade }: { grade: string }) {
  const cls = grade === 'ungraded' ? 'be' : grade;
  const label =
    { win: 'WIN', loss: 'LOSS', be: 'BE', missed: 'MISSED', data: 'DATA', ungraded: 'OPEN' }[grade] ||
    grade;
  return <span className={`mc-badge ${cls}`}>{label}</span>;
}
