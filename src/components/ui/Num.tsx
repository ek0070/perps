"use client";

import { useEffect, useRef } from "react";

/**
 * A live number. Renders a fixed-width skeleton until the value exists, and
 * flashes white once whenever the text changes. Only this span is touched on
 * an update, never the row around it.
 */
export function Num({
  value,
  className = "",
  skeleton = "w-14",
}: {
  value: string | null | undefined;
  className?: string;
  /** Width class for the loading placeholder. */
  skeleton?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef<string | null | undefined>(value);

  useEffect(() => {
    const el = ref.current;
    if (el && prev.current != null && value != null && prev.current !== value) {
      el.classList.remove("flash");
      void el.offsetWidth; // restart the animation
      el.classList.add("flash");
    }
    prev.current = value;
  }, [value]);

  if (value == null) return <span className={`skel h-[1em] align-middle ${skeleton}`} aria-hidden="true" />;
  return (
    <span ref={ref} className={`num ${className}`}>
      {value}
    </span>
  );
}
