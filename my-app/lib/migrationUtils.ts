/**
 * Firebase 到 Supabase 迁移实用工具
 * 
 * 提供将 Firebase 数据导出、转换和导入到 Supabase 的辅助函数
 */

import { getDatabase, ref, get } from 'firebase/database';
import { app } from './firebase';
import { supabase } from './supabase';
import { Bookmark, BookmarkFolder } from '../types/bookmark';

/**
 * 将 Firebase 数据导出到 JSON 文件
 */
export async function exportFirebaseData(userId: string): Promise<{
  bookmarks: Record<string, any>;
  folders: Record<string, any>;
}> {
  try {
    const db = getDatabase(app);
    const userRef = ref(db, `users/${userId}`);
    
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      throw new Error('用户数据不存在');
    }
    
    const userData = snapshot.val();
    console.log(`导出了 ${Object.keys(userData.bookmarks || {}).length} 个书签`);
    console.log(`导出了 ${Object.keys(userData.folders || {}).length} 个文件夹`);
    
    return {
      bookmarks: userData.bookmarks || {},
      folders: userData.folders || {}
    };
  } catch (error) {
    console.error('导出 Firebase 数据失败:', error);
    throw error;
  }
}

/**
 * 将 Firebase 书签数据转换为 Supabase 兼容格式
 */
export function convertBookmarksForSupabase(
  userId: string,
  bookmarks: Record<string, Bookmark>
): Array<any> {
  return Object.entries(bookmarks).map(([id, bookmark]) => ({
    id,
    user_id: userId,
    url: bookmark.url,
    title: bookmark.title,
    description: bookmark.description || '',
    favicon: bookmark.favicon || '',
    tags: bookmark.tags || [],
    folder_id: bookmark.folderId,
    created_at: new Date(bookmark.createdAt).toISOString(),
    added_at: new Date(bookmark.addedAt).toISOString(),
    updated_at: new Date().toISOString(),
    visit_count: 0,
    is_read: false,
    is_favorite: false,
    type: 'article',
    analysis: {}
  }));
}

/**
 * 将 Firebase 文件夹数据转换为 Supabase 兼容格式
 */
export function convertFoldersForSupabase(
  userId: string,
  folders: Record<string, BookmarkFolder>
): Array<any> {
  return Object.entries(folders).map(([id, folder]) => ({
    id,
    user_id: userId,
    name: folder.name,
    color: folder.color || null,
    icon: folder.icon || null,
    parent_id: folder.parentId || null,
    created_at: folder.createdAt ? new Date(folder.createdAt).toISOString() : new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

/**
 * 将转换后的数据导入到 Supabase
 */
export async function importDataToSupabase(
  userId: string,
  bookmarks: Record<string, Bookmark>,
  folders: Record<string, BookmarkFolder>
): Promise<{ bookmarksImported: number; foldersImported: number }> {
  try {
    // 转换数据
    const supabaseBookmarks = convertBookmarksForSupabase(userId, bookmarks);
    const supabseFolders = convertFoldersForSupabase(userId, folders);
    
    // 导入文件夹
    if (supabseFolders.length > 0) {
      const { error: foldersError } = await supabase
        .from('bookmark_folders')
        .upsert(supabseFolders);
        
      if (foldersError) throw foldersError;
    }
    
    // 导入书签
    if (supabaseBookmarks.length > 0) {
      const { error: bookmarksError } = await supabase
        .from('bookmarks')
        .upsert(supabaseBookmarks);
        
      if (bookmarksError) throw bookmarksError;
    }
    
    return {
      bookmarksImported: supabaseBookmarks.length,
      foldersImported: supabseFolders.length
    };
  } catch (error) {
    console.error('导入数据到 Supabase 失败:', error);
    throw error;
  }
}

/**
 * 一键迁移用户数据
 */
export async function migrateUserData(userId: string, supabaseUserId: string): Promise<{
  bookmarksImported: number;
  foldersImported: number;
}> {
  try {
    // 导出 Firebase 数据
    const { bookmarks, folders } = await exportFirebaseData(userId);
    
    // 导入到 Supabase
    return await importDataToSupabase(supabaseUserId, bookmarks, folders);
  } catch (error) {
    console.error('用户数据迁移失败:', error);
    throw error;
  }
} 