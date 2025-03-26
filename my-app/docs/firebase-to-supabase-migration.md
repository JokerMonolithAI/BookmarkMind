# Firebase 到 Supabase 迁移指南

本文档提供了将 BookmarkMind 应用从 Firebase 迁移到 Supabase 的步骤和说明。

## 目录

1. [准备工作](#准备工作)
2. [Supabase 项目设置](#supabase-项目设置)
3. [数据库迁移](#数据库迁移)
4. [认证迁移](#认证迁移)
5. [环境变量更新](#环境变量更新)
6. [代码迁移](#代码迁移)
7. [测试和验证](#测试和验证)
8. [问题排查](#问题排查)

## 准备工作

迁移前需要做的准备：

1. **备份 Firebase 数据**：确保您有所有 Firebase 数据的备份
2. **获取 Firebase 数据结构**：了解当前的数据结构和关系
3. **安装依赖**：确保已安装 Supabase SDK
   ```bash
   npm install @supabase/supabase-js
   ```

## Supabase 项目设置

1. **创建 Supabase 项目**：
   - 访问 [Supabase 控制台](https://app.supabase.io/)
   - 创建新项目
   - 记下项目 URL 和 anon key

2. **配置邮箱验证**：
   - 在 Supabase 控制台中，导航至 `Authentication` > `Providers`
   - 启用 Email 提供商

3. **配置 Google OAuth**：
   - 在 `Authentication` > `Providers` 中启用 Google
   - 配置 Google 客户端 ID 和密钥
   - 添加授权回调 URL：`https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback`

## 数据库迁移

### 创建 Supabase 表结构

使用项目中的 `lib/supabase-schema.sql` 在 Supabase 中创建数据库表：

1. 打开 Supabase 控制台中的 SQL 编辑器
2. 复制并粘贴 `supabase-schema.sql` 的内容
3. 运行 SQL 脚本以创建表和安全策略

### 从 Firebase 导出数据

您可以使用 Firebase Admin SDK 导出数据，或者使用 Firebase 控制台导出 JSON 数据。

### 数据转换

将 Firebase 数据转换为 Supabase 格式。建议创建一个转换脚本，以处理：

- 数据结构转换（嵌套 → 关系型）
- 日期格式转换
- ID 映射和关系保持

## 认证迁移

### 用户迁移

Supabase 不支持直接导入 Firebase 用户，因此有两种方法：

1. **渐进式迁移**：保持两个认证系统并行运行，当用户登录时创建新的 Supabase 账户
2. **一次性迁移**：要求所有用户重置密码

### 代码更新

1. 安装 Supabase 客户端：
   ```bash
   npm install @supabase/supabase-js
   ```

2. 创建 Supabase 客户端文件 (`lib/supabase.ts`)：
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
   const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

3. 更新认证相关页面：
   - `app/(auth)/login/page.tsx`
   - `app/(auth)/signup/page.tsx`
   - `app/(auth)/forgot-password/page.tsx`
   - 创建 `app/(auth)/reset-password/page.tsx`

4. 更新认证上下文 (`context/AuthContext.tsx`)

## 环境变量更新

在 `.env.local` 文件中添加 Supabase 配置：

```
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 代码迁移

1. 更新书签服务：
   - 创建 `lib/supabaseBookmarkService.ts` 以替代 `lib/bookmarkService.ts`
   - 更新 `context/BookmarkContext.tsx` 以使用新的服务

2. 处理数据访问代码：
   - 更新所有使用 Firebase 数据的组件
   - 替换 Firebase 实时更新为 Supabase 实时更新（如需要）

## 测试和验证

1. **功能测试**：
   - 用户注册/登录
   - 书签 CRUD 操作
   - 书签分类
   - 收藏集功能

2. **性能测试**：
   - 加载时间
   - 查询响应速度

3. **安全测试**：
   - RLS 策略正常工作
   - 认证流程安全

## 问题排查

### 常见问题

#### 1. "Permission denied" 错误

- **原因**：可能是 RLS 策略问题或认证状态不正确
- **解决方案**：
  - 检查 RLS 策略配置
  - 确认用户已正确登录
  - 验证数据请求中的 user_id 匹配当前认证用户

#### 2. 数据不显示

- **原因**：表结构不匹配或查询错误
- **解决方案**：
  - 检查列名是否正确（蛇形命名 vs 驼峰命名）
  - 验证查询条件
  - 检查数据是否成功导入

#### 3. 认证问题

- **原因**：配置错误或流程问题
- **解决方案**：
  - 检查 OAuth 配置
  - 查看 Supabase 日志了解失败详情
  - 确保重定向 URL 正确配置

## 结论

迁移 Firebase 到 Supabase 需要细致的规划和测试。按照本指南的步骤，您可以成功完成迁移，同时保持应用的功能和性能。如有其他问题，请参考 [Supabase 文档](https://supabase.com/docs) 或联系技术支持。 