"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the current viewport is mobile-sized.
 * Uses the same breakpoint as the SCSS variables ($breakpoint-md = 768px).
 *
 * @param breakpoint - The max-width breakpoint in pixels (default: 768)
 * @returns boolean indicating if viewport is mobile-sized
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check initial state
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Set initial value
    checkMobile();

    // Listen for resize events
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [breakpoint]);

  return isMobile;
}

export default useIsMobile;
