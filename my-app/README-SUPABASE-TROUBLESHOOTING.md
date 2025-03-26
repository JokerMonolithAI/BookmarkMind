# BookmarkMind Supabase 迁移故障排除

## 权限错误（Error: Permission denied）问题

### 症状
登录成功后，页面显示以下错误：
```
Error fetching bookmarks: Error: Permission denied
    at Repo.ts:534:29
    at async BookmarkList.useCallback[fetchBookmarks] (BookmarkList.tsx:102:24)
```

### 原因
此错误是由于 Supabase 中的行级安全策略（RLS）配置不正确所致。在从 Firebase 迁移到 Supabase 的过程中，某些安全策略可能未正确应用或发生冲突。

### 解决方案

#### 方法 1: 使用 Supabase 管理界面
1. 登录到 [Supabase 管理界面](https://app.supabase.io)
2. 选择你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 打开 `my-app/lib/fix-permissions.sql` 文件
5. 将其内容粘贴到 SQL 编辑器中
6. 点击 "Run" 按钮执行 SQL

#### 方法 2: 使用命令行（需要 Supabase CLI）
如果你已安装 Supabase CLI，可以使用以下命令：

```bash
# 从项目根目录执行
cd my-app
cat lib/fix-permissions.sql | npx supabase db execute --project-ref iucyilwmtyqayarcmnzs
```

### 验证解决方案
修复完成后，请尝试：
1. 完全刷新页面（Ctrl+F5 或 Cmd+Shift+R）
2. 登出并重新登录
3. 检查书签是否正常加载

## 其他可能的权限问题

如果你在访问其他数据（如标签、收藏集等）时遇到类似的权限错误，原因可能相同。请检查 `fix-permissions.sql` 文件，确保相关表的 RLS 策略已正确配置。

## 理解 Supabase 行级安全性

Supabase 使用 PostgreSQL 的行级安全性（RLS）来控制数据访问。每个表必须明确设置策略，指明哪些用户可以执行哪些操作。

基本语法：
```sql
CREATE POLICY "策略名称" ON 表名
  FOR 操作类型 [TO 角色]
  USING (条件);
```

例如：
```sql
CREATE POLICY "用户可以查看自己的书签" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);
```

更多信息请参考 [Supabase 行级安全文档](https://supabase.com/docs/guides/auth/row-level-security)。 