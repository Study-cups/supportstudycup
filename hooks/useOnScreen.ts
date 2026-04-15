// Fix: Import React to bring the React namespace into scope for types like React.RefObject.
import React, { useState, useEffect, useRef } from 'react';

export const useOnScreen = <T extends Element,>(options?: IntersectionObserverInit): [React.RefObject<T>, boolean] => {
  const ref = useRef<T>(null);
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIntersecting(true);
        // Disconnect after it becomes visible to avoid re-triggering
        if(ref.current) {
          observer.unobserve(ref.current);
        }
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return [ref, isIntersecting];
};