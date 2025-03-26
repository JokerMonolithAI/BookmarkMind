'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  getUserBookmarks,
  getUserFolders,
  saveUserBookmarks,
  Bookmark
} from '../lib/supabaseBookmarkService';
import { BookmarkFolder } from '../types/bookmark';

interface BookmarkContextType {
  bookmarks: Record<string, Bookmark>;
  folders: Record<string, BookmarkFolder>;
  loading: boolean;
  error: string | null;
  saveBookmarks: (bookmarks: Record<string, Bookmark>, folders: Record<string, BookmarkFolder>) => Promise<void>;
  refreshBookmarks: () => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Record<string, Bookmark>>({});
  const [folders, setFolders] = useState<Record<string, BookmarkFolder>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 加载用户书签数据
  const loadUserBookmarks = async () => {
    setLoading(true);
    setError(null);
    
    // 如果用户未登录，重置书签状态并返回
    if (!user) {
      setBookmarks({});
      setFolders({});
      setLoading(false);
      return;
    }
    
    try {
      // 确保用户ID有效
      if (!user.id) {
        console.warn('用户已登录但ID无效');
        setBookmarks({});
        setFolders({});
        setLoading(false);
        return;
      }
      
      // 并行获取书签和文件夹
      const [bookmarksList, foldersData] = await Promise.all([
        getUserBookmarks(user.id),
        getUserFolders(user.id)
      ]);
      
      // 将书签列表转换为对象格式
      const bookmarksObj: Record<string, Bookmark> = {};
      bookmarksList.forEach(bookmark => {
        bookmarksObj[bookmark.id] = bookmark;
      });
      
      setBookmarks(bookmarksObj);
      setFolders(foldersData);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
      setError('加载书签失败，请稍后再试');
      // 重置状态
      setBookmarks({});
      setFolders({});
    } finally {
      setLoading(false);
    }
  };

  // 保存书签数据
  const saveBookmarks = async (
    newBookmarks: Record<string, Bookmark>,
    newFolders: Record<string, BookmarkFolder>
  ) => {
    if (!user) {
      setError('用户未登录，无法保存书签');
      return;
    }
    
    if (!user.id) {
      setError('用户ID无效，无法保存书签');
      return;
    }

    try {
      setLoading(true);
      await saveUserBookmarks(user.id, newBookmarks, newFolders);
      setBookmarks(newBookmarks);
      setFolders(newFolders);
      setError(null);
    } catch (err) {
      console.error('Failed to save bookmarks:', err);
      setError('保存书签失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 刷新书签数据
  const refreshBookmarks = async () => {
    await loadUserBookmarks();
  };

  // 用户变化时加载书签
  useEffect(() => {
    loadUserBookmarks();
  }, [user]);

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        folders,
        loading,
        error,
        saveBookmarks,
        refreshBookmarks,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
} 