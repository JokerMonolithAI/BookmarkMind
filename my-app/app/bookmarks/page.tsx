'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import BookmarkList from '@/components/bookmarks/BookmarkList';
import ImportButton from '@/components/dashboard/ImportButton';
import { ViewProvider, ViewToggle } from '@/components/bookmarks/ViewToggle';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { FilterBar } from '@/components/bookmarks/FilterBar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Loader2 } from 'lucide-react';
import { Footer } from '@/components/ui/footer';

// 创建一个内容组件，使用视图上下文
function BookmarksContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'date' | 'title'>('date');
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleSortChange = (option: 'date' | 'title') => {
    setSortOption(option);
  };
  
  const handleTimeRangeChange = (range: 'all' | 'today' | 'week' | 'month') => {
    setTimeRange(range);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <div className="flex flex-1">
        {/* 左侧边栏 */}
        <Sidebar />
        
        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation Bar - 固定在顶部 */}
          <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm p-2">
            <div className="mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 justify-center">
                <SearchBar onSearch={handleSearch} />
              </div>
              
              <div className="flex items-center gap-2">
                <ImportButton />
                <ThemeToggle />
              </div>
            </div>
          </nav>

          {/* 功能控制栏 */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <ViewToggle />
              <FilterBar 
                sortOption={sortOption} 
                onSortChange={handleSortChange}
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
              />
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="flex-1 mx-auto w-full max-w-7xl p-4 md:p-6">
            <Suspense fallback={
              <div className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            }>
              <BookmarkList 
                searchQuery={searchQuery}
                sortOption={sortOption}
                timeRange={timeRange}
              />
            </Suspense>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// 主 Bookmarks 组件
export default function Bookmarks() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">加载中...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 使用 ViewProvider 包装内容
  return (
    <ViewProvider>
      <BookmarksContent />
    </ViewProvider>
  );
} 