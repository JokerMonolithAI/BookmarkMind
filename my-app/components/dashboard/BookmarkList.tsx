'use client'

import { useBookmarks } from '@/context/BookmarkContext';
import { Bookmark } from '@/types/bookmark';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Folder } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function BookmarkList() {
  const { bookmarks, folders, loading, error } = useBookmarks();
  
  if (loading) {
    return <BookmarkListSkeleton />;
  }
  
  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
        <p className="mt-2">请刷新页面或稍后再试</p>
      </div>
    );
  }
  
  const bookmarkArray = Object.values(bookmarks);
  
  if (bookmarkArray.length === 0) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-xl font-medium mb-2">暂无书签</h3>
        <p className="text-muted-foreground">
          点击"导入书签"按钮从浏览器导入您的书签
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {bookmarkArray.map((bookmark) => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} folders={folders} />
      ))}
    </div>
  );
}

function BookmarkCard({ bookmark, folders }: { bookmark: Bookmark, folders: Record<string, BookmarkFolder> }) {
  const folderName = bookmark.folderId ? folders[bookmark.folderId]?.name : null;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {bookmark.favicon ? (
            <div className="w-5 h-5 relative">
              <Image 
                src={bookmark.favicon} 
                alt="" 
                fill 
                className="object-contain"
                onError={(e) => {
                  // 如果图标加载失败，隐藏图像
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : null}
          <CardTitle className="text-base truncate">{bookmark.title}</CardTitle>
        </div>
        {folderName && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Folder className="h-3 w-3 mr-1" />
            <span>{folderName}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        {bookmark.description && (
          <CardDescription className="line-clamp-3">
            {bookmark.description}
          </CardDescription>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center text-xs text-muted-foreground">
        <span>
          {bookmark.addedAt 
            ? formatDistanceToNow(bookmark.addedAt, { addSuffix: true, locale: zhCN }) 
            : '未知时间'}
        </span>
        <a 
          href={bookmark.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center hover:text-primary"
        >
          <span className="mr-1">访问</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </CardFooter>
    </Card>
  );
}

function BookmarkListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter className="pt-0 flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 