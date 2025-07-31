

import { useState, useEffect } from 'react';

export function SkeletonCard() {
  return (
    <div className="wiki-card animate-pulse">
      {/* 图片骨架 - 调整为50%高度 */}
      <div className="wiki-card-image bg-gradient-to-br from-gray-50 to-gray-100 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
      </div>
      
      {/* 内容骨架 */}
      <div className="wiki-card-content">
        {/* 标题骨架 */}
        <div className="space-y-2 mb-4">
          <div className="h-5 bg-gray-50 rounded animate-pulse"></div>
          <div className="h-5 bg-gray-50 rounded w-3/4 animate-pulse"></div>
        </div>
        
        {/* 描述骨架 */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-50 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-50 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-50 rounded w-2/3 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  // 直接渲染骨架屏卡片，使用父容器的网格布局
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </>
  );
}

// 加载更多时的骨架屏组件
export function LoadingSkeletonCards() {
  const [skeletonCount, setSkeletonCount] = useState(4);

  useEffect(() => {
    const updateSkeletonCount = () => {
      const width = window.innerWidth;
      if (width >= 1200) {
        setSkeletonCount(4); // 大屏幕4个
      } else if (width >= 768) {
        setSkeletonCount(3); // 中等屏幕3个
      } else {
        setSkeletonCount(2); // 小屏幕2个
      }
    };

    updateSkeletonCount();
    window.addEventListener('resize', updateSkeletonCount);
    return () => window.removeEventListener('resize', updateSkeletonCount);
  }, []);

  return (
    <>
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <SkeletonCard key={`loading-${index}`} />
      ))}
    </>
  );
} 