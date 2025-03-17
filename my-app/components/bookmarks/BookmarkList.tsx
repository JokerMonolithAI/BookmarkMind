'use client'

import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { eventService, EVENTS } from '@/lib/eventService';
import { useAuth } from '@/context/AuthContext';

interface BookmarkListProps {
  searchQuery?: string;
  sortOption?: 'date' | 'title';
  timeRange?: 'all' | 'today' | 'week' | 'month';
}

export default function BookmarkList({
  searchQuery = '',
  sortOption = 'date',
  timeRange = 'all'
}: BookmarkListProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 模拟获取数据的函数
  const fetchBookmarks = () => {
    setLoading(true);
    // 这里应该是实际的数据获取逻辑
    setTimeout(() => {
      setLoading(false);
      // 更新刷新键，触发重新渲染
      setRefreshKey(prev => prev + 1);
    }, 500);
  };

  // 订阅书签导入成功事件
  useEffect(() => {
    if (user) {
      // 初始加载
      fetchBookmarks();
      
      // 处理书签导入成功事件
      const handleBookmarksImported = () => {
        fetchBookmarks();
      };
      
      // 订阅事件
      eventService.subscribe(EVENTS.BOOKMARKS_IMPORTED, handleBookmarksImported);
      
      // 组件卸载时取消订阅
      return () => {
        eventService.unsubscribe(EVENTS.BOOKMARKS_IMPORTED, handleBookmarksImported);
      };
    }
  }, [user]);

  return (
    <div className="text-center py-8">
      {loading ? (
        <div className="animate-pulse">
          <FileText className="h-12 w-12 mx-auto text-gray-200 dark:text-gray-700 mb-3" />
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
        </div>
      ) : (
        <>
          <FileText className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">正在开发中</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            书签列表功能即将上线
          </p>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>搜索词: {searchQuery || '无'}</p>
            <p>排序方式: {sortOption}</p>
            <p>时间范围: {timeRange}</p>
            <p>刷新次数: {refreshKey}</p>
          </div>
        </>
      )}
    </div>
  );
} 