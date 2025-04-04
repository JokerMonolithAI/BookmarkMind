# BookmarkMind 智能书签管理平台

## 当前开发阶段
用户认证和书签管理系统（基于 Firebase）

## 技术栈
- Next.js 14 (App Router)
- Firebase Authentication（用户认证）
- Firebase Realtime Database（实时数据库）
- Firebase Storage（文件存储）
- Tailwind CSS（样式框架）
- Shadcn/ui（UI组件库）

## 功能实现状态
- [x] 用户认证系统
  - [x] 邮箱注册
  - [x] 邮箱登录
  - [x] Google账号登录
  - [x] 密码重置
  - [x] 用户资料管理
- [x] 书签导入与解析
  - [x] 支持主流浏览器书签格式导入
  - [x] 自动解析书签URL、标题、描述等信息
  - [x] 书签去重功能
  - [x] 导入时智能分析书签内容
- [x] 数据管理
  - [x] 保存用户数据
  - [x] 获取用户数据
  - [x] 更新用户数据
  - [x] 删除用户数据
- [x] 书签统计功能
  - [x] 总书签数统计
  - [x] 本周新增统计
  - [ ] 分类统计
- [x] 智能分析与总结
  - [x] URL分析功能
  - [x] 内容提取
  - [x] 摘要生成
  - [x] 关键词提取
  - [x] 标签建议
- [x] 文档管理
  - [x] 为书签上传PDF文档
  - [x] 支持每个书签关联多个文档
  - [x] 文档上传进度显示
  - [x] 文档在线查看
  - [x] 文档删除功能
- [ ] 脑图生成与编辑
  - [ ] 自动生成脑图
  - [ ] 脑图编辑功能
  - [ ] 导出分享功能

## 项目结构
```
my-app/
├── app/                    # 应用主目录
│   ├── (auth)/            # 认证相关页面
│   │   ├── login/         # 登录页面
│   │   └── signup/        # 注册页面
│   ├── dashboard/         # 用户仪表板
│   └── layout.tsx         # 根布局组件
├── components/            # 可复用组件
│   ├── ui/                # UI组件
│   └── dashboard/         # 仪表板组件
│       ├── BookmarkList.tsx    # 书签列表组件
│       ├── BookmarkImport.tsx  # 书签导入组件
│       ├── BookmarkStats.tsx   # 书签统计组件
├── context/              # 上下文管理
│   ├── AuthContext.tsx   # 认证上下文
│   └── BookmarkContext.tsx # 书签上下文
├── lib/                  # 工具库
│   ├── firebase.ts      # Firebase配置
│   ├── bookmarkService.ts # 书签服务
│   └── apiService.ts    # API服务
└── public/              # 静态资源
```

## 最近更新
- 新增了书签PDF文档上传功能，支持为每个书签关联多个PDF文件
- 实现了文档上传进度显示和文件管理功能
- 优化了文件名处理，支持中文文件名安全上传
- 配置了Firebase Storage的CORS设置，解决了跨域问题
- 实现了书签的真实删除功能
- 优化了书签列表的显示和分页
- 添加了书签统计功能
- 修复了数据库路径问题
- 增强了错误处理和用户体验
- 新增了书签导入时的智能分析功能，支持内容提取、摘要生成、关键词提取和标签建议
- 集成了后端 API，实现了书签内容的智能分析

## 开始使用

### 环境要求
- Node.js 18.0.0 或更高版本
- npm 9.0.0 或更高版本

### 安装步骤
1. 克隆项目
```bash
git clone [项目地址]
cd my-app
```

2. 安装依赖
```bash
npm install

# Firebase 相关
npm install firebase firebase-auth

# UI 组件和工具库
npm install -D @shadcn/ui
npm install lucide-react
npm install next-themes
npm install tailwindcss-animate

# Radix UI 组件
npm install @radix-ui/react-dialog
npm install @radix-ui/react-select
npm install @radix-ui/react-checkbox
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-slot
npm install @radix-ui/react-progress @radix-ui/react-tooltip
npm install @radix-ui/react-alert-dialog

# 工具库
npm install class-variance-authority
npm install clsx
npm install tailwind-merge
```

3. 配置环境变量
复制 `.env.local.example` 文件为 `.env.local`，并填入你的 Firebase 配置信息：
```
NEXT_PUBLIC_FIREBASE_API_KEY=你的API密钥
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=你的授权域名
NEXT_PUBLIC_FIREBASE_PROJECT_ID=你的项目ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=你的存储桶
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=你的发送者ID
NEXT_PUBLIC_FIREBASE_APP_ID=你的应用ID
NEXT_PUBLIC_FIREBASE_DATABASE_URL=你的数据库URL
NEXT_PUBLIC_API_BASE_URL=你的API基础URL
```

4. 配置 Firebase Storage CORS 设置
为了支持文件上传功能，需要配置 Firebase Storage 的 CORS 设置：

a. 使用 Google Cloud SDK（推荐）:
```bash
# 安装 Google Cloud SDK
# 创建 cors.json 文件
[
  {
    "origin": ["http://localhost:3000", "https://your-production-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "maxAgeSeconds": 3600
  }
]

# 应用 CORS 配置
gsutil cors set cors.json gs://your-project-id.appspot.com
```

b. 或通过 Firebase 控制台手动配置 Storage 规则

5. 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 开发指南

### 目录结构说明
- `app/`: 包含所有页面和路由
- `components/`: 存放可复用的React组件
- `context/`: 存放React上下文
- `lib/`: 存放工具函数和配置文件

### 开发规范
1. 使用 TypeScript 进行开发
2. 遵循 Next.js 14 的最佳实践
3. 使用 Tailwind CSS 进行样式开发
4. 组件采用函数式编程
5. 保持代码整洁和注释完整

### 提交规范
提交信息格式：
```
type: subject

body
```
type 类型：
- feat: 新功能
- fix: 修复
- docs: 文档更改
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建过程或辅助工具的变动

## 部署
项目可以部署到 Vercel 平台：
1. 在 Vercel 上导入项目
2. 配置环境变量
3. 部署完成后即可访问

## 贡献指南
1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证
[MIT](https://opensource.org/licenses/MIT)

## 脑图功能

BookmarkMind 使用 [markmap](https://markmap.js.org/) 库来生成美观、高效的思维导图。markmap 是一个将 Markdown 转换为思维导图的库，具有以下特点：

1. **高性能**：markmap 使用 SVG 渲染，性能优异，即使处理大型思维导图也能保持流畅
2. **美观**：自动布局算法确保思维导图布局合理、美观
3. **交互性**：支持折叠/展开节点、缩放、拖动等交互操作
4. **易于定制**：支持自定义样式、颜色和布局

### 实现方式

我们的脑图功能主要包含以下组件：

1. **MarkMap.tsx**：核心组件，负责将 Markdown 渲染为思维导图
2. **MarkMapWithProvider.tsx**：包装组件，处理数据转换和状态管理
3. **mindmapToMarkdown.ts**：工具函数，将 API 响应数据转换为 Markdown 格式
4. **transformApiResponse.ts**：工具函数，将 API 响应数据转换为节点和边的格式

### 数据流

1. 用户点击"开始分析"按钮
2. 后端 API 返回书签分析结果
3. `transformApiResponseToMindMapData` 函数将 API 响应转换为节点和边的格式
4. `convertNodesAndEdgesToMarkdown` 函数将节点和边转换为 Markdown 格式
5. `MarkMap` 组件将 Markdown 渲染为思维导图
