// Fix: Import React to bring the React namespace into scope for types like React.RefObject.
import React, { useState, useEffect, useRef } from 'react';

export const useOnScreen = <T extends Element,>(options?: IntersectionObserverInit): [React.RefObject<T>, boolean] => {
  const ref = useRef<T>(null);
  const [isIntersecting, setIntersecting] = useState(false);
  const root = options?.root ?? null;
  const rootMargin = options?.rootMargin ?? "0px";
  const threshold = options?.threshold ?? 0;
  const thresholdKey = Array.isArray(threshold) ? threshold.join(",") : String(threshold);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIntersecting(true);
        // Disconnect after it becomes visible to avoid re-triggering
        if(ref.current) {
          observer.unobserve(ref.current);
        }
      }
    }, {
      root,
      rootMargin,
      threshold,
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, thresholdKey]);

  return [ref, isIntersecting];
};
