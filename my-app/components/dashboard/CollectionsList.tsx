'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Collection, getUserCollections } from '@/lib/collectionService';
import { Loader2, Bookmark, FolderHeart } from 'lucide-react';
import { eventService, EVENTS } from '@/lib/eventService';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function CollectionsList() {
  const router = useRouter();
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取收藏集数据
  const fetchCollections = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const collectionsData = await getUserCollections(user.uid);
      setCollections(collectionsData);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCollections();

      // 监听集合更新事件
      const handleCollectionUpdated = () => {
        fetchCollections();
      };
      
      eventService.subscribe(EVENTS.COLLECTION_UPDATED, handleCollectionUpdated);
      
      // 组件卸载时取消订阅
      return () => {
        eventService.unsubscribe(EVENTS.COLLECTION_UPDATED, handleCollectionUpdated);
      };
    }
  }, [user]);

  const handleCollectionClick = (collectionId: string) => {
    router.push(`/collections/${collectionId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          暂无收藏集
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {collections.map((collection) => {
        // 格式化时间
        const formattedTime = collection.updatedAt 
          ? formatDistanceToNow(new Date(collection.updatedAt), { addSuffix: true, locale: zhCN })
          : '未知时间';
        
        return (
          <div 
            key={collection.id}
            onClick={() => handleCollectionClick(collection.id)}
            className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white dark:bg-gray-800"
          >
            {/* 顶部渐变蓝色背景部分 */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-full p-2 w-fit">
                <FolderHeart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            {/* 内容部分 */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {collection.name}
              </h3>
              {collection.description && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {collection.description}
                </p>
              )}
            </div>
            
            {/* 底部信息部分 */}
            <div className="px-4 py-3 flex justify-between border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Bookmark className="h-4 w-4 mr-1" />
                <span>{collection.bookmarkCount || 0} 书签</span>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span>{formattedTime}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 