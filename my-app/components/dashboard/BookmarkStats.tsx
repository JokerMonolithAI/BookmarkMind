'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function BookmarkStats() {
  const { user } = useAuth();
  const [totalBookmarks, setTotalBookmarks] = useState<number>(0);
  const [newThisWeek, setNewThisWeek] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBookmarkStats = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const bookmarksRef = ref(db, `users/${user.uid}/bookmarks`);
        const snapshot = await get(bookmarksRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // 处理数据，计算总数和本周新增
          let bookmarksArray: any[] = [];
          
          // 检查数据结构，处理可能的嵌套情况
          if (typeof data === 'object') {
            // 直接遍历顶层对象
            Object.keys(data).forEach(key => {
              const item = data[key];
              
              // 检查是否是有效的书签对象
              if (item && typeof item === 'object' && item.url) {
                bookmarksArray.push({
                  id: key,
                  ...item
                });
              } else if (item && typeof item === 'object') {
                // 可能是嵌套的情况，再遍历一层
                Object.keys(item).forEach(subKey => {
                  const subItem = item[subKey];
                  if (subItem && typeof subItem === 'object' && subItem.url) {
                    bookmarksArray.push({
                      id: `${key}_${subKey}`,
                      ...subItem
                    });
                  }
                });
              }
            });
          }

          // 计算总书签数
          setTotalBookmarks(bookmarksArray.length);
          
          // 计算本周新增
          const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const recentBookmarks = bookmarksArray.filter(bookmark => {
            const createdTime = bookmark.createdAt || bookmark.addedAt || 0;
            return createdTime > oneWeekAgo;
          });
          
          setNewThisWeek(recentBookmarks.length);
        } else {
          setTotalBookmarks(0);
          setNewThisWeek(0);
        }
      } catch (error) {
        console.error('Error fetching bookmark stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkStats();
  }, [user]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">总书签数</h3>
        <p className="mt-2 text-3xl font-bold">{totalBookmarks}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">本周新增</h3>
        <p className="mt-2 text-3xl font-bold">{newThisWeek}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">已分类</h3>
        <p className="mt-2 text-3xl font-bold">
          {totalBookmarks > 0 
            ? `${Math.round((totalBookmarks * 0.78))}%` 
            : '0%'}
        </p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">知识图谱</h3>
        <p className="mt-2 text-3xl font-bold">5</p>
      </Card>
    </div>
  );
} 