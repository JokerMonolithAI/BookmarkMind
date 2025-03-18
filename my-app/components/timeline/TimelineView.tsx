'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserBookmarks, Bookmark } from '@/lib/bookmarkService';
import { Loader2, Clock, CalendarDays, Calendar, History } from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, startOfWeek, startOfMonth, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';

// 时间分组类型
type TimeGroup = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'earlier';

// 时间分组映射为中文名称
const timeGroupLabels: Record<TimeGroup, string> = {
  today: '今天',
  yesterday: '昨天',
  thisWeek: '本周',
  thisMonth: '本月',
  earlier: '更早'
};

// 时间分组图标
const timeGroupIcons: Record<TimeGroup, React.ReactNode> = {
  today: <Clock className="h-5 w-5" />,
  yesterday: <CalendarDays className="h-5 w-5" />,
  thisWeek: <Calendar className="h-5 w-5" />,
  thisMonth: <Calendar className="h-5 w-5" />,
  earlier: <History className="h-5 w-5" />
};

// 组件接口定义
interface TimelineViewProps {
  searchQuery?: string;
}

export default function TimelineView({ searchQuery = '' }: TimelineViewProps) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取用户书签
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const fetchedBookmarks = await getUserBookmarks(user.uid);
        // 按创建时间降序排序（最新的在前）
        const sortedBookmarks = fetchedBookmarks.sort((a, b) => b.createdAt - a.createdAt);
        setBookmarks(sortedBookmarks);
        setFilteredBookmarks(sortedBookmarks);
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
        setError('获取书签数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookmarks();
  }, [user]);
  
  // 处理搜索
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBookmarks(bookmarks);
      return;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = bookmarks.filter(bookmark => 
      bookmark.title?.toLowerCase().includes(lowercaseQuery) || 
      bookmark.url.toLowerCase().includes(lowercaseQuery) ||
      bookmark.description?.toLowerCase().includes(lowercaseQuery)
    );
    
    setFilteredBookmarks(filtered);
  }, [searchQuery, bookmarks]);
  
  // 将书签按时间分组
  const groupBookmarksByTime = (bookmarks: Bookmark[]) => {
    const now = new Date();
    const groups: Record<TimeGroup, Bookmark[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      earlier: []
    };
    
    bookmarks.forEach(bookmark => {
      const date = new Date(bookmark.createdAt);
      
      if (isToday(date)) {
        groups.today.push(bookmark);
      } else if (isYesterday(date)) {
        groups.yesterday.push(bookmark);
      } else if (date > startOfWeek(now, { locale: zhCN })) {
        groups.thisWeek.push(bookmark);
      } else if (date > startOfMonth(now)) {
        groups.thisMonth.push(bookmark);
      } else {
        groups.earlier.push(bookmark);
      }
    });
    
    return groups;
  };
  
  // 格式化日期显示
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return `今天 ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `昨天 ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MM月dd日 HH:mm');
    }
  };
  
  // 获取书签的favicon
  const getFavicon = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch (e) {
      return '/placeholder-favicon.png'; // 使用一个占位图像
    }
  };
  
  // 获取书签的颜色（基于URL生成一个稳定的颜色）
  const getBookmarkColor = (bookmark: Bookmark): string => {
    // 基于URL生成一个稳定的颜色
    const urlHash = hashString(bookmark.url);
    const colors = [
      '#F87171', // 红色
      '#FB923C', // 橙色
      '#FBBF24', // 黄色
      '#34D399', // 绿色
      '#60A5FA', // 蓝色
      '#818CF8', // 靛蓝色
      '#A78BFA', // 紫色
      '#F472B6', // 粉色
      '#4B5563', // 灰色
    ];
    
    return colors[urlHash % colors.length];
  };
  
  // 辅助函数：调整颜色亮度
  const adjustColor = (color: string, amount: number): string => {
    // 如果颜色不是HEX格式，直接返回
    if (!color.startsWith('#')) return color;
    
    let hex = color.slice(1);
    
    // 处理3位颜色
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    // 转换为RGB
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    
    // 调整亮度
    const newR = Math.min(255, Math.max(0, r + amount));
    const newG = Math.min(255, Math.max(0, g + amount));
    const newB = Math.min(255, Math.max(0, b + amount));
    
    // 转回HEX
    const newHex = '#' + 
      ((1 << 24) + (newR << 16) + (newG << 8) + newB)
        .toString(16)
        .slice(1);
    
    return newHex;
  };
  
  // 辅助函数：生成字符串的哈希值
  const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  
  if (filteredBookmarks.length === 0) {
    if (searchQuery) {
      return (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            没有找到匹配的书签
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            尝试使用其他搜索关键词
          </p>
        </div>
      );
    }
    
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          暂无书签记录
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          添加书签后将在此处显示时间线
        </p>
      </div>
    );
  }
  
  const bookmarkGroups = groupBookmarksByTime(filteredBookmarks);
  const timeGroups = Object.keys(bookmarkGroups) as TimeGroup[];
  
  return (
    <div className="space-y-8">
      {timeGroups.map(group => {
        const groupBookmarks = bookmarkGroups[group];
        
        if (groupBookmarks.length === 0) return null;
        
        return (
          <div key={group} className="relative">
            {/* 时间段标题 */}
            <div className="flex items-center mb-4 sticky top-0 bg-white dark:bg-gray-900 py-2 z-10">
              <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                {timeGroupIcons[group]}
              </div>
              <h2 className="text-xl font-bold">{timeGroupLabels[group]}</h2>
              <div className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                {groupBookmarks.length} 个书签
              </div>
            </div>
            
            {/* 时间线和书签 */}
            <div className="space-y-4 ml-6 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
              {groupBookmarks.map((bookmark) => (
                <div key={bookmark.id} className="relative pl-8 pb-4 before:absolute before:left-0 before:top-2 before:w-3 before:h-3 before:bg-blue-500 before:rounded-full before:z-10">
                  <div className="absolute left-6 top-2.5 w-4 h-[1px] bg-gray-300 dark:bg-gray-600"></div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                    {/* 添加渐变彩色顶部 */}
                    <div 
                      className="h-4" 
                      style={{ 
                        background: `linear-gradient(to right, ${getBookmarkColor(bookmark)}, ${adjustColor(getBookmarkColor(bookmark), 30)})` 
                      }}
                    ></div>
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Favicon */}
                        <div className="flex-shrink-0 w-8 h-8 rounded overflow-hidden">
                          <img
                            src={getFavicon(bookmark.url)}
                            alt="网站图标"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-favicon.png';
                            }}
                          />
                        </div>
                        
                        {/* 主内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col">
                            <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 truncate">
                              <Link href={bookmark.url} target="_blank" rel="noopener noreferrer">
                                {bookmark.title || '无标题'}
                              </Link>
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {bookmark.url}
                            </p>
                            {bookmark.description && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                                {bookmark.description}
                              </p>
                            )}
                          </div>
                          
                          {/* 时间标记 */}
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            添加于 {formatDate(bookmark.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
} 