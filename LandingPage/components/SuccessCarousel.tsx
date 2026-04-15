
import React, { useState, useEffect, useRef } from 'react';
import { Testimonial } from '../types';

interface SuccessCarouselProps {
  testimonials: Testimonial[];
}

const SuccessCarousel: React.FC<SuccessCarouselProps> = ({ testimonials }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<number | null>(null); 

  const DESKTOP_SLIDES = 4;
const maxDesktopIndex = testimonials.length - DESKTOP_SLIDES; // 6 - 4 = 2


  const resetTimeout = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
  };

useEffect(() => {
  if (isPaused) return;

  resetTimeout();

  timeoutRef.current = window.setTimeout(() => {
    setCurrentIndex(prev => {
      // ✅ DESKTOP ONLY LOGIC
      if (window.innerWidth >= 1024) {
        return prev >= maxDesktopIndex ? 0 : prev + 1;
      }

      // ✅ Mobile / Tablet (unchanged behavior)
      return (prev + 1) % testimonials.length;
    });
  }, 5000);

  return () => resetTimeout();
}, [currentIndex, isPaused, testimonials.length]);


  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // Resume auto-play after 10s of inactivity
  };

 const nextSlide = () => {
  if (window.innerWidth >= 1024) {
    goToSlide(currentIndex >= maxDesktopIndex ? 0 : currentIndex + 1);
  } else {
    goToSlide((currentIndex + 1) % testimonials.length);
  }
};

const prevSlide = () => {
  if (window.innerWidth >= 1024) {
    goToSlide(currentIndex <= 0 ? maxDesktopIndex : currentIndex - 1);
  } else {
    goToSlide((currentIndex - 1 + testimonials.length) % testimonials.length);
  }
};

  return (
    <div className="relative group">
      {/* Navigation Arrows */}
      <div className="absolute top-1/2 -left-4 sm:-left-6 lg:-left-12 -translate-y-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={prevSlide}
          className="p-3 sm:p-4 rounded-full bg-white shadow-xl text-slate-800 hover:bg-orange-600 hover:text-white transition-all transform hover:scale-110 active:scale-95 border border-slate-100"
          aria-label="Previous slide"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      <div className="absolute top-1/2 -right-4 sm:-right-6 lg:-right-12 -translate-y-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={nextSlide}
          className="p-3 sm:p-4 rounded-full bg-white shadow-xl text-slate-800 hover:bg-orange-600 hover:text-white transition-all transform hover:scale-110 active:scale-95 border border-slate-100"
          aria-label="Next slide"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Carousel Container */}
      <div className="overflow-hidden px-1">
        <div 
          className="flex transition-transform duration-700 ease-in-out gap-4 sm:gap-6 lg:gap-8"
          style={{ transform: `translateX(calc(-${currentIndex * 100}% / var(--slides-to-show, 1)))` }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {testimonials.map((t) => (
            <div 
              key={t.id} 
              className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
              style={{ '--slides-to-show': 1 } as React.CSSProperties}
            >
              <div className="group/card relative rounded-3xl overflow-hidden aspect-[4/5] shadow-lg border border-slate-100">
                <img 
                  src={t.image} 
                  alt={t.name} 
                  className="absolute inset-0 w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/10 to-transparent opacity-80 group-hover/card:opacity-90 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 translate-y-2 group-hover/card:translate-y-0 transition-transform">
                  <div className="w-8 h-1 bg-orange-500 mb-3 rounded-full"></div>
                  <p className="text-white font-black text-lg sm:text-xl tracking-tight">{t.name}</p>
                  <p className="text-orange-400 font-bold text-xs sm:text-sm uppercase tracking-widest mt-1">Placed at {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-10">
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`h-1.5 transition-all duration-300 rounded-full ${
              currentIndex === idx ? 'w-8 bg-orange-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      <style>{`
        @media (min-width: 640px) {
          .flex { --slides-to-show: 2; }
        }
        @media (min-width: 1024px) {
          .flex { --slides-to-show: 4; }
        }
      `}</style>
    </div>
  );
};

export default SuccessCarousel;
