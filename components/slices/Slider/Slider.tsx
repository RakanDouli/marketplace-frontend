'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Slider.module.scss';

interface SliderProps {
  children: React.ReactNode;
  slidesToShow?: number;
  slidesToShowTablet?: number;
  slidesToShowMobile?: number;
  showArrows?: boolean;
  showDots?: boolean;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  children,
  slidesToShow = 3,
  slidesToShowTablet = 2,
  slidesToShowMobile = 1,
  showArrows = true,
  showDots = true,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(slidesToShow);

  // Convert children to array
  const slides = React.Children.toArray(children);
  const totalSlides = slides.length;

  // Responsive slides per view
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setSlidesPerView(slidesToShowMobile);
      } else if (width < 1024) {
        setSlidesPerView(slidesToShowTablet);
      } else {
        setSlidesPerView(slidesToShow);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [slidesToShow, slidesToShowTablet, slidesToShowMobile]);

  // Reset currentIndex if it exceeds valid range
  useEffect(() => {
    const maxIndex = Math.max(0, totalSlides - slidesPerView);
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [currentIndex, totalSlides, slidesPerView]);

  const maxIndex = Math.max(0, totalSlides - slidesPerView);
  const totalPages = Math.ceil(totalSlides / slidesPerView);
  const currentPage = Math.floor(currentIndex / slidesPerView);

  const goToPrevious = () => {
    setCurrentIndex((prev) => {
      const remainingSlides = totalSlides - (prev + slidesPerView);
      if (remainingSlides <= 0) return prev;

      const moveBy = Math.min(slidesPerView, remainingSlides);
      return Math.min(maxIndex, prev + moveBy);
    });
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.max(0, prev - slidesPerView));
  };

  const goToPage = (pageIndex: number) => {
    setCurrentIndex(pageIndex * slidesPerView);
  };

  // RTL: Use positive translation (moves content right when index increases)
  // Each slide is exactly (100 / slidesPerView)% wide
  const slideWidthPercent = 100 / slidesPerView;
  const translatePercentage = currentIndex * slideWidthPercent;

  if (totalSlides === 0) {
    return null;
  }

  return (
    <div className={`${styles.sliderContainer} ${className || ''}`}>
      <div className={styles.sliderWrapper}>
        {/* Previous Arrow - Left side (RTL: left arrow = go forward) */}
        {showArrows && totalSlides > slidesPerView && (
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowPrev}`}
            onClick={goToPrevious}
            disabled={currentIndex >= maxIndex}
            aria-label="السابق"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Slider Track */}
        <div className={styles.sliderTrack}>
          <div
            className={styles.sliderInner}
            style={{
              transform: `translateX(${translatePercentage}%)`,
            }}
          >
            {slides.map((slide, index) => (
              <div
                key={index}
                className={styles.slide}
                style={{
                  width: `${slideWidthPercent}%`,
                }}
              >
                <div className={styles.slideInner}>
                  {slide}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Arrow - Right side (RTL: right arrow = go back) */}
        {showArrows && totalSlides > slidesPerView && (
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowNext}`}
            onClick={goToNext}
            disabled={currentIndex === 0}
            aria-label="التالي"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Dots Navigation */}
      {showDots && totalSlides > slidesPerView && totalPages > 1 && (
        <div className={styles.dots}>
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              className={`${styles.dot} ${pageIndex === currentPage ? styles.active : ''}`}
              onClick={() => goToPage(pageIndex)}
              aria-label={`الصفحة ${pageIndex + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
