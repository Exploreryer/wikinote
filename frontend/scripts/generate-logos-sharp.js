#!/usr/bin/env node

import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 检查是否安装了Sharp
async function checkSharp() {
  try {
    const sharp = await import('sharp');
    return sharp;
  } catch (error) {
    return null;
  }
}

// 生成不同尺寸的PNG图标
async function generatePNGIcons() {
  const sharp = await checkSharp();
  if (!sharp) {
    console.error('❌ 未检测到Sharp库，请先安装: npm install sharp');
    return false;
  }

  const sourceLogo = resolve(__dirname, '../assets/logo/logo.png');
  const publicDir = resolve(__dirname, '../public');
  const extensionIconsDir = resolve(__dirname, '../dist/extension/icons');
  
  if (!existsSync(sourceLogo)) {
    console.error('❌ Logo文件不存在:', sourceLogo);
    return false;
  }

  const iconSizes = [
    { name: 'favicon-96x96.png', size: 96, dest: publicDir },
    { name: 'apple-touch-icon.png', size: 180, dest: publicDir },
    { name: 'web-app-manifest-192x192.png', size: 192, dest: publicDir },
    { name: 'web-app-manifest-512x512.png', size: 512, dest: publicDir },
    { name: 'icon-16.png', size: 16, dest: extensionIconsDir },
    { name: 'icon-32.png', size: 32, dest: extensionIconsDir },
    { name: 'icon-48.png', size: 48, dest: extensionIconsDir },
    { name: 'icon-128.png', size: 128, dest: extensionIconsDir },
    { name: 'icon-192x192.png', size: 192, dest: extensionIconsDir },
    { name: 'icon-512x512.png', size: 512, dest: extensionIconsDir },
  ];

  console.log('🎨 开始生成PNG图标...');

  for (const icon of iconSizes) {
    try {
      // 确保目标目录存在
      if (!existsSync(icon.dest)) {
        await mkdir(icon.dest, { recursive: true });
      }

      const destPath = resolve(icon.dest, icon.name);
      
      // 使用Sharp生成图标
      await sharp.default(sourceLogo)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(destPath);
      
      console.log(`✅ 生成: ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ 生成失败 ${icon.name}:`, error.message);
    }
  }

  return true;
}

// 生成ICO文件（简化版本，使用PNG替代）
async function generateICO() {
  const sharp = await checkSharp();
  if (!sharp) return false;

  const sourceLogo = resolve(__dirname, '../assets/logo/logo.png');
  const destICO = resolve(__dirname, '../public/favicon.ico');
  
  try {
    // 由于ICO格式复杂，我们先生成一个16x16的PNG作为favicon
    await sharp.default(sourceLogo)
      .resize(16, 16, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(destICO.replace('.ico', '-16x16.png'));
    
    console.log('✅ 生成: favicon-16x16.png (替代ICO)');
    return true;
  } catch (error) {
    console.error('❌ 生成ICO失败:', error.message);
    return false;
  }
}

// 生成SVG文件（简化版本）
async function generateSVG() {
  const sharp = await checkSharp();
  if (!sharp) return false;

  const sourceLogo = resolve(__dirname, '../assets/logo/logo.png');
  const destSVG = resolve(__dirname, '../public/favicon.svg');
  
  try {
    // 创建一个简单的SVG占位符
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <image href="data:image/png;base64,${await getBase64Image(sourceLogo)}" width="64" height="64"/>
</svg>`;
    
    const fs = await import('fs/promises');
    await fs.writeFile(destSVG, svgContent);
    
    console.log('✅ 生成: favicon.svg');
    return true;
  } catch (error) {
    console.error('❌ 生成SVG失败:', error.message);
    return false;
  }
}

// 获取图片的base64编码
async function getBase64Image(imagePath) {
  const fs = await import('fs/promises');
  const buffer = await fs.readFile(imagePath);
  return buffer.toString('base64');
}

// 备份现有文件
async function backupExistingFiles() {
  const publicDir = resolve(__dirname, '../public');
  const backupDir = resolve(__dirname, '../assets/logo/backup');
  
  try {
    if (!existsSync(backupDir)) {
      await mkdir(backupDir, { recursive: true });
    }

    const filesToBackup = [
      'favicon.svg',
      'favicon-96x96.png',
      'apple-touch-icon.png',
      'favicon.ico',
      'web-app-manifest-192x192.png',
      'web-app-manifest-512x512.png'
    ];

    for (const file of filesToBackup) {
      const sourcePath = resolve(publicDir, file);
      const backupPath = resolve(backupDir, file);
      
      if (existsSync(sourcePath)) {
        await copyFile(sourcePath, backupPath);
        console.log(`📦 备份: ${file}`);
      }
    }

    console.log('✅ 现有文件已备份到 assets/logo/backup/');
  } catch (error) {
    console.error('❌ 备份失败:', error.message);
  }
}

// 主函数
async function generateLogos() {
  console.log('🚀 开始批量处理Logo...');
  
  try {
    // 备份现有文件
    await backupExistingFiles();
    
    // 生成PNG图标
    await generatePNGIcons();
    
    // 生成ICO文件
    await generateICO();
    
    // 生成SVG文件
    await generateSVG();
    
    console.log('\n🎉 Logo批量处理完成！');
    console.log('📁 生成的文件位置:');
    console.log('   - Web图标: frontend/public/');
    console.log('   - 扩展图标: frontend/dist/extension/icons/');
    console.log('   - 备份文件: frontend/assets/logo/backup/');
    
  } catch (error) {
    console.error('❌ 处理失败:', error.message);
  }
}

generateLogos(); 