#!/usr/bin/env node

import { build } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { copyFile, mkdir, readdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const extensionConfig = resolve(__dirname, '../configs/extension/vite.config.ts');

async function copyManifest() {
  const manifestSrc = resolve(__dirname, '../configs/extension/manifest.json');
  const manifestDest = resolve(__dirname, '../dist/extension/manifest.json');
  
  try {
    await copyFile(manifestSrc, manifestDest);
    console.log('📄 Manifest.json copied');
  } catch (error) {
    console.error('❌ Failed to copy manifest.json:', error);
  }
}

async function copyIcons() {
  const iconsSrc = resolve(__dirname, '../public');
  const iconsDest = resolve(__dirname, '../dist/extension/icons');
  
  try {
    // 确保icons目录存在
    if (!existsSync(iconsDest)) {
      await mkdir(iconsDest, { recursive: true });
    }
    
    // 复制图标文件并生成所需尺寸
    const iconMappings = [
      { src: 'favicon-96x96.png', dest: 'icon-16.png' },
      { src: 'favicon-96x96.png', dest: 'icon-32.png' },
      { src: 'favicon-96x96.png', dest: 'icon-48.png' },
      { src: 'favicon-96x96.png', dest: 'icon-96.png' },
      { src: 'favicon-96x96.png', dest: 'icon-128.png' },
      { src: 'web-app-manifest-192x192.png', dest: 'icon-192.png' },
      { src: 'web-app-manifest-512x512.png', dest: 'icon-512.png' }
    ];
    
    for (const { src: srcFile, dest: destFile } of iconMappings) {
      const src = resolve(iconsSrc, srcFile);
      const dest = resolve(iconsDest, destFile);
      
      if (existsSync(src)) {
        await copyFile(src, dest);
        console.log(`🎨 Icon copied: ${srcFile} -> ${destFile}`);
      }
    }
  } catch (error) {
    console.error('❌ Failed to copy icons:', error);
  }
}

async function copyBuiltFiles() {
  const targetDir = resolve(__dirname, '../dist/extension');
  
  try {
    // 查找构建的文件 - Vite输出到相对路径
    const possibleSourceDirs = [
      resolve(__dirname, '../dist/extension/configs/extension'),
      resolve(__dirname, '../../dist/extension/configs/extension'),
      resolve(__dirname, '../dist/extension'),
      resolve(__dirname, '../dist'),
      resolve(__dirname, '../../dist/extension'),
    ];
    
    let sourceDir = null;
    for (const dir of possibleSourceDirs) {
      if (existsSync(dir)) {
        const files = await readdir(dir);
        if (files.some(f => f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.css'))) {
          sourceDir = dir;
          break;
        }
      }
    }
    
    if (!sourceDir) {
      throw new Error('No built files found');
    }
    
    console.log(`📁 Found built files in: ${sourceDir}`);
    
    // 复制HTML文件
    const htmlSrc = resolve(sourceDir, 'newtab.html');
    const htmlDest = resolve(targetDir, 'newtab.html');
    
    if (existsSync(htmlSrc)) {
      let htmlContent = await readFile(htmlSrc, 'utf8');
      
      // 修复HTML文件中的路径
      htmlContent = htmlContent.replace(
        'src="/src/main.tsx"',
        'src="./newtab.js"'
      );
      
      await writeFile(htmlDest, htmlContent);
      console.log('📄 Copied and fixed: newtab.html');
    }
    
    // 复制JS和CSS文件
    const files = await readdir(sourceDir);
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        const src = resolve(sourceDir, file);
        const dest = resolve(targetDir, file);
        await copyFile(src, dest);
        console.log(`📄 Copied: ${file}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error copying built files:', error);
    throw error;
  }
}

async function buildExtension() {
  console.log('🚀 Building Chrome Extension...');
  
  try {
    // 确保目标目录存在
    const targetDir = resolve(__dirname, '../dist/extension');
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }
    
    // 构建项目
    await build({
      configFile: extensionConfig,
      mode: 'production',
    });
    
    // 复制构建的文件
    await copyBuiltFiles();
    
    // 复制必要的文件
    await copyManifest();
    await copyIcons();
    
    console.log('✅ Extension build completed successfully!');
    console.log('📁 Output: dist/extension/');
    console.log('💡 To load in Chrome:');
    console.log('   1. Open chrome://extensions/');
    console.log('   2. Enable "Developer mode"');
    console.log('   3. Click "Load unpacked"');
    console.log('   4. Select the dist/extension folder');
  } catch (error) {
    console.error('❌ Extension build failed:', error);
    process.exit(1);
  }
}

buildExtension(); 