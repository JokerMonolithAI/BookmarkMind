'use client'

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Star, Clock, Tag, Trash } from 'lucide-react';

// 在本地定义 Bookmark 接口
interface Bookmark {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  createdAt: number;
  addedAt: number;
  tags?: string[];
}

export default function BookmarkList() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const bookmarksRef = ref(db, `users/${user.uid}/bookmarks`);
    const unsubscribe = onValue(bookmarksRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.bookmarks) {
        // 如果数据是嵌套在 bookmarks 字段中
        const bookmarkArray = Object.values(data.bookmarks) as Bookmark[];
        bookmarkArray.sort((a, b) => b.createdAt - a.createdAt);
        setBookmarks(bookmarkArray);
      } else if (data) {
        // 如果数据直接是书签对象
        const bookmarkArray = Object.values(data) as Bookmark[];
        bookmarkArray.sort((a, b) => b.createdAt - a.createdAt);
        setBookmarks(bookmarkArray);
      } else {
        setBookmarks([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center p-8">加载中...</div>;
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground mb-4">您还没有保存任何书签</p>
        <p className="text-sm">请使用导入功能添加书签，或手动创建新书签</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookmarks.map((bookmark) => (
        <Card key={bookmark.id || `bookmark-${bookmark.url}`} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {bookmark.favicon && (
                  <img 
                    src={bookmark.favicon} 
                    alt="" 
                    className="w-4 h-4" 
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}
                <CardTitle className="text-base truncate">{bookmark.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            {bookmark.description && (
              <CardDescription className="line-clamp-2">
                {bookmark.description}
              </CardDescription>
            )}
            <div className="mt-2">
              <a 
                href={bookmark.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline truncate block"
              >
                {bookmark.url}
              </a>
            </div>
          </CardContent>
          <CardFooter className="pt-0 flex justify-between items-center">
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(bookmark.createdAt).toLocaleDateString()}
            </div>
            <div className="flex gap-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8"
                onClick={() => window.open(bookmark.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8"
                // 这里应该添加删除书签的处理函数
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 