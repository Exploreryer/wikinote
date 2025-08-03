# WikiNote 项目结构说明

## 📁 整体项目结构

```
wikinote/
├── .gitignore                 # 项目级Git忽略规则
├── LICENSE                    # MIT开源许可证
├── README.md                  # 项目主文档
├── PROJECT_STRUCTURE.md       # 项目结构说明（本文件）
└── frontend/                  # 前端项目目录
    ├── .gitignore            # 前端Git忽略规则
    ├── package.json          # 项目依赖配置
    ├── package-lock.json     # 依赖锁定文件
    ├── tsconfig.json         # TypeScript配置
    ├── vite.config.ts        # Vite默认配置
    ├── eslint.config.js      # ESLint配置
    ├── index.html            # 默认HTML入口
    ├── bun.lock              # Bun锁定文件
    │
    ├── src/                  # 源代码目录
    │   ├── main.tsx         # 应用入口
    │   ├── App.tsx          # 主应用组件
    │   ├── index.css        # 全局样式
    │   ├── components/      # React组件
    │   ├── hooks/           # 自定义Hooks
    │   ├── contexts/        # React Contexts
    │   ├── utils/           # 工具函数
    │   ├── types/           # TypeScript类型定义
    │   ├── styles/          # 样式文件
    │   ├── assets/          # 静态资源
    │   ├── locales/         # 国际化文件
    │   └── languages.ts     # 语言配置
    │
    ├── configs/             # 构建配置目录
    │   ├── web/            # Web版本配置
    │   │   ├── vite.config.ts
    │   │   └── index.html
    │   └── extension/      # Chrome插件配置
    │       ├── vite.config.ts
    │       ├── manifest.json
    │       └── newtab.html
    │
    ├── scripts/            # 构建脚本目录
    │   ├── build-web.js    # Web版本构建脚本
    │   ├── build-extension.js # Chrome插件构建脚本
    │   ├── build-all.js    # 全版本构建脚本
    │   └── install-extension.js # 插件安装脚本
    │
    ├── public/             # 静态资源目录
    │   ├── favicon.ico
    │   ├── favicon.svg
    │   ├── manifest.json
    │   └── icons/
    │
    ├── dist/               # 构建输出目录
    │   ├── web/           # Web版本输出
    │   └── extension/     # Chrome插件输出
    │
    ├── node_modules/       # 依赖包（不提交到Git）
    │
    └── 文档文件
        ├── README.md              # 前端项目说明
        ├── BUILD_GUIDE.md         # 构建指南
        ├── CHROME_EXTENSION_INSTALL.md # 插件安装指南
        ├── IMPLEMENTATION_REVIEW.md    # 实现评估
        └── TESTING_GUIDE.md           # 测试指南
```

## 🎯 设计原则

### 1. 单代码库双构建
- **共享代码**：所有React代码都在 `src/` 目录
- **环境适配**：通过 `src/utils/environment.ts` 处理平台差异
- **配置分离**：Web和Extension使用不同的构建配置

### 2. 清晰的职责分离
- **源代码**：`src/` - 业务逻辑和UI组件
- **构建配置**：`configs/` - 不同环境的构建配置
- **构建脚本**：`scripts/` - 自动化构建流程
- **静态资源**：`public/` - 图标、字体等静态文件

### 3. 文档驱动
- **项目级文档**：整体项目说明和使用指南
- **技术文档**：构建、安装、测试等详细说明
- **最佳实践**：开发规范和注意事项

## 🔄 开发流程

1. **开发阶段**：在 `src/` 目录修改代码
2. **构建阶段**：运行构建脚本生成不同版本
3. **测试阶段**：分别测试Web和Extension版本
4. **部署阶段**：将构建产物部署到相应平台

## 📦 构建输出

### Web版本 (`dist/web/`)
- 完整的PWA应用
- 包含所有静态资源
- 可直接部署到Web服务器

### Chrome插件 (`dist/extension/`)
- 新标签页插件
- 包含manifest.json和图标
- 可直接加载到Chrome浏览器

## 🛠️ 技术栈

- **框架**：React 18 + TypeScript
- **样式**：Tailwind CSS
- **构建工具**：Vite
- **包管理**：npm/bun
- **代码规范**：ESLint

## 📝 注意事项

1. **依赖管理**：使用 `package-lock.json` 确保依赖版本一致
2. **类型安全**：TypeScript配置确保代码质量
3. **构建优化**：Vite提供快速的开发和构建体验
4. **环境适配**：自动处理Web和Extension的差异 