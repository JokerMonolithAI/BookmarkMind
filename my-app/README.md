# BookmarkMind 智能书签管理平台

## 当前开发阶段
用户认证和管理系统（基于 Firebase）

## 技术栈
- Next.js 14 (App Router)
- Firebase Authentication（用户认证）
- Firebase Realtime Database（实时数据库）
- Tailwind CSS（样式框架）
- Shadcn/ui（UI组件库）

## 功能实现状态
- [ ] 用户认证系统
  - [ ] 邮箱注册
  - [ ] 邮箱登录
  - [ ] Google账号登录
  - [ ] 密码重置
  - [ ] 用户资料管理
- [ ] 数据管理
  - [ ] 保存用户数据
  - [ ] 获取用户数据
  - [ ] 更新用户数据

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
├── context/              # 上下文管理
│   └── AuthContext.tsx   # 认证上下文
├── lib/                  # 工具库
│   └── firebase.ts      # Firebase配置
└── public/              # 静态资源
```

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
npm install firebase
npm install firebase-auth
npm install lucide-react @radix-ui/react-slot class-variance-authority clsx tailwind-merge
npm install next-themes
npm install -D @shadcn/ui
npm install @radix-ui/react-dialog @radix-ui/react-select lucide-react
npm install clsx tailwind-merge
npm install @radix-ui/react-checkbox
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
```

4. 启动开发服务器
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
