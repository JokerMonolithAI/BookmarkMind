import { database } from './firebase';
import { ref, set, get, child } from 'firebase/database';
import { Bookmark, BookmarkFolder, UserBookmarkData } from '../types/bookmark';

// 保存用户的书签数据
export async function saveUserBookmarks(
  userId: string, 
  bookmarks: Record<string, Bookmark>,
  folders: Record<string, BookmarkFolder>
): Promise<void> {
  try {
    const userBookmarksRef = ref(database, `users/${userId}/bookmarks`);
    const userData: UserBookmarkData = {
      bookmarks,
      folders,
      lastUpdated: Date.now()
    };
    
    await set(userBookmarksRef, userData);
    console.log('Bookmarks saved successfully');
  } catch (error) {
    console.error('Error saving bookmarks:', error);
    throw error;
  }
}

// 获取用户的书签数据
export async function getUserBookmarks(userId: string): Promise<UserBookmarkData | null> {
  try {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `users/${userId}/bookmarks`));
    
    if (snapshot.exists()) {
      return snapshot.val() as UserBookmarkData;
    } else {
      console.log('No bookmarks found for user');
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
    const bookmarkRef = ref(database, `users/${userId}/bookmarks/bookmarks/${bookmarkId}`);
    await set(bookmarkRef, bookmarkData);
    
    // 更新最后修改时间
    const lastUpdatedRef = ref(database, `users/${userId}/bookmarks/lastUpdated`);
    await set(lastUpdatedRef, Date.now());
    
    console.log('Bookmark updated successfully');
  } catch (error) {
    console.error('Error updating bookmark:', error);
    throw error;
  }
}

// 删除书签
export async function deleteBookmark(userId: string, bookmarkId: string): Promise<void> {
  try {
    const bookmarkRef = ref(database, `users/${userId}/bookmarks/bookmarks/${bookmarkId}`);
    await set(bookmarkRef, null);
    
    // 更新最后修改时间
    const lastUpdatedRef = ref(database, `users/${userId}/bookmarks/lastUpdated`);
    await set(lastUpdatedRef, Date.now());
    
    console.log('Bookmark deleted successfully');
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    throw error;
  }
} 