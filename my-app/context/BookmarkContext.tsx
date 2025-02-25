'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserBookmarks, saveUserBookmarks } from '../lib/bookmarkService';
import { Bookmark, BookmarkFolder, UserBookmarkData } from '../types/bookmark';

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
    if (!user) {
      setBookmarks({});
      setFolders({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userData = await getUserBookmarks(user.uid);
      
      if (userData) {
        setBookmarks(userData.bookmarks || {});
        setFolders(userData.folders || {});
      } else {
        // 用户没有书签数据
        setBookmarks({});
        setFolders({});
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
      setError('加载书签失败，请稍后再试');
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

    try {
      setLoading(true);
      await saveUserBookmarks(user.uid, newBookmarks, newFolders);
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