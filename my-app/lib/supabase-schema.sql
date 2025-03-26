-- BookmarkMind 数据库结构
-- 用于从 Firebase 迁移到 Supabase

-- 书签表
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  favicon TEXT,
  tags TEXT[] DEFAULT '{}',
  folder_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  visit_count INTEGER DEFAULT 0,
  is_read BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'article',
  analysis JSONB DEFAULT '{}',
  pdf jsonb DEFAULT NULL
);

-- 书签文件夹表
CREATE TABLE IF NOT EXISTS bookmark_folders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  parent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 收藏集表
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  bookmark_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 收藏集与书签的关联表
CREATE TABLE IF NOT EXISTS collection_bookmarks (
  collection_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
  bookmark_id TEXT REFERENCES bookmarks(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (collection_id, bookmark_id)
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  bg_color TEXT,
  text_color TEXT,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 标签与书签的关联表
CREATE TABLE IF NOT EXISTS bookmark_tags (
  tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
  bookmark_id TEXT REFERENCES bookmarks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (tag_id, bookmark_id)
);

-- 设置行级安全策略 (RLS)

-- 启用所有表的 RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_tags ENABLE ROW LEVEL SECURITY;

-- 书签表的安全策略
DROP POLICY IF EXISTS "用户可以查看自己的书签" ON bookmarks;
CREATE POLICY "用户可以查看自己的书签" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加自己的书签" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的书签" ON bookmarks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的书签" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- 文件夹表的安全策略
CREATE POLICY "用户可以查看自己的文件夹" ON bookmark_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加自己的文件夹" ON bookmark_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的文件夹" ON bookmark_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的文件夹" ON bookmark_folders
  FOR DELETE USING (auth.uid() = user_id);

-- 收藏集表的安全策略
CREATE POLICY "用户可以查看自己的收藏集" ON collections
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "用户可以添加自己的收藏集" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的收藏集" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的收藏集" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- 收藏集与书签关联表的安全策略
CREATE POLICY "用户可以查看收藏集中的书签" ON collection_bookmarks
  FOR SELECT USING (
    -- 允许查看自己的收藏集中的书签或公开收藏集中的书签
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND (c.user_id = auth.uid() OR c.is_public = true)
    )
  );

CREATE POLICY "用户可以添加书签到收藏集" ON collection_bookmarks
  FOR INSERT WITH CHECK (
    -- 只能向自己的收藏集中添加书签
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可以从收藏集中删除书签" ON collection_bookmarks
  FOR DELETE USING (
    -- 只能从自己的收藏集中删除书签
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  );

-- 标签表的安全策略
CREATE POLICY "用户可以查看自己的标签" ON tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加自己的标签" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的标签" ON tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的标签" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- 标签与书签关联表的安全策略
CREATE POLICY "用户可以查看书签的标签" ON bookmark_tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加标签到书签" ON bookmark_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以移除书签的标签" ON bookmark_tags
  FOR DELETE USING (auth.uid() = user_id);

-- 增加一些实用的存储过程
-- 安全地增加计数器
CREATE OR REPLACE FUNCTION increment_counter(table_name text, column_name text, row_id text, increment_by int)
RETURNS void AS $$
DECLARE
    update_query text;
BEGIN
    update_query := format('UPDATE %I SET %I = COALESCE(%I, 0) + $1 WHERE id = $2', 
                          table_name, column_name, column_name);
    EXECUTE update_query USING increment_by, row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 安全地减少计数器
CREATE OR REPLACE FUNCTION decrement_counter(table_name text, column_name text, row_id text, decrement_by int)
RETURNS void AS $$
DECLARE
    update_query text;
BEGIN
    update_query := format('UPDATE %I SET %I = GREATEST(COALESCE(%I, 0) - $1, 0) WHERE id = $2', 
                          table_name, column_name, column_name);
    EXECUTE update_query USING decrement_by, row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 修改存储桶访问策略，允许公共访问
drop policy if exists "Allow public access to bookmarks" on storage.objects;
create policy "Allow public access to bookmarks"
on storage.objects for select
using (bucket_id = 'bookmarks');

-- 允许已认证用户上传文件
drop policy if exists "Allow authenticated users to upload files" on storage.objects;
create policy "Allow authenticated users to upload files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'bookmarks' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- 允许已认证用户访问自己的文件
drop policy if exists "Allow authenticated users to read their own files" on storage.objects;
create policy "Allow authenticated users to read their own files"
on storage.objects for select to authenticated
using (
  bucket_id = 'bookmarks' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- 允许已认证用户删除自己的文件
drop policy if exists "Allow authenticated users to delete their own files" on storage.objects;
create policy "Allow authenticated users to delete their own files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'bookmarks' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
); 