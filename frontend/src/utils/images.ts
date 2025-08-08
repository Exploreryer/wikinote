/**
 * Derive a lower-resolution Wikimedia thumbnail URL from a higher-res one.
 * Example: .../thumb/.../800px-File.jpg -> .../thumb/.../160px-File.jpg
 */
export function getLowResThumbnail(originalUrl: string, width: number = 160): string {
  try {
    const url = new URL(originalUrl);
    if (!url.host.includes('upload.wikimedia.org') || !url.pathname.includes('/thumb/')) {
      return originalUrl;
    }
    const replaced = url.pathname.replace(/\/(\d+)px-/i, `/${width}px-`);
    url.pathname = replaced;
    return url.toString();
  } catch {
    return originalUrl;
  }
}

/**
 * Generate a premium base64 placeholder with sophisticated gradient
 * Creates a beautiful, organic-looking blur that mimics real image content
 */
export function generateBlurPlaceholder(color: string = '#f3f4f6'): string {
  // 生成多个颜色变体以模拟真实图片的色彩层次
  const colors = [
    '#f8fafc', // 浅灰蓝
    '#e2e8f0', // 中性灰
    '#cbd5e1', // 偏蓝灰
    '#94a3b8', // 深灰蓝
    color       // 用户指定颜色
  ];

  // 创建一个复杂的 40x40 SVG，模拟真实图片的有机感
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- 主渐变 -->
        <radialGradient id="mainGrad" cx="30%" cy="20%" r="60%">
          <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:0.9" />
          <stop offset="35%" style="stop-color:${colors[1]};stop-opacity:0.7" />
          <stop offset="70%" style="stop-color:${colors[2]};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${colors[3]};stop-opacity:0.6" />
        </radialGradient>
        
        <!-- 辅助渐变增加层次 -->
        <linearGradient id="overlayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors[4]};stop-opacity:0.3" />
          <stop offset="50%" style="stop-color:${colors[1]};stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:${colors[0]};stop-opacity:0.4" />
        </linearGradient>
        
        <!-- 精细的高斯模糊 -->
        <filter id="premiumBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
        </filter>
        
        <!-- 轻微的噪点纹理 -->
        <filter id="texture" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence baseFrequency="0.9" numOctaves="1" seed="1" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="0.05 0.1 0.05"/>
          </feComponentTransfer>
          <feComposite operator="over" in2="SourceGraphic"/>
        </filter>
      </defs>
      
      <!-- 主背景 -->
      <rect width="100%" height="100%" fill="url(#mainGrad)" filter="url(#premiumBlur)"/>
      
      <!-- 叠加层增加深度 -->
      <rect width="100%" height="100%" fill="url(#overlayGrad)" opacity="0.6"/>
      
      <!-- 轻微纹理（可选） -->
      <rect width="100%" height="100%" fill="${colors[2]}" filter="url(#texture)" opacity="0.1"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Preload an image and return a promise that resolves when loaded
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Generate progressive image sources for blur-up effect
 */
export function getProgressiveImageSources(originalUrl: string) {
  return {
    placeholder: generateBlurPlaceholder(),
    lowRes: getLowResThumbnail(originalUrl, 40), // Very low res for quick load
    mediumRes: getLowResThumbnail(originalUrl, 160),
    highRes: getLowResThumbnail(originalUrl, 320),
    fullRes: originalUrl
  };
}


