import { db } from './firebase';
import { ref, set, get, child, update } from 'firebase/database';
import { BookmarkFolder, UserBookmarkData } from '../types/bookmark';
import { normalizeUrl } from '../utils/url-utils';

// 定义书签接口
export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  createdAt: number;
  addedAt: number;
  tags?: string[];
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
    const finalBookmarks: Record<string, Bookmark> = { ...existingData.bookmarks };
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
        finalBookmarks[bookmark.id] = bookmark;
        savedCount++;
      }
    });
    
    // 保存最终的书签数据 - 使用 update 而不是 set
    const userBookmarksRef = ref(db, `users/${userId}`);
    const userData: UserBookmarkData = {
      bookmarks: finalBookmarks,
      folders: finalFolders,
      lastUpdated: Date.now()
    };
    
    // 验证数据不为空
    if (Object.keys(finalBookmarks).length === 0 && Object.keys(existingData.bookmarks).length > 0) {
      console.warn('No new bookmarks to save and would overwrite existing data - aborting');
      return {
        dbDuplicates,
        savedCount: 0,
        existingBookmarkIds
      };
    }
    
    // 使用 update 而不是 set
    await update(userBookmarksRef, { bookmarks: userData });
    
    // 返回去重信息
    return {
      dbDuplicates,
      savedCount,
      existingBookmarkIds
    };
  } catch (error) {
    console.error('Error saving bookmarks:', error);
    throw error;
  }
}

// 获取用户的书签数据
export async function getUserBookmarks(userId: string): Promise<UserBookmarkData | null> {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `users/${userId}/bookmarks`));
    
    if (snapshot.exists()) {
      return snapshot.val() as UserBookmarkData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }
}

// 更新单个书签
export async function updateBookmark(
  userId: string,
  bookmarkId: string,
  bookmarkData: Partial<Bookmark>
): Promise<void> {
  try {
    const bookmarkRef = ref(db, `users/${userId}/bookmarks/bookmarks/${bookmarkId}`);
    await set(bookmarkRef, bookmarkData);
    
    // 更新最后修改时间
    const lastUpdatedRef = ref(db, `users/${userId}/bookmarks/lastUpdated`);
    await set(lastUpdatedRef, Date.now());
    
  } catch (error) {
    console.error('Error updating bookmark:', error);
    throw error;
  }
}

// 删除书签
export async function deleteBookmark(userId: string, bookmarkId: string): Promise<void> {
  try {
    const bookmarkRef = ref(db, `users/${userId}/bookmarks/bookmarks/${bookmarkId}`);
    await set(bookmarkRef, null);
    
    // 更新最后修改时间
    const lastUpdatedRef = ref(db, `users/${userId}/bookmarks/lastUpdated`);
    await set(lastUpdatedRef, Date.now());
    
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    throw error;
  }
} 