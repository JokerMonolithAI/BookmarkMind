'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { SearchBar } from '@/components/dashboard/SearchBar';
import TimelineView from '@/components/timeline/TimelineView';
import ImportButton from '@/components/dashboard/ImportButton';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Loader2, Clock } from 'lucide-react';
import { Footer } from '@/components/ui/footer';

export default function TimelinePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <div className="flex flex-1">
        {/* 左侧边栏 */}
        <Sidebar />
        
        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部导航栏 */}
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

          {/* 主内容 */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto px-4 py-6">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                  <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">时间线</h1>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <TimelineView searchQuery={searchQuery} />
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
} 