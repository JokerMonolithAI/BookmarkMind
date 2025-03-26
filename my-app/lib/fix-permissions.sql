-- BookmarkMind 修复权限问题
-- 执行此SQL可解决Permission denied错误

-- 重新创建书签表相关策略
DROP POLICY IF EXISTS "用户可以查看自己的书签" ON bookmarks;
DROP POLICY IF EXISTS "用户可以添加自己的书签" ON bookmarks;
DROP POLICY IF EXISTS "用户可以更新自己的书签" ON bookmarks;
DROP POLICY IF EXISTS "用户可以删除自己的书签" ON bookmarks;

CREATE POLICY "用户可以查看自己的书签" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加自己的书签" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的书签" ON bookmarks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的书签" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- 重新创建标签相关策略
DROP POLICY IF EXISTS "用户可以查看自己的标签" ON tags;
DROP POLICY IF EXISTS "用户可以添加自己的标签" ON tags;
DROP POLICY IF EXISTS "用户可以更新自己的标签" ON tags;
DROP POLICY IF EXISTS "用户可以删除自己的标签" ON tags;

CREATE POLICY "用户可以查看自己的标签" ON tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加自己的标签" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的标签" ON tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的标签" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- 重新创建标签与书签关联表相关策略
DROP POLICY IF EXISTS "用户可以查看书签的标签" ON bookmark_tags;
DROP POLICY IF EXISTS "用户可以添加标签到书签" ON bookmark_tags;
DROP POLICY IF EXISTS "用户可以移除书签的标签" ON bookmark_tags;

CREATE POLICY "用户可以查看书签的标签" ON bookmark_tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加标签到书签" ON bookmark_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以移除书签的标签" ON bookmark_tags
  FOR DELETE USING (auth.uid() = user_id);

-- 重新创建收藏集相关策略
DROP POLICY IF EXISTS "用户可以查看自己的收藏集" ON collections;
DROP POLICY IF EXISTS "用户可以添加自己的收藏集" ON collections;
DROP POLICY IF EXISTS "用户可以更新自己的收藏集" ON collections;
DROP POLICY IF EXISTS "用户可以删除自己的收藏集" ON collections;

CREATE POLICY "用户可以查看自己的收藏集" ON collections
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "用户可以添加自己的收藏集" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的收藏集" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的收藏集" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- 收藏集与书签关联表的安全策略
DROP POLICY IF EXISTS "用户可以查看收藏集中的书签" ON collection_bookmarks;
DROP POLICY IF EXISTS "用户可以添加书签到收藏集" ON collection_bookmarks;
DROP POLICY IF EXISTS "用户可以从收藏集中删除书签" ON collection_bookmarks;

CREATE POLICY "用户可以查看收藏集中的书签" ON collection_bookmarks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND (c.user_id = auth.uid() OR c.is_public = true)
    )
  );

CREATE POLICY "用户可以添加书签到收藏集" ON collection_bookmarks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可以从收藏集中删除书签" ON collection_bookmarks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id AND c.user_id = auth.uid()
    )
  ); 