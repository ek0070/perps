/** The X mark for generated images (no CSS classes: rendered by next/og). */
export function PreviewLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" strokeLinecap="round">
      <line x1="8" y1="24" x2="24" y2="8" stroke="#16d9a4" strokeWidth="5" />
      <line x1="8" y1="8" x2="24" y2="24" stroke="#8b5cf6" strokeWidth="5" />
    </svg>
  );
}
