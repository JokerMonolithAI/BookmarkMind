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

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <nav className="border-b bg-card p-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <ImportButton />
            <SearchBar />
          </div>
          <ViewToggle />
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-6">
        {/* Stats Overview */}
        <Suspense fallback={<Loading />}>
          <BookmarkStats />
        </Suspense>

        {/* Content View (List/Mind Map) */}
        <div className="mt-6">
          <Suspense fallback={<Loading />}>
            <BookmarkList />
            <MindMap />
          </Suspense>
        </div>
      </main>
    </div>
  );
} 