'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import ImportButton from '@/components/dashboard/ImportButton';
import { getTag, getTagBookmarks } from '@/lib/tagService';
import { Bookmark, getUserBookmarksByIds } from '@/lib/bookmarkService';
import { BookmarkCard } from '@/components/bookmarks/BookmarkCard';
import { Tag } from '@/lib/tagService';
import { eventService, EVENTS } from '@/lib/eventService';
import { Loader2, ArrowLeft, Tag as TagIcon, Bookmark as BookmarkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';

interface TagDetailsClientProps {
  tagId: string;
}

export function TagDetailsClient({ tagId }: TagDetailsClientProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tag, setTag] = useState<Tag | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 获取标签信息和相关的书签
  const fetchTagDetails = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // 获取标签信息
      const tagData = await getTag(user.uid, tagId);
      setTag(tagData);
      
      // 获取与标签关联的书签ID列表
      const bookmarkIds = await getTagBookmarks(user.uid, tagId);
      
      // 获取书签详细信息
      const bookmarksData = await getUserBookmarksByIds(user.uid, bookmarkIds);
      
      setBookmarks(bookmarksData);
      setFilteredBookmarks(bookmarksData);
    } catch (error) {
      console.error('Error fetching tag details:', error);
      setError('加载标签详情时出错');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTagDetails();
    } else if (!authLoading) {
      router.push('/login');
    }
  }, [user, authLoading, tagId, router]);

  useEffect(() => {
    // 监听书签删除事件，刷新书签列表
    const handleBookmarkDeleted = () => {
      fetchTagDetails();
    };
    
    eventService.subscribe(EVENTS.BOOKMARK_DELETED, handleBookmarkDeleted);
    
    return () => {
      eventService.unsubscribe(EVENTS.BOOKMARK_DELETED, handleBookmarkDeleted);
    };
  }, []);

  // 处理搜索
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredBookmarks(bookmarks);
      return;
    }
    
    const lowerCaseQuery = query.toLowerCase();
    const filtered = bookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(lowerCaseQuery) || 
      bookmark.url.toLowerCase().includes(lowerCaseQuery) ||
      (bookmark.description && bookmark.description.toLowerCase().includes(lowerCaseQuery))
    );
    
    setFilteredBookmarks(filtered);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <nav className="sticky top-0 z-30 border-b border-gray-200 bg-transparent dark:border-gray-700 shadow-sm p-2">
          <div className="mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 justify-center">
              <SearchBar onSearch={handleSearchChange} />
            </div>
            <div className="flex items-center gap-2">
              <ImportButton />
              <ThemeToggle />
            </div>
          </div>
        </nav>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4"
              onClick={() => router.push('/tags')}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              返回标签列表
            </Button>
            
            {isLoading ? (
              <div className="h-12 flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                <span>正在加载标签信息...</span>
              </div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : tag ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded flex items-center justify-center"
                    style={{ backgroundColor: tag.bgColor }}>
                    <TagIcon className="h-5 w-5" style={{ color: tag.textColor }} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{tag.name}</h1>
                    <p className="text-sm text-muted-foreground">
                      {bookmarks.length} 个书签
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <div className="mb-4 text-red-500">
                {error}
              </div>
              <Button
                variant="outline"
                onClick={() => fetchTagDetails()}
                className="bg-blue-600 hover:bg-blue-700 text-white border-none"
              >
                重试
              </Button>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <div className="flex justify-center mb-2">
                <BookmarkIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">
                {searchQuery ? '没有找到匹配的书签' : '该标签下没有书签'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? '请尝试使用其他搜索词' 
                  : '添加书签到这个标签以便在这里显示它们'
                }
              </p>
              <Link href="/bookmarks">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">去添加书签</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBookmarks.map(bookmark => (
                <BookmarkCard 
                  key={bookmark.id} 
                  bookmark={{
                    ...bookmark,
                    createdAt: bookmark.createdAt
                  }}
                  viewMode="grid"
                  onDeleted={fetchTagDetails}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 