import { useState, useEffect, useRef } from 'react';
import { throttle } from '../utils/performance';

export function useScrollPosition(threshold: number = 10) {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLElement | Window | null>(null);

  useEffect(() => {
    // 查找滚动容器 - 优先查找有 overflow-y-scroll 的容器
    const findScrollContainer = (): HTMLElement | Window => {
      const containers = document.querySelectorAll('[class*="overflow-y-scroll"]');
      if (containers.length > 0) {
        return containers[0] as HTMLElement;
      }
      // 如果没有找到，回退到 window
      return window;
    };

    containerRef.current = findScrollContainer();

    const handleScroll = throttle(() => {
      let currentScrollY = 0;
      
      if (containerRef.current === window) {
        currentScrollY = window.scrollY;
      } else if (containerRef.current && 'scrollTop' in containerRef.current) {
        currentScrollY = (containerRef.current as HTMLElement).scrollTop;
      }
      
      setScrollY(currentScrollY);
      
      const shouldBeScrolled = currentScrollY > threshold;
      if (shouldBeScrolled !== isScrolled) {
        setIsScrolled(shouldBeScrolled);
      }
    }, 100);

    // 初始检查
    handleScroll();

    // 添加滚动监听
    if (containerRef.current) {
      containerRef.current.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [threshold, isScrolled]);

  return { scrollY, isScrolled };
}