# Wikinote - 双构建系统

这是一个支持同时构建Web版本和Chrome插件版本的项目，你只需要维护一套代码！

## 🚀 快速开始

### 开发模式
```bash
npm run dev
```

### 构建所有版本
```bash
npm run build:all
```

### 只构建Web版本
```bash
npm run build:web
```

### 只构建Chrome插件版本
```bash
npm run build:extension
```

## 📁 项目结构

```
frontend/
├── src/                    # 共享的React代码
├── configs/               # 构建配置
│   ├── web/              # Web版本配置
│   └── extension/        # Chrome插件配置
├── scripts/              # 构建脚本
└── dist/                 # 构建输出
    ├── web/             # Web版本输出
    └── extension/       # Chrome插件输出
```

## 🔧 开发流程

1. **修改代码**：只需要在 `src/` 目录下修改代码
2. **构建**：运行 `npm run build:all` 生成两个版本
3. **测试**：
   - Web版本：部署 `dist/web/` 到服务器
   - Chrome插件：在Chrome中加载 `dist/extension/` 文件夹

## 🧪 测试Chrome插件

1. 打开 `chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `dist/extension/` 文件夹
5. 打开新标签页测试效果

## 🔄 环境适配

代码中使用了环境适配层，自动处理Web和Extension的差异：

- **存储**：Web使用localStorage，Extension使用Chrome Storage
- **网络请求**：Extension环境自动添加必要的headers
- **分析**：Web使用Vercel Analytics，Extension跳过

## 📝 注意事项

1. **图标文件**：确保 `public/` 目录下有必要的图标文件
2. **权限**：Extension的权限在 `configs/extension/manifest.json` 中配置
3. **CORS**：Extension的网络请求会自动处理CORS问题

## 🐛 常见问题

### 构建失败
- 检查TypeScript编译错误：`npm run lint`
- 确保所有依赖已安装：`npm install`

### Extension加载失败
- 检查manifest.json语法
- 确保图标文件存在
- 查看Chrome扩展页面的错误信息

### 网络请求失败
- 检查host_permissions配置
- 确认API端点可访问

## 🎯 最佳实践

1. **代码修改**：始终在 `src/` 目录下修改
2. **配置修改**：根据需要调整 `configs/` 下的配置文件
3. **测试**：每次修改后都测试两个版本
4. **版本管理**：同时更新Web和Extension的版本号

## 📦 构建输出

- **Web版本**：`dist/web/` - 包含完整的PWA应用
- **Chrome插件**：`dist/extension/` - 包含新标签页插件

两个版本都使用相同的React代码，通过环境适配层自动处理平台差异。
