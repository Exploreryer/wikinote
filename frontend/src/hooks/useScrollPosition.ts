import { useState, useEffect } from 'react';
import { throttle } from '../utils/performance';

export function useScrollPosition(threshold: number = 10) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = throttle(() => {
      const scrollY = window.scrollY;
      const shouldBeScrolled = scrollY > threshold;
      
      if (shouldBeScrolled !== isScrolled) {
        setIsScrolled(shouldBeScrolled);
      }
    }, 100);

    // 初始检查
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold, isScrolled]);

  return isScrolled;
}