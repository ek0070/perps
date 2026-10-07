/** The mark: an X of two rounded strokes, violet crossing green. */
export function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" strokeLinecap="round" aria-hidden="true" className={`shrink-0 ${className}`}>
      <line x1="8" y1="24" x2="24" y2="8" stroke="#16d9a4" strokeWidth="5" />
      <line x1="8" y1="8" x2="24" y2="24" stroke="#8b5cf6" strokeWidth="5" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`whitespace-nowrap font-display text-lg font-extrabold tracking-tight ${className}`}>
      Perpe<span className="text-accent">X</span>uals
    </span>
  );
}
