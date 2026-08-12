import { useToasts } from '../store/useStore';

export function Toasts() {
  const toasts = useToasts();
  if (!toasts.length) return null;
  return (
    <div className="mc-toasts">
      {toasts.map((t) => (
        <div key={t.id} className="mc-toast">
          {t.message}
        </div>
      ))}
    </div>
  );
}
