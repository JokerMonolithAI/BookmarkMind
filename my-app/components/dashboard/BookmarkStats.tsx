'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { eventService, EVENTS } from '@/lib/eventService';

export function BookmarkStats() {
  const { user } = useAuth();
  const [totalBookmarks, setTotalBookmarks] = useState<number>(0);
  const [newThisWeek, setNewThisWeek] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // 将fetchBookmarkStats改为useCallback，以便在useEffect中使用
  const fetchBookmarkStats = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const bookmarksRef = ref(db, `users/${user.uid}/bookmarks/bookmarks`);
      const snapshot = await get(bookmarksRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // 处理数据，计算总数和本周新增
        let bookmarksArray: any[] = [];
        
        // 检查数据结构，处理可能的嵌套情况
        if (typeof data === 'object') {
          // 直接遍历顶层对象
          Object.keys(data).forEach(key => {
            const item = data[key];
            
            // 检查是否是有效的书签对象
            if (item && typeof item === 'object' && item.url) {
              bookmarksArray.push({
                id: key,
                ...item
              });
            } else if (item && typeof item === 'object') {
              // 可能是嵌套的情况，再遍历一层
              Object.keys(item).forEach(subKey => {
                const subItem = item[subKey];
                if (subItem && typeof subItem === 'object' && subItem.url) {
                  bookmarksArray.push({
                    id: `${key}_${subKey}`,
                    ...subItem
                  });
                }
              });
            }
          });
        }
        
        // 计算总数
        setTotalBookmarks(bookmarksArray.length);
        
        // 计算本周新增 - 更详细的调试
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;        
        
        // 尝试一种更直接的方法 - 使用当前日期作为参考点
        const today = new Date();
        const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
                
        // 使用两种方法计算
        const recentBookmarks1 = bookmarksArray.filter(bookmark => {
          // 修改：优先使用addedAt而不是createdAt
          const addedTime = bookmark.addedAt || bookmark.createdAt || 0;
          
          // 检查时间戳是否为字符串，如果是则转换为数字
          const timeValue = typeof addedTime === 'string' ? parseInt(addedTime, 10) : addedTime;
          
          // 检查时间戳是否为秒级时间戳（10位数），如果是则转换为毫秒级（13位数）
          const normalizedTime = timeValue && timeValue.toString().length === 10 
            ? timeValue * 1000 
            : timeValue;
          
          const isRecent = normalizedTime > oneWeekAgo;
                    
          return normalizedTime > oneWeekAgo;
        });
        
        // 方法2：使用Date对象比较
        const recentBookmarks2 = bookmarksArray.filter(bookmark => {
          // 修改：优先使用addedAt而不是createdAt
          const addedTime = bookmark.addedAt || bookmark.createdAt || 0;
          
          // 检查时间戳是否为字符串，如果是则转换为数字
          const timeValue = typeof addedTime === 'string' ? parseInt(addedTime, 10) : addedTime;
          
          // 检查时间戳是否为秒级时间戳（10位数），如果是则转换为毫秒级（13位数）
          const normalizedTime = timeValue && timeValue.toString().length === 10 
            ? timeValue * 1000 
            : timeValue;
          
          // 创建日期对象
          const bookmarkDate = new Date(normalizedTime);
          const isRecent = bookmarkDate > weekStart;
                    
          return isRecent;
        });
                
        // 使用方法2的结果
        setNewThisWeek(recentBookmarks2.length);
      } else {
        setTotalBookmarks(0);
        setNewThisWeek(0);
      }
    } catch (error) {
      console.error('Error fetching bookmark stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 初始加载
  useEffect(() => {
    if (user) {
      fetchBookmarkStats();
    }
  }, [user, fetchBookmarkStats]);

  // 订阅书签导入成功事件
  useEffect(() => {
    // 定义事件处理函数
    const handleBookmarksImported = () => {
      fetchBookmarkStats();
    };
    
    const handleBookmarkDeleted = () => {
      fetchBookmarkStats();
    };
    
    // 订阅事件
    eventService.subscribe(EVENTS.BOOKMARKS_IMPORTED, handleBookmarksImported);
    eventService.subscribe(EVENTS.BOOKMARK_DELETED, handleBookmarkDeleted);
    
    // 组件卸载时取消订阅
    return () => {
      eventService.unsubscribe(EVENTS.BOOKMARKS_IMPORTED, handleBookmarksImported);
      eventService.unsubscribe(EVENTS.BOOKMARK_DELETED, handleBookmarkDeleted);
    };
  }, [fetchBookmarkStats]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">总书签数</h3>
        <p className="mt-2 text-3xl font-bold">{totalBookmarks}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">本周新增</h3>
        <p className="mt-2 text-3xl font-bold">{newThisWeek}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">已分类</h3>
        <p className="mt-2 text-3xl font-bold">
          {totalBookmarks > 0 
            ? `${Math.round((totalBookmarks * 0.78))}%` 
            : '0%'}
        </p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">知识图谱</h3>
        <p className="mt-2 text-3xl font-bold">5</p>
      </Card>
    </div>
  );
} 