import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  /** Reveal style: "up" fades and lifts, "img" opens like a curtain. */
  variant?: "up" | "img";
};

/**
 * Entrance reveal driven by IntersectionObserver (no scroll listeners).
 * Elements are visible by default; hiding only applies under
 * prefers-reduced-motion: no-preference (see index.css).
 */
export function Reveal({ children, as: Tag = "div", className = "", delay = 0, variant = "up" }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"pending" | "in">("pending");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setState("in");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("in");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={state}
      className={`${variant === "img" ? "img-reveal" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
