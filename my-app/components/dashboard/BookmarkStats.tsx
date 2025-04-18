'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp, PieChart, Network } from 'lucide-react';
import { eventService, EVENTS } from '@/lib/eventService';
import Link from 'next/link';
import { getUserBookmarks } from '@/lib/supabaseBookmarkService';

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
      
      // 使用 Supabase 获取书签数据
      const bookmarks = await getUserBookmarks(user.id);
      
      // 计算总数
      setTotalBookmarks(bookmarks.length);
      
      // 计算本周新增
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const today = new Date();
      const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
      
      // 使用方法2：使用Date对象比较
      const recentBookmarks = bookmarks.filter(bookmark => {
        // 优先使用addedAt而不是createdAt
        const addedTime = bookmark.addedAt || bookmark.createdAt || 0;
        
        // 检查时间戳是否为字符串，如果是则转换为数字
        const timeValue = typeof addedTime === 'string' ? parseInt(addedTime, 10) : addedTime;
        
        // 检查时间戳是否为秒级时间戳（10位数），如果是则转换为毫秒级（13位数）
        const normalizedTime = timeValue && timeValue.toString().length === 10 
          ? timeValue * 1000 
          : timeValue;
        
        // 创建日期对象
        const bookmarkDate = new Date(normalizedTime);
        return bookmarkDate > weekStart;
      });
      
      // 更新本周新增数量
      setNewThisWeek(recentBookmarks.length);
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
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">总书签数</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{totalBookmarks}</p>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <div className="w-7 h-7 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#1877F2] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">本周新增</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{newThisWeek}</p>
          </div>
          <div className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-full">
            <TrendingUp className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>
      
      <Card className="p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">已分类</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {totalBookmarks > 0 
                ? `${Math.round((totalBookmarks * 0.78))}%` 
                : '0%'}
            </p>
          </div>
          <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-full">
            <PieChart className="h-7 w-7 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </Card>
      
      <Link href="/mindmap">
        <Card className="p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">知识图谱</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">5</p>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-full">
              <Network className="h-7 w-7 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
} 