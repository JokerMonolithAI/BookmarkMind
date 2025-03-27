/**
 * Supabase 书签服务 - 处理书签的存储、获取和管理
 * 替代原 Firebase 实现的功能
 */

import { supabase } from './supabase';
import { BookmarkFolder, Bookmark as BookmarkType } from '../types/bookmark';
import { normalizeUrl } from '../utils/url-utils';
import { generateId } from './utils';

// 书签类型定义
export interface Bookmark extends BookmarkType {
  userId: string;
  updatedAt: string;
  visitCount: number;
  isRead: boolean;
  isFavorite: boolean;
  type?: 'article' | 'video' | 'image' | 'document' | 'other';
  category?: string;
  pdf?: {
    url: string;
    name: string;
    addedAt: number;
    storagePath: string;
    size?: number;
    expires?: number;
  };
  analysis?: {
    tags?: string[];
    summary?: string;
    sentiment?: string;
    keywords?: string[];
  };
}

// 数据库表名
const BOOKMARKS_TABLE = 'bookmarks';
const FOLDERS_TABLE = 'bookmark_folders';

/**
 * 转换对象键为蛇形命名（适应Supabase列命名）
 */
function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // 转换键名为蛇形命名
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    // 如果值是对象且不是数组或null，递归转换
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = toSnakeCase(value);
    } else {
      result[snakeKey] = value;
    }
  }
  
  return result;
}

/**
 * 转换对象键为驼峰命名（适应JavaScript对象）
 */
function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // 转换键名为驼峰命名
    const camelKey = key.replace(/_([a-z])/g, (_, p1) => p1.toUpperCase());
    
    // 如果值是对象且不是数组或null，递归转换
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = toCamelCase(value);
    } else {
      result[camelKey] = value;
    }
  }
  
  return result;
}

/**
 * 保存用户的书签数据
 */
export async function saveUserBookmarks(
  userId: string, 
  bookmarks: Record<string, Bookmark>,
  folders: Record<string, BookmarkFolder>
): Promise<{
  dbDuplicates: number;
  savedCount: number;
  existingBookmarkIds?: string[];
}> {
  try {
    if (!userId) {
      throw new Error('用户ID不能为空');
    }
    
    console.log(`准备保存书签: ${Object.keys(bookmarks).length} 个, 文件夹: ${Object.keys(folders).length} 个`);
    
    // 获取现有书签进行对比去重
    const { data: existingBookmarks, error: fetchError } = await supabase
      .from(BOOKMARKS_TABLE)
      .select('id, url')
      .eq('user_id', userId);
      
    if (fetchError) {
      console.error('获取现有书签失败:', fetchError);
      throw fetchError;
    }
    
    // 构造url到id的映射
    const urlToIdMap = new Map();
    existingBookmarks?.forEach(bookmark => {
      urlToIdMap.set(normalizeUrl(bookmark.url), bookmark.id);
    });
    
    // 跟踪重复和新增的书签
    let dbDuplicates = 0;
    let savedCount = 0;
    const existingBookmarkIds: string[] = [];
    
    // 处理所有书签
    const bookmarksToInsert = [];
    
    for (const [id, bookmark] of Object.entries(bookmarks)) {
      const normalizedUrl = normalizeUrl(bookmark.url);
      
      // 检查URL是否已存在
      if (urlToIdMap.has(normalizedUrl)) {
        dbDuplicates++;
        existingBookmarkIds.push(urlToIdMap.get(normalizedUrl));
        continue;
      }

      // 将时间戳格式转换为ISO字符串
      const createdAt = bookmark.createdAt ? new Date(bookmark.createdAt).toISOString() : new Date().toISOString();
      const addedAt = bookmark.addedAt ? new Date(bookmark.addedAt).toISOString() : new Date().toISOString();
      
      // 准备插入的书签数据
      const bookmarkData = {
        id: bookmark.id,
        user_id: userId,
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description || '',
        favicon: bookmark.favicon || '',
        tags: bookmark.tags || [],
        folder_id: bookmark.folderId,
        created_at: createdAt,
        added_at: addedAt,
        updated_at: new Date().toISOString(),
        visit_count: bookmark.visitCount || 0,
        is_read: bookmark.isRead || false,
        is_favorite: bookmark.isFavorite || false,
        type: bookmark.type || 'article',
        analysis: bookmark.analysis || {}
      };
      
      bookmarksToInsert.push(bookmarkData);
      savedCount++;
    }
    
    // 批量插入书签
    if (bookmarksToInsert.length > 0) {
      console.log(`插入 ${bookmarksToInsert.length} 个书签`);
      const { error: insertError } = await supabase
        .from(BOOKMARKS_TABLE)
        .upsert(bookmarksToInsert);
        
      if (insertError) {
        console.error('插入书签失败:', insertError);
        throw insertError;
      }
    }
    
    // 处理文件夹
    if (Object.keys(folders).length > 0) {
      try {
        console.log(`处理 ${Object.keys(folders).length} 个文件夹`);
        const foldersToInsert = Object.entries(folders).map(([id, folder]) => ({
          id,
          user_id: userId,
          name: folder.name,
          color: folder.color || null,
          icon: folder.icon || null,
          parent_id: folder.parentId,
          created_at: folder.createdAt ? new Date(folder.createdAt).toISOString() : new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const { error: folderError } = await supabase
          .from(FOLDERS_TABLE)
          .upsert(foldersToInsert);
          
        if (folderError) {
          console.error('插入文件夹失败:', folderError);
          // 文件夹操作失败不影响书签操作结果
          console.warn('文件夹保存失败，但书签保存成功');
        }
      } catch (folderError) {
        console.error('处理文件夹时出错:', folderError);
        // 文件夹操作失败不影响书签操作结果
        console.warn('文件夹保存失败，但书签保存成功');
      }
    }
    
    console.log(`书签导入完成: 重复 ${dbDuplicates}, 保存 ${savedCount}`);
    
    return {
      dbDuplicates,
      savedCount,
      existingBookmarkIds
    };
  } catch (error) {
    console.error('保存书签过程中出错:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    } else {
      console.error('未知错误类型:', error);
    }
    throw error;
  }
}

/**
 * 获取用户的所有书签
 */
export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  try {
    if (!userId) {
      console.error('getUserBookmarks: 用户ID为空');
      return [];
    }
    
    const { data, error } = await supabase
      .from(BOOKMARKS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching bookmarks:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    console.log('获取到的书签数据示例:', data[0]);
    
    // 将数据库结果转换为应用格式
    const bookmarks: Bookmark[] = data.map(item => ({
      id: item.id,
      userId: item.user_id,
      url: item.url,
      title: item.title,
      description: item.description || '',
      favicon: item.favicon || '',
      tags: item.tags || [],
      folderId: item.folder_id,
      createdAt: item.created_at,
      addedAt: item.added_at,
      updatedAt: item.updated_at,
      visitCount: item.visit_count || 0,
      isRead: item.is_read || false,
      isFavorite: item.is_favorite || false,
      type: item.type || 'article',
      pdf: item.pdf || undefined,
      category: item.category || undefined,
      analysis: item.analysis || {}
    }));
    
    return bookmarks;
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }
}

/**
 * 创建新书签
 */
export async function createBookmark(userId: string, data: {
  url: string;
  title: string;
  description?: string;
  tags?: string[];
  type?: 'article' | 'video' | 'image' | 'document' | 'other';
}): Promise<Bookmark> {
  try {
    const now = Date.now();
    const id = generateId();
    
    const bookmarkData = {
      id,
      user_id: userId,
      url: data.url,
      title: data.title,
      description: data.description || '',
      tags: data.tags || [],
      favicon: '',
      created_at: now,
      added_at: now,
      updated_at: new Date().toISOString(),
      visit_count: 0,
      is_read: false,
      is_favorite: false,
      type: data.type || 'other'
    };
    
    const { error } = await supabase
      .from(BOOKMARKS_TABLE)
      .insert(bookmarkData);
      
    if (error) throw error;
    
    // 返回创建的书签
    const newBookmark: Bookmark = {
      id,
      userId,
      url: data.url,
      title: data.title,
      description: data.description || '',
      tags: data.tags || [],
      favicon: '',
      createdAt: now,
      addedAt: now,
      updatedAt: new Date().toISOString(),
      visitCount: 0,
      isRead: false,
      isFavorite: false,
      type: data.type || 'other'
    };
    
    return newBookmark;
  } catch (error) {
    console.error('Error creating bookmark:', error);
    throw error;
  }
}

/**
 * 更新书签
 */
export async function updateBookmark(userId: string, bookmarkId: string, data: Partial<Omit<Bookmark, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<Bookmark> {
  try {
    // 获取当前书签
    const { data: bookmarkData, error: fetchError } = await supabase
      .from(BOOKMARKS_TABLE)
      .select('*')
      .eq('id', bookmarkId)
      .eq('user_id', userId)
      .single();
      
    if (fetchError) throw fetchError;
    
    // 准备更新数据
    const updateData: Record<string, any> = {};
    
    if (data.url) updateData.url = data.url;
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.favicon !== undefined) updateData.favicon = data.favicon;
    if (data.tags) updateData.tags = data.tags;
    if (data.folderId !== undefined) updateData.folder_id = data.folderId;
    if (data.visitCount !== undefined) updateData.visit_count = data.visitCount;
    if (data.isRead !== undefined) updateData.is_read = data.isRead;
    if (data.isFavorite !== undefined) updateData.is_favorite = data.isFavorite;
    if (data.type) updateData.type = data.type;
    if (data.analysis) updateData.analysis = data.analysis;
    
    // 添加对 PDF 文件的支持
    if (data.pdf !== undefined) updateData.pdf = data.pdf;
    
    // 添加更新时间
    updateData.updated_at = new Date().toISOString();
    
    // 执行更新
    const { error: updateError } = await supabase
      .from(BOOKMARKS_TABLE)
      .update(updateData)
      .eq('id', bookmarkId)
      .eq('user_id', userId);
      
    if (updateError) throw updateError;
    
    // 返回更新后的书签
    const updatedBookmark: Bookmark = {
      id: bookmarkId,
      userId,
      url: data.url || bookmarkData.url,
      title: data.title || bookmarkData.title,
      description: (data.description !== undefined) ? data.description : bookmarkData.description,
      favicon: (data.favicon !== undefined) ? data.favicon : bookmarkData.favicon,
      tags: data.tags || bookmarkData.tags,
      folderId: (data.folderId !== undefined) ? data.folderId : bookmarkData.folder_id,
      createdAt: bookmarkData.created_at,
      addedAt: bookmarkData.added_at,
      updatedAt: new Date().toISOString(),
      visitCount: (data.visitCount !== undefined) ? data.visitCount : bookmarkData.visit_count,
      isRead: (data.isRead !== undefined) ? data.isRead : bookmarkData.is_read,
      isFavorite: (data.isFavorite !== undefined) ? data.isFavorite : bookmarkData.is_favorite,
      type: data.type || bookmarkData.type,
      pdf: (data.pdf !== undefined) ? data.pdf : bookmarkData.pdf,
      analysis: data.analysis || bookmarkData.analysis
    };
    
    return updatedBookmark;
  } catch (error) {
    console.error('Error updating bookmark:', error);
    throw error;
  }
}

/**
 * 删除书签
 */
export async function deleteBookmark(userId: string, bookmarkId: string): Promise<void> {
  try {
    // 删除书签
    const { error } = await supabase
      .from(BOOKMARKS_TABLE)
      .delete()
      .eq('id', bookmarkId)
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // 如果有必要，还可以删除相关的收藏集关联
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    throw error;
  }
}

/**
 * 获取用户书签的所有分类（去重）
 */
export async function getUserBookmarkCategories(userId: string): Promise<string[]> {
  try {
    const bookmarks = await getUserBookmarks(userId);
    const categories = new Set<string>();
    
    // 遍历所有书签，提取分类信息
    bookmarks.forEach(bookmark => {
      if (bookmark.category && bookmark.category) {
        categories.add(bookmark.category);
      }
    });
    
    // 转换为数组并返回
    return Array.from(categories);
  } catch (error) {
    console.error('Error fetching bookmark categories:', error);
    return [];
  }
}

/**
 * 搜索书签
 */
export async function searchBookmarks(userId: string, query: string): Promise<Bookmark[]> {
  try {
    const { data, error } = await supabase
      .from(BOOKMARKS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,url.ilike.%${query}%,description.ilike.%${query}%`)
      .order('added_at', { ascending: false });
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // 将数据库结果转换为应用格式
    const bookmarks: Bookmark[] = data.map(item => ({
      id: item.id,
      userId: item.user_id,
      url: item.url,
      title: item.title,
      description: item.description || '',
      favicon: item.favicon || '',
      tags: item.tags || [],
      folderId: item.folder_id,
      createdAt: item.created_at,
      addedAt: item.added_at,
      updatedAt: item.updated_at,
      visitCount: item.visit_count || 0,
      isRead: item.is_read || false,
      isFavorite: item.is_favorite || false,
      type: item.type || 'article',
      analysis: item.analysis || {}
    }));
    
    return bookmarks;
  } catch (error) {
    console.error('Error searching bookmarks:', error);
    return [];
  }
}

/**
 * 根据ID数组获取用户的书签
 */
export async function getUserBookmarksByIds(userId: string, bookmarkIds: string[]): Promise<Bookmark[]> {
  try {
    if (!bookmarkIds.length) return [];
    
    const { data, error } = await supabase
      .from(BOOKMARKS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .in('id', bookmarkIds);
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // 将数据库结果转换为应用格式
    const bookmarks: Bookmark[] = data.map(item => ({
      id: item.id,
      userId: item.user_id,
      url: item.url,
      title: item.title,
      description: item.description || '',
      favicon: item.favicon || '',
      tags: item.tags || [],
      folderId: item.folder_id,
      createdAt: item.created_at,
      addedAt: item.added_at,
      updatedAt: item.updated_at,
      visitCount: item.visit_count || 0,
      isRead: item.is_read || false,
      isFavorite: item.is_favorite || false,
      type: item.type || 'article',
      analysis: item.analysis || {}
    }));
    
    return bookmarks;
  } catch (error) {
    console.error('Error fetching bookmarks by IDs:', error);
    throw error;
  }
}

/**
 * 更新书签分类名称
 */
export async function updateBookmarkCategory(userId: string, oldCategory: string, newCategory: string): Promise<void> {
  try {
    // 获取所有具有指定旧分类的书签
    const { data, error } = await supabase
      .from(BOOKMARKS_TABLE)
      .select('id')
      .eq('user_id', userId)
      .eq('category', oldCategory);
    
    if (error) {
      console.error('获取书签失败:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log(`没有找到分类为 "${oldCategory}" 的书签`);
      return; // 没有书签需要更新
    }
    
    console.log(`找到 ${data.length} 个需要更新分类的书签`);
    
    // 批量更新这些书签的分类
    for (const bookmark of data) {
      const { error: updateError } = await supabase
        .from(BOOKMARKS_TABLE)
        .update({ 
          category: newCategory,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookmark.id)
        .eq('user_id', userId);
      
      if (updateError) {
        console.error(`更新书签 ${bookmark.id} 分类失败:`, updateError);
        // 继续尝试更新其他书签
      }
    }
    
    console.log(`成功更新了 ${data.length} 个书签的分类`);
  } catch (error) {
    console.error('更新书签分类失败:', error);
    throw error;
  }
}

/**
 * 获取用户的文件夹
 */
export async function getUserFolders(userId: string): Promise<Record<string, BookmarkFolder>> {
  try {
    if (!userId) {
      console.error('getUserFolders: 用户ID为空');
      return {};
    }
    
    const { data, error } = await supabase
      .from(FOLDERS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return {};
    }
    
    // 将数据库结果转换为应用格式
    const folders: Record<string, BookmarkFolder> = {};
    data.forEach(item => {
      folders[item.id] = {
        id: item.id,
        name: item.name,
        parentId: item.parent_id || undefined,
        color: item.color || undefined,
        icon: item.icon || undefined,
        createdAt: item.created_at
      };
    });
    
    return folders;
  } catch (error) {
    console.error('Error fetching folders:', error);
    return {};
  }
} 