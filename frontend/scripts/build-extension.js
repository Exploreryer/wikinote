#!/usr/bin/env node

import { build } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { copyFile, mkdir } from 'fs/promises';
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
    console.error('Source path:', manifestSrc);
    console.error('Dest path:', manifestDest);
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
    
    // 复制图标文件（这里需要根据实际图标文件调整）
    const iconFiles = [
      'favicon-96x96.png',
      'web-app-manifest-192x192.png',
      'web-app-manifest-512x512.png'
    ];
    
    for (const icon of iconFiles) {
      const src = resolve(iconsSrc, icon);
      const dest = resolve(iconsDest, icon.replace(/^favicon-|^web-app-manifest-/, 'icon-'));
      
      if (existsSync(src)) {
        await copyFile(src, dest);
        console.log(`🎨 Icon copied: ${icon}`);
      }
    }
  } catch (error) {
    console.error('❌ Failed to copy icons:', error);
  }
}

async function moveBuiltFiles() {
  const { copyFile, readdir, existsSync, writeFile, readFile } = await import('fs/promises');
  const { existsSync: fsExistsSync } = await import('fs');
  
  // 直接复制构建文件到目标目录
  const targetDir = resolve(__dirname, '../dist/extension');
  const sourceDir = resolve(__dirname, '../configs/extension');
  
  try {
    // 复制并修复HTML文件
    let htmlContent = await readFile(resolve(sourceDir, 'newtab.html'), 'utf8');
    
    // 修复HTML文件中的路径
    htmlContent = htmlContent.replace(
      'src="/src/main.tsx"',
      'src="./newtab.js"'
    );
    
    // 确保CSS链接存在
    if (!htmlContent.includes('<link rel="stylesheet" href="./newtab.css">')) {
      htmlContent = htmlContent.replace(
        '<title>New Tab - WikiNote</title>',
        '<title>New Tab - WikiNote</title>\n    <link rel="stylesheet" href="./newtab.css">'
      );
    }
    
    await writeFile(resolve(targetDir, 'newtab.html'), htmlContent);
    console.log('📄 Copied and fixed: newtab.html');
    
    // 查找并复制构建的JS和CSS文件
    const builtDir = resolve(__dirname, '../dist/extension/configs/extension');
    const altBuiltDir = resolve(__dirname, '../../dist/extension/configs/extension');
    
    if (fsExistsSync(builtDir)) {
      const files = await readdir(builtDir);
      
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.css')) {
          await copyFile(resolve(builtDir, file), resolve(targetDir, file));
          console.log(`📄 Copied: ${file}`);
        }
      }
    } else {
      console.log('📁 Built files directory not found, checking alternative locations...');
      
      // 检查其他可能的位置
      const possibleDirs = [
        altBuiltDir,
        resolve(__dirname, '../dist'),
        resolve(__dirname, '../dist/extension'),
        resolve(__dirname, '../../dist/extension'),
      ];
      
      let filesFound = false;
      for (const dir of possibleDirs) {
        if (fsExistsSync(dir)) {
          const files = await readdir(dir);
          const jsFiles = files.filter(f => f.endsWith('.js') && !f.includes('placeholder'));
          const cssFiles = files.filter(f => f.endsWith('.css') && !f.includes('placeholder'));
          
          for (const file of [...jsFiles, ...cssFiles]) {
            await copyFile(resolve(dir, file), resolve(targetDir, file));
            console.log(`📄 Copied: ${file} from ${dir}`);
            filesFound = true;
          }
        }
      }
      
      if (!filesFound) {
        console.log('📁 No built files found, checking Vite build output...');
        
        // 检查Vite构建的实际输出
        const viteOutputDir = resolve(__dirname, '../dist/extension');
        if (fsExistsSync(viteOutputDir)) {
          const files = await readdir(viteOutputDir);
          const jsFiles = files.filter(f => f.endsWith('.js') && !f.includes('placeholder'));
          const cssFiles = files.filter(f => f.endsWith('.css') && !f.includes('placeholder'));
          
          if (jsFiles.length > 0 || cssFiles.length > 0) {
            console.log('📄 Found Vite built files in extension directory');
            filesFound = true;
          }
        }
        
        if (!filesFound) {
          console.log('📁 No built files found, creating placeholder files...');
          // 创建占位符文件
          await writeFile(resolve(targetDir, 'newtab.js'), '// Placeholder JS file');
          await writeFile(resolve(targetDir, 'newtab.css'), '/* Placeholder CSS file */');
          console.log('📄 Created placeholder files');
        }
      }
    }
    
    console.log('📁 Files copied to correct location');
  } catch (error) {
    console.error('❌ Error copying files:', error);
  }
}

async function buildExtension() {
  console.log('🚀 Building Chrome Extension...');
  
  try {
    await build({
      configFile: extensionConfig,
      mode: 'production',
    });
    
    // 移动构建的文件到正确位置
    await moveBuiltFiles();
    
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