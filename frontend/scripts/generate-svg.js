#!/usr/bin/env node

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 源图标路径
const sourceIcon = resolve(__dirname, '../assets/logo/wikinote-logo 512.png');
const outputSVG = resolve(__dirname, '../public/favicon.svg');

async function generateSVG() {
  console.log('🎨 开始生成新的SVG图标...');
  console.log(`📁 源文件: ${sourceIcon}`);
  console.log(`📁 输出文件: ${outputSVG}`);
  
  // 检查源文件是否存在
  if (!existsSync(sourceIcon)) {
    console.error('❌ 源图标文件不存在:', sourceIcon);
    process.exit(1);
  }
  
  try {
    // 将PNG转换为base64
    const buffer = await sharp(sourceIcon)
      .resize(32, 32, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    
    const base64 = buffer.toString('base64');
    
    // 生成SVG内容
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="rounded-corners">
      <rect width="32" height="32" rx="6" ry="6"/>
    </clipPath>
  </defs>
  <image 
    width="32" 
    height="32" 
    href="data:image/png;base64,${base64}"
    clip-path="url(#rounded-corners)"
  />
</svg>`;
    
    // 写入SVG文件
    writeFileSync(outputSVG, svgContent, 'utf8');
    
    console.log('✅ SVG图标生成成功!');
    console.log(`📁 输出位置: ${outputSVG}`);
    console.log('🎯 特性:');
    console.log('- 32x32 尺寸，适合favicon使用');
    console.log('- 保持圆角效果');
    console.log('- 基于您的512x512 PNG生成');
    console.log('- 内嵌base64数据，无需外部依赖');
    
  } catch (error) {
    console.error('❌ SVG生成失败:', error);
    process.exit(1);
  }
}

// 执行生成
generateSVG().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
}); 