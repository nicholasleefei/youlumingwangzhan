import { useEffect, useRef } from "react";

export type MarqueeDirection = "ltr" | "rtl";

export function useMarquee(
  direction: MarqueeDirection,
  speed: number
) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    function tick(timestamp: number) {
      if (!pausedRef.current) {
        if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
        const dt = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        const step = speed * dt;

        if (direction === "ltr") {
          offsetRef.current -= step;
          if (offsetRef.current <= -50) {
            offsetRef.current += 50;
          }
        } else {
          offsetRef.current += step;
          if (offsetRef.current >= 50) {
            offsetRef.current -= 50;
          }
        }

        if (trackRef.current) {
          trackRef.current.style.transform = `translateX(${direction === "ltr" ? offsetRef.current : -offsetRef.current}%)`;
        }
      } else {
        lastTimeRef.current = timestamp;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [direction, speed]);

  function pause() { pausedRef.current = true; }
  function resume() {
    lastTimeRef.current = 0;
    pausedRef.current = false;
  }

  return { trackRef, pause, resume };
}