'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Suspense } from 'react'
import { BookmarkStats } from '@/components/dashboard/BookmarkStats'
import BookmarkList from '@/components/dashboard/BookmarkList'
import { MindMap } from '@/components/dashboard/MindMap'
import ImportButton from '@/components/dashboard/ImportButton'
import { ViewToggle } from '@/components/dashboard/ViewToggle'
import { SearchBar } from '@/components/dashboard/SearchBar'
import { Loading } from '@/components/ui/loading'
import { Loader2 } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Top Navigation Bar */}
      <nav className="border-b border-gray-100 bg-white shadow-sm p-4">
        <div className="mx-auto flex flex-col sm:flex-row max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <ImportButton />
            <SearchBar />
          </div>
          <ViewToggle />
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-4 md:p-6 space-y-6">
        {/* Stats Overview */}
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

        {/* Content View (List/Mind Map) */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Suspense fallback={
            <div className="p-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          }>
            <div className="p-4">
              <BookmarkList />
            </div>
            <div className="p-4 mt-6">
              <MindMap />
            </div>
          </Suspense>
        </div>
      </main>
    </div>
  );
} 