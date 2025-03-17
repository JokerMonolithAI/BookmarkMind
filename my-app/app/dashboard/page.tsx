'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react'
import { BookmarkStats } from '@/components/dashboard/BookmarkStats'
import BookmarkList from '@/components/dashboard/BookmarkList'
import ImportButton from '@/components/dashboard/ImportButton'
import { ViewProvider, useView } from '@/components/dashboard/ViewToggle'
import { SearchBar } from '@/components/dashboard/SearchBar'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { CategoryTabs } from '@/components/dashboard/CategoryTabs'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Loading } from '@/components/ui/loading'
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type CategoryType = 'smart' | 'collections' | 'tags' | 'timeline';

// 创建一个内容组件，使用视图上下文
function DashboardContent() {
  const { activeView } = useView();
  const [activeCategory, setActiveCategory] = useState<CategoryType>('smart');
  
  const handleCategoryChange = (category: CategoryType) => {
    setActiveCategory(category);
  };
  
  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      {/* 左侧边栏 */}
      <Sidebar />
      
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar - 固定在顶部 */}
        <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm p-2">
          <div className="mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 justify-center">
              <SearchBar />
            </div>
            
            <div className="flex items-center gap-2">
              <ImportButton />
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 mx-auto w-full max-w-7xl">
          {/* Stats Overview - 固定在导航栏下方 */}
          <div className="sticky top-[57px] z-20 pt-4 px-4 md:px-6 pb-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            <Suspense fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            }>
              <BookmarkStats />
            </Suspense>
          </div>

          {/* 分类筛选标签栏 */}
          <div className="px-4 md:px-6 mt-4">
            <CategoryTabs onCategoryChange={handleCategoryChange} />
          </div>

          {/* Content View (List/Timeline) - 可滚动区域 */}
          <div className="px-4 md:px-6 pb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Suspense fallback={
                <div className="p-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              }>
                <div className="p-4 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {/* 显示书签列表 */}
                  <BookmarkList />
                </div>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 主 Dashboard 组件
export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  // 使用 ViewProvider 包装内容
  return (
    <ViewProvider>
      <DashboardContent />
    </ViewProvider>
  );
} 