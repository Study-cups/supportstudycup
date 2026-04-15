import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

export default function SmoothScrollProvider({ children }) {
  useEffect(() => {
    const isLowEnd =
      navigator.hardwareConcurrency <= 4 ||
      navigator.deviceMemory <= 4;

    if (isLowEnd) return; // ❌ no Lenis on weak devices

    const lenis = new Lenis({
      duration: 0.8,
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 1,
    });

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
