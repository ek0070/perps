/** The bubble-prompt mark for generated images (no CSS classes: rendered by next/og). */
export function PreviewLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="60 70 280 280" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M130 100 H270 A40 40 0 0 1 310 140 V230 A40 40 0 0 1 270 270 H185 L125 318 L140 270 H130 A40 40 0 0 1 90 230 V140 A40 40 0 0 1 130 100 Z"
        strokeWidth="16"
      />
      <path d="M148 150 L184 184 L148 218" strokeWidth="16" />
      <line x1="204" y1="218" x2="252" y2="218" strokeWidth="16" />
    </svg>
  );
}
