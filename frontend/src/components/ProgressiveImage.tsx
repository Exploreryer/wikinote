import { useState, useEffect, useRef, useCallback } from 'react';
import { getProgressiveImageSources, preloadImage } from '../utils/images';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: (error: Event) => void;
  style?: React.CSSProperties;
}

type LoadingState = 'initial' | 'entering' | 'lowRes' | 'mediumRes' | 'highRes' | 'loaded' | 'error';

export function ProgressiveImage({ 
  src, 
  alt, 
  className = '', 
  sizes,
  onLoad,
  onError,
  style = {}
}: ProgressiveImageProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>('initial');
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const sources = getProgressiveImageSources(src);

  // 清理所有 timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
  }, []);

  // 增强的 Intersection Observer，更早触发加载
  useEffect(() => {
    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            // 立即开始渐显动画
            setIsVisible(true);
            setLoadingState('entering');
            
            // 更柔和的延迟后开始透明度动画
            const fadeInTimeout = setTimeout(() => {
              setOpacity(0.05); // 非常轻微的初始透明度
            }, 150); // 延长到 150ms
            timeoutsRef.current.push(fadeInTimeout);
            
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '300px', // 提前 300px 开始加载，给更多时间进行渐显
        threshold: [0, 0.05, 0.1, 0.2] // 更多阈值，更精确控制
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  // 重新设计的丝滑加载序列
  useEffect(() => {
    if (!isVisible) return;

    let isCancelled = false;
    clearAllTimeouts();

    const loadSequence = async () => {
      try {
        // 阶段 1: 立即显示占位符，缓慢开始渐显
        setCurrentSrc(sources.placeholder);
        
        const step1Timeout = setTimeout(() => {
          if (!isCancelled) setOpacity(0.2); // 更低的初始透明度
        }, 300); // 延长到 300ms
        timeoutsRef.current.push(step1Timeout);

        // 阶段 2: 预加载低分辨率图片
        await preloadImage(sources.lowRes);
        if (isCancelled) return;
        
        setCurrentSrc(sources.lowRes);
        setLoadingState('lowRes');
        
        const step2Timeout = setTimeout(() => {
          if (!isCancelled) setOpacity(0.45); // 更柔和的透明度递增
        }, 600); // 延长到 600ms
        timeoutsRef.current.push(step2Timeout);

        // 阶段 3: 预加载中分辨率图片  
        await preloadImage(sources.mediumRes);
        if (isCancelled) return;
        
        setCurrentSrc(sources.mediumRes);
        setLoadingState('mediumRes');
        
        const step3Timeout = setTimeout(() => {
          if (!isCancelled) setOpacity(0.7); // 更柔和的透明度递增
        }, 900); // 延长到 900ms
        timeoutsRef.current.push(step3Timeout);

        // 阶段 4: 预加载高分辨率图片
        await preloadImage(sources.highRes);
        if (isCancelled) return;
        
        setCurrentSrc(sources.highRes);
        setLoadingState('highRes');
        
        const step4Timeout = setTimeout(() => {
          if (!isCancelled) setOpacity(0.9); // 更柔和的透明度递增
        }, 1200); // 延长到 1200ms
        timeoutsRef.current.push(step4Timeout);

        // 阶段 5: 最终完整图片，完全不透明
        await preloadImage(sources.fullRes);
        if (isCancelled) return;
        
        setCurrentSrc(sources.fullRes);
        setLoadingState('loaded');
        
        const finalTimeout = setTimeout(() => {
          if (!isCancelled) {
            setOpacity(1);
            onLoad?.();
          }
        }, 1500); // 延长到 1500ms，最终完成
        timeoutsRef.current.push(finalTimeout);

      } catch (error) {
        if (!isCancelled) {
          setLoadingState('error');
          setOpacity(0.7); // 错误状态也要有透明度
          onError?.(error as Event);
        }
      }
    };

    loadSequence();

    return () => {
      isCancelled = true;
      clearAllTimeouts();
    };
  }, [isVisible, sources, onLoad, onError, clearAllTimeouts]);

  const getImageClasses = () => {
    const baseClasses = `progressive-image-premium ${className}`;
    return `${baseClasses} progressive-state-${loadingState}`;
  };

  const getImageStyle = (): React.CSSProperties => {
    const baseStyle = {
      // 使用更柔和的过渡效果 - 延长持续时间并优化缓动曲线
      transition: 'all 1200ms cubic-bezier(0.23, 1, 0.32, 1), opacity 1000ms cubic-bezier(0.23, 1, 0.32, 1)',
      willChange: 'filter, transform, opacity',
      opacity,
      ...style
    };

    switch (loadingState) {
      case 'initial':
        return {
          ...baseStyle,
          opacity: 0,
          filter: 'blur(30px) saturate(120%)',
          transform: 'scale(1.1)',
        };
      case 'entering':
        return {
          ...baseStyle,
          filter: 'blur(25px) saturate(115%)',
          transform: 'scale(1.08)',
        };
      case 'lowRes':
        return {
          ...baseStyle,
          filter: 'blur(18px) saturate(110%)',
          transform: 'scale(1.04)',
        };
      case 'mediumRes':
        return {
          ...baseStyle,
          filter: 'blur(10px) saturate(105%)',
          transform: 'scale(1.02)',
        };
      case 'highRes':
        return {
          ...baseStyle,
          filter: 'blur(3px) saturate(102%)',
          transform: 'scale(1.01)',
        };
      case 'loaded':
        return {
          ...baseStyle,
          filter: 'blur(0px) saturate(100%)',
          transform: 'scale(1)',
        };
      case 'error':
        return {
          ...baseStyle,
          filter: 'grayscale(100%) brightness(80%)',
          transform: 'scale(1)',
        };
      default:
        return baseStyle;
    }
  };

  return (
    <img
      ref={imgRef}
      src={currentSrc || sources.placeholder}
      alt={alt}
      className={getImageClasses()}
      style={getImageStyle()}
      sizes={sizes}
      loading="lazy"
      decoding="async"
    />
  );
}
