'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Suspense } from 'react'
import { BookmarkStats } from '@/components/dashboard/BookmarkStats'
import BookmarkList from '@/components/dashboard/BookmarkList'
import { MindMap } from '@/components/dashboard/MindMap'
import ImportButton from '@/components/dashboard/ImportButton'
import { ViewToggle, ViewProvider, useView } from '@/components/dashboard/ViewToggle'
import { SearchBar } from '@/components/dashboard/SearchBar'
import { Loading } from '@/components/ui/loading'
import { Loader2 } from 'lucide-react';

// 创建一个内容组件，使用视图上下文
function DashboardContent() {
  const { activeView } = useView();
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Top Navigation Bar - 固定在顶部 */}
      <nav className="sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm p-4">
        <div className="mx-auto flex flex-col sm:flex-row max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <ImportButton />
            <SearchBar />
          </div>
          <ViewToggle />
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 mx-auto w-full max-w-7xl">
        {/* Stats Overview - 固定在导航栏下方 */}
        <div className="sticky top-[73px] z-20 pt-4 px-4 md:px-6 pb-2 bg-gradient-to-br from-white to-gray-50">
          <Suspense fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          }>
            <BookmarkStats />
          </Suspense>
        </div>

        {/* Content View (List/Mind Map) - 可滚动区域 */}
        <div className="px-4 md:px-6 pb-6 mt-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <Suspense fallback={
              <div className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            }>
              <div className="p-4 max-h-[calc(100vh-220px)] overflow-y-auto">
                <BookmarkList />
              </div>
              
              {/* 根据当前视图显示或隐藏脑图区域 */}
              {activeView !== 'list' && (
                <div className="p-4 mt-6 border-t border-gray-100">
                  {activeView === 'grid' && <MindMap />}
                  {activeView === 'timeline' && (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      时间轴视图正在开发中...
                    </div>
                  )}
                </div>
              )}
            </Suspense>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
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