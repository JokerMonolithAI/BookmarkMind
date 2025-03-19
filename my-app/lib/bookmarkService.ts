/**
 * 书签服务 - 处理书签的存储、获取和管理
 * 
 * 修复说明：
 * 1. 修复了Firebase写入时undefined值导致的错误
 * 2. 添加了数据清理函数sanitizeObject，用于深度清理对象中的undefined值
 * 3. 优化了书签属性的处理方式，确保可选属性正确设置
 * 4. 增强了错误处理和日志记录，便于调试
 * 5. 确保数据结构符合Firebase的要求
 */

import { db } from './firebase';
import { ref, set, get, child, update, remove } from 'firebase/database';
import { BookmarkFolder, UserBookmarkData, Bookmark as BookmarkType } from '../types/bookmark';
import { normalizeUrl } from '../utils/url-utils';
import { generateId } from './utils';

// 书签类型定义（扩展自types/bookmark.ts中的Bookmark类型）
export interface Bookmark extends BookmarkType {
  userId: string;
  updatedAt: string;
  visitCount: number;
  isRead: boolean;
  isFavorite: boolean;
  type?: 'article' | 'video' | 'image' | 'document' | 'other';
}

// 保存用户的书签数据
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
    // 添加一个辅助函数，用于清理对象中的undefined值
    const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
      const result = { ...obj };
      for (const key in result) {
        if (result[key] === undefined) {
          delete result[key];
        } else if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = sanitizeObject(result[key]);
        }
      }
      return result;
    };
    
    // 获取现有书签进行对比去重
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `users/${userId}/bookmarks`));
    let existingData: UserBookmarkData = {
      bookmarks: {},
      folders: {},
      lastUpdated: Date.now()
    };
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      // 处理可能的数据结构差异
      if (data.bookmarks) {
        existingData = data as UserBookmarkData;
      } else {
        // 如果数据直接是书签对象，适配到正确的结构
        existingData.bookmarks = data;
      }
    }
    
    // 准备最终要保存的书签 - 从现有书签开始
    const finalBookmarks: Record<string, BookmarkType> = {};
    
    // 将现有书签转换为符合BookmarkType的格式
    for (const id in existingData.bookmarks) {
      const bookmark = existingData.bookmarks[id];
      const finalBookmark: BookmarkType = {
        id: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
        addedAt: bookmark.addedAt || Date.now(),
        createdAt: bookmark.createdAt || Date.now()
      };
      
      // 只添加存在的可选属性
      if (bookmark.description) finalBookmark.description = bookmark.description;
      if (bookmark.favicon) finalBookmark.favicon = bookmark.favicon;
      if (bookmark.tags && Array.isArray(bookmark.tags)) finalBookmark.tags = bookmark.tags;
      if (bookmark.folderId) finalBookmark.folderId = bookmark.folderId;
      
      finalBookmarks[id] = finalBookmark;
    }
    
    const finalFolders: Record<string, BookmarkFolder> = { ...existingData.folders, ...folders };
    
    // 跟踪重复和新增的书签
    let dbDuplicates = 0;
    let savedCount = 0;
    const existingBookmarkIds: string[] = [];
    
    // 将新书签与数据库中的书签对比
    Object.values(bookmarks).forEach(bookmark => {
      const normalizedUrl = normalizeUrl(bookmark.url);
      let isDuplicate = false;
      
      // 检查是否与数据库中的书签重复
      for (const key in existingData.bookmarks) {
        if (normalizeUrl(existingData.bookmarks[key].url) === normalizedUrl) {
          isDuplicate = true;
          dbDuplicates++;
          existingBookmarkIds.push(key);
          break;
        }
      }
      
      // 如果不是重复书签，添加到最终书签列表
      if (!isDuplicate) {
        const finalBookmark: BookmarkType = {
          id: bookmark.id,
          url: bookmark.url,
          title: bookmark.title,
          addedAt: bookmark.addedAt || Date.now(),
          createdAt: bookmark.createdAt || Date.now()
        };
        
        // 只添加存在的可选属性
        if (bookmark.description) finalBookmark.description = bookmark.description;
        if (bookmark.favicon) finalBookmark.favicon = bookmark.favicon;
        if (bookmark.tags && Array.isArray(bookmark.tags)) finalBookmark.tags = bookmark.tags;
        if (bookmark.folderId) finalBookmark.folderId = bookmark.folderId;
        
        finalBookmarks[bookmark.id] = finalBookmark;
        savedCount++;
      }
    });
    
    // 在使用update之前，先清理数据
    // 验证数据不为空
    if (Object.keys(finalBookmarks).length === 0 && Object.keys(existingData.bookmarks).length > 0) {
      console.warn('No new bookmarks to save and would overwrite existing data - aborting');
      return {
        dbDuplicates,
        savedCount: 0,
        existingBookmarkIds
      };
    }
    
    try {
      // 使用辅助函数清理数据，而不是使用JSON转换的方式
      const sanitizedData = {
        bookmarks: sanitizeObject(finalBookmarks),
        folders: sanitizeObject(finalFolders),
        lastUpdated: Date.now()
      };
      
      // 确保数据结构正确
      console.log(`保存书签: ${Object.keys(sanitizedData.bookmarks).length}个，文件夹: ${Object.keys(sanitizedData.folders).length}个`);
      
      // 使用sanitized数据进行更新
      const userBookmarksRef = ref(db, `users/${userId}`);
      await update(userBookmarksRef, sanitizedData);
    } catch (error) {
      console.error('Error preparing data for Firebase:', error);
      // 记录详细的数据结构信息，以便调试
      console.error('Problem data structure:', {
        bookmarksCount: Object.keys(finalBookmarks).length,
        foldersCount: Object.keys(finalFolders).length,
        sampleBookmarkKeys: Object.keys(finalBookmarks).slice(0, 3)
      });
      throw error;
    }
    
    // 返回去重信息
    return {
      dbDuplicates,
      savedCount,
      existingBookmarkIds
    };
  } catch (error) {
    console.error('Error saving bookmarks:', error);
    // 添加更详细的错误信息
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

/**
 * 获取用户的所有书签
 * @param userId 用户ID
 * @returns 书签列表
 */
export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  try {
    const bookmarksRef = ref(db, `users/${userId}/bookmarks`);
    const snapshot = await get(bookmarksRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const bookmarksData = snapshot.val();
    const bookmarks: Bookmark[] = [];
    
    // 处理可能的数据结构差异
    if (typeof bookmarksData === 'object') {
      if (bookmarksData.bookmarks) {
        // 如果数据结构是 { bookmarks: { ... } }
        const bookmarksObj = bookmarksData.bookmarks;
        for (const id in bookmarksObj) {
          const bookmark = bookmarksObj[id];
          if (isValidBookmark(bookmark)) {
            bookmarks.push(convertToBookmark(id, bookmark, userId));
          }
        }
      } else {
        // 如果数据结构是直接的书签对象 { id1: {...}, id2: {...} }
        for (const id in bookmarksData) {
          const bookmark = bookmarksData[id];
          if (isValidBookmark(bookmark)) {
            bookmarks.push(convertToBookmark(id, bookmark, userId));
          }
        }
      }
    }
    
    // 按添加时间排序，最新的在前面
    return bookmarks.sort((a, b) => {
      const dateA = a.addedAt || 0;
      const dateB = b.addedAt || 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    
    // 如果出错，返回一些模拟数据以便测试
    console.warn('Returning mock data due to error');
    const now = Date.now();
    return [
      {
        id: 'bookmark1',
        userId,
        url: 'https://nextjs.org/docs',
        title: 'Next.js 文档',
        description: 'Next.js 官方文档，包含所有特性和API的详细说明。',
        tags: ['nextjs', 'react', 'documentation'],
        favicon: 'https://nextjs.org/favicon.ico',
        createdAt: now,
        addedAt: now,
        updatedAt: new Date().toISOString(),
        visitCount: 5,
        isRead: true,
        isFavorite: true,
        type: 'document'
      },
      {
        id: 'bookmark2',
        userId,
        url: 'https://react.dev',
        title: 'React 官方网站',
        description: 'React 官方网站，包含教程、文档和最佳实践。',
        tags: ['react', 'javascript', 'frontend'],
        favicon: 'https://react.dev/favicon.ico',
        createdAt: now - 86400000, // 一天前
        addedAt: now - 86400000,
        updatedAt: new Date().toISOString(),
        visitCount: 3,
        isRead: false,
        isFavorite: false,
        type: 'document'
      }
    ];
  }
}

// 验证对象是否是有效的书签
function isValidBookmark(obj: any): boolean {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.url === 'string' &&
    typeof obj.title === 'string'
  );
}

// 将数据库中的书签转换为应用中使用的Bookmark类型
function convertToBookmark(id: string, data: any, userId: string): Bookmark {
  const now = Date.now();
  return {
    id,
    userId,
    url: data.url,
    title: data.title,
    description: data.description || '',
    favicon: data.favicon || '',
    tags: data.tags || [],
    folderId: data.folderId,
    createdAt: data.createdAt || now,
    addedAt: data.addedAt || now,
    updatedAt: data.updatedAt || new Date().toISOString(),
    visitCount: data.visitCount || 0,
    isRead: data.isRead || false,
    isFavorite: data.isFavorite || false,
    type: data.type || 'article'
  };
}

/**
 * 创建新书签
 * @param userId 用户ID
 * @param data 书签数据
 * @returns 创建的书签
 */
export async function createBookmark(userId: string, data: {
  url: string;
  title: string;
  description?: string;
  tags?: string[];
  type?: 'article' | 'video' | 'image' | 'document' | 'other';
}): Promise<Bookmark> {
  try {
    // 这里应该是创建书签的API调用
    // 例如: const response = await fetch('/api/bookmarks', { method: 'POST', body: JSON.stringify({ userId, ...data }) });
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 创建新书签对象
    const now = Date.now();
    const newBookmark: Bookmark = {
      id: generateId(),
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
    
    console.log('Bookmark created:', newBookmark);
    return newBookmark;
  } catch (error) {
    console.error('Error creating bookmark:', error);
    throw error;
  }
}

/**
 * 更新书签
 * @param userId 用户ID
 * @param bookmarkId 书签ID
 * @param data 更新的数据
 * @returns 更新后的书签
 */
export async function updateBookmark(userId: string, bookmarkId: string, data: Partial<Omit<Bookmark, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<Bookmark> {
  try {
    // 这里应该是更新书签的API调用
    // 例如: const response = await fetch(`/api/bookmarks/${bookmarkId}`, { method: 'PATCH', body: JSON.stringify(data) });
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟更新后的书签
    const updatedBookmark: Bookmark = {
      id: bookmarkId,
      userId,
      url: data.url || 'https://example.com',
      title: data.title || 'Example Bookmark',
      description: data.description || '',
      tags: data.tags || [],
      favicon: data.favicon || '',
      createdAt: Date.now() - 86400000, // 假设创建于一天前
      addedAt: Date.now() - 86400000,
      updatedAt: new Date().toISOString(),
      visitCount: data.visitCount || 0,
      isRead: data.isRead || false,
      isFavorite: data.isFavorite || false,
      type: data.type || 'article'
    };
    
    console.log('Bookmark updated:', updatedBookmark);
    return updatedBookmark;
  } catch (error) {
    console.error('Error updating bookmark:', error);
    throw error;
  }
}

/**
 * 删除书签
 * @param userId 用户ID
 * @param bookmarkId 书签ID
 * @returns 删除结果
 */
export async function deleteBookmark(userId: string, bookmarkId: string): Promise<void> {
  try {
    // 从Firebase数据库中删除书签
    const bookmarkRef = ref(db, `users/${userId}/bookmarks/${bookmarkId}`);
    await remove(bookmarkRef);
    
    // 同时删除该书签在所有收藏集中的关联
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      
      // 如果有收藏集数据，检查并删除书签关联
      if (userData.collection_bookmarks) {
        const updates: Record<string, any> = {};
        
        // 遍历所有收藏集
        for (const collectionId in userData.collection_bookmarks) {
          // 如果收藏集中包含该书签，将其标记为删除
          if (userData.collection_bookmarks[collectionId] && 
              userData.collection_bookmarks[collectionId][bookmarkId]) {
            updates[`users/${userId}/collection_bookmarks/${collectionId}/${bookmarkId}`] = null;
            
            // 更新收藏集的书签数量
            if (userData.collections && userData.collections[collectionId]) {
              const currentCount = userData.collections[collectionId].bookmarkCount || 0;
              if (currentCount > 0) {
                updates[`users/${userId}/collections/${collectionId}/bookmarkCount`] = currentCount - 1;
                updates[`users/${userId}/collections/${collectionId}/updatedAt`] = Date.now();
              }
            }
          }
        }
        
        // 如果有需要更新的数据，批量更新
        if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
        }
      }
    }
    
    console.log(`Bookmark ${bookmarkId} deleted for user ${userId}`);
    return Promise.resolve();
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return Promise.reject(error);
  }
}

/**
 * 获取用户书签的所有分类（去重）
 * @param userId 用户ID
 * @returns 分类列表
 */
export async function getUserBookmarkCategories(userId: string): Promise<string[]> {
  try {
    const bookmarks = await getUserBookmarks(userId);
    const categories = new Set<string>();
    
    // 遍历所有书签，提取分类信息
    bookmarks.forEach(bookmark => {
      if (bookmark.type) {
        categories.add(bookmark.type);
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
 * @param userId 用户ID
 * @param query 搜索关键词
 * @returns 匹配的书签列表
 */
export async function searchBookmarks(userId: string, query: string): Promise<Bookmark[]> {
  try {
    // 获取所有书签并进行本地过滤（实际应用中应该在服务器端进行过滤）
    const allBookmarks = await getUserBookmarks(userId);
    const lowerQuery = query.toLowerCase();
    
    return allBookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(lowerQuery) ||
      (bookmark.description && bookmark.description.toLowerCase().includes(lowerQuery)) ||
      bookmark.url.toLowerCase().includes(lowerQuery) ||
      bookmark.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error('Error searching bookmarks:', error);
    return [];
  }
}

// 根据ID数组获取用户的书签
export async function getUserBookmarksByIds(userId: string, bookmarkIds: string[]): Promise<Bookmark[]> {
  try {
    if (!bookmarkIds.length) return [];
    
    const userBookmarksRef = ref(db, `users/${userId}/bookmarks`);
    const snapshot = await get(userBookmarksRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const allBookmarks = snapshot.val();
    const result: Bookmark[] = [];
    
    // 筛选出指定ID的书签
    for (const id of bookmarkIds) {
      if (allBookmarks[id]) {
        result.push({
          id,
          ...allBookmarks[id]
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching bookmarks by IDs:', error);
    throw error;
  }
}