import { useEffect } from "react";

export default function SmoothScrollProvider({ children }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const isMobileViewport = window.innerWidth < 1024;
    const isTouchDevice = hasCoarsePointer || isMobileViewport;

    // Keep native scrolling on touch/mobile devices for the lightest experience.
    if (isTouchDevice) return;

    const deviceMemory =
      typeof navigator !== "undefined" && "deviceMemory" in navigator
        ? navigator.deviceMemory
        : undefined;
    const isLowEndDevice =
      navigator.hardwareConcurrency <= 4 ||
      (typeof deviceMemory === "number" && deviceMemory <= 4);

    if (isLowEndDevice) return;

    const existingStyle = document.getElementById("lenis-scroll-style");
    const styleEl = existingStyle ?? document.createElement("style");

    styleEl.id = "lenis-scroll-style";
    styleEl.textContent = `
      html.lenis,
      html.lenis body {
        height: auto;
      }

      .lenis.lenis-smooth {
        scroll-behavior: auto !important;
      }

      .lenis.lenis-smooth [data-lenis-prevent] {
        overscroll-behavior: contain;
      }

      .lenis.lenis-stopped {
        overflow: hidden;
      }
    `;

    if (!existingStyle) {
      document.head.appendChild(styleEl);
    }
    let lenis = null;
    let rafId = 0;
    let cancelled = false;

    const setupLenis = async () => {
      const { default: Lenis } = await import("@studio-freight/lenis");
      if (cancelled) return;

      lenis = new Lenis(
        isTouchDevice
          ? {
              duration: 0.65,
              lerp: 0.16,
              gestureOrientation: "vertical",
              smoothWheel: false,
              syncTouch: true,
              syncTouchLerp: 0.14,
              touchInertiaMultiplier: 22,
              touchMultiplier: 0.95,
              wheelMultiplier: 1,
              normalizeWheel: false,
            }
          : {
              duration: 0.95,
              lerp: 0.085,
              gestureOrientation: "vertical",
              smoothWheel: true,
              syncTouch: false,
              wheelMultiplier: 0.95,
              touchMultiplier: 1,
              normalizeWheel: true,
            }
      );

      const raf = (time) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };

      rafId = requestAnimationFrame(raf);
    };

    let idleId = null;
    let timeoutId = 0;

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => {
        void setupLenis();
      }, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(() => {
        void setupLenis();
      }, 800);
    }

    return () => {
      cancelled = true;
      if (idleId !== null) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      cancelAnimationFrame(rafId);
      lenis?.destroy();

      if (!existingStyle && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, []);

  return <>{children}</>;
}
