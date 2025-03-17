'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  Loader2, 
  FolderHeart, 
  ChevronLeft, 
  Edit, 
  Trash2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Collection, 
  getCollection, 
  getCollectionBookmarks,
  deleteCollection
} from '@/lib/collectionService';
import { EditCollectionDialog } from '@/components/collections/EditCollectionDialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Bookmark as BookmarkType } from '@/lib/bookmarkService';
import { BookmarkCard } from '@/components/bookmarks/BookmarkCard';
import { AddBookmarkDialog } from '@/components/collections/AddBookmarkDialog';
import { eventService, EVENTS } from '@/lib/eventService';

// 临时定义的书签类型，用于开发阶段
interface CollectionBookmark {
  id: string;
  userId: string;
  url: string;
  title: string;
  description?: string;
  tags?: string[];
  favicon?: string;
  createdAt: number;
  addedAt: number;
  updatedAt: string;
  visitCount: number;
  isRead: boolean;
  isFavorite: boolean;
  type?: 'article' | 'video' | 'image' | 'document' | 'other';
}

function CollectionContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const collectionId = params.id as string;
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [bookmarks, setBookmarks] = useState<CollectionBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddBookmarkDialogOpen, setIsAddBookmarkDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 获取收藏集数据
  const fetchCollectionData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // 获取收藏集信息
      const collectionData = await getCollection(user.uid, collectionId);
      setCollection(collectionData);
      
      // 获取收藏集中的书签
      const bookmarkIds = await getCollectionBookmarks(user.uid, collectionId);
      
      // 这里应该是根据书签ID获取书签详情的逻辑
      // 由于目前API尚未完全实现，我们使用模拟数据
      const now = Date.now();
      const mockBookmarks: CollectionBookmark[] = bookmarkIds.map((id, index) => ({
        id,
        userId: user.uid,
        url: `https://example.com/bookmark/${id}`,
        title: `书签 ${index + 1}`,
        description: `这是书签 ${index + 1} 的描述`,
        tags: ['示例', `标签${index}`],
        favicon: 'https://example.com/favicon.ico',
        createdAt: now - index * 86400000,
        addedAt: now - index * 86400000, // 每个书签的添加时间相差一天
        updatedAt: new Date().toISOString(),
        visitCount: Math.floor(Math.random() * 10),
        isRead: Math.random() > 0.5,
        isFavorite: Math.random() > 0.7,
        type: 'article'
      }));
      
      setBookmarks(mockBookmarks);
    } catch (error) {
      console.error('Error fetching collection data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collectionId) {
      fetchCollectionData();
      
      // 订阅书签删除事件
      const handleBookmarkDeleted = () => {
        fetchCollectionData();
      };
      
      eventService.subscribe(EVENTS.BOOKMARK_DELETED, handleBookmarkDeleted);
      
      // 组件卸载时取消订阅
      return () => {
        eventService.unsubscribe(EVENTS.BOOKMARK_DELETED, handleBookmarkDeleted);
      };
    }
  }, [collectionId, user]);

  // 处理删除收藏集
  const handleDeleteCollection = async () => {
    if (!user || !collection) return;
    
    try {
      setIsDeleting(true);
      await deleteCollection(user.uid, collection.id);
      router.push('/collections');
    } catch (error) {
      console.error('Error deleting collection:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 处理添加书签
  const handleAddBookmark = () => {
    setIsAddBookmarkDialogOpen(true);
  };

  // 处理书签添加成功
  const handleBookmarkAdded = () => {
    fetchCollectionData();
    setIsAddBookmarkDialogOpen(false);
  };

  // 过滤书签
  const filteredBookmarks = bookmarks.filter(bookmark => {
    // 搜索过滤
    const matchesSearch = 
      !searchQuery || 
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bookmark.description && bookmark.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">收藏集不存在</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          该收藏集可能已被删除或您没有访问权限
        </p>
        <Button 
          onClick={() => router.push('/collections')}
          className="mt-4"
        >
          返回收藏集列表
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      {/* 左侧边栏 */}
      <Sidebar />
      
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar - 固定在顶部 */}
        <nav className="sticky top-0 z-30 border-b border-gray-200 bg-transparent dark:border-gray-700 shadow-sm p-2">
          <div className="mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 justify-center">
              <SearchBar onSearch={handleSearch} />
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* 页面标题和操作按钮 */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.push('/collections')}
                className="mr-1"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <FolderHeart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{collection.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                编辑
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-500 dark:border-red-800/30 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                删除
              </Button>
            </div>
          </div>
          {collection.description && (
            <p className="text-gray-500 dark:text-gray-400 mt-1 ml-10">
              {collection.description}
            </p>
          )}
        </div>

        {/* 功能控制栏 */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-transparent p-2 flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="flex items-center gap-2">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
              onClick={handleAddBookmark}
            >
              <Plus className="h-4 w-4 mr-1" />
              添加书签
            </Button>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 p-4">
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <FolderHeart className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {searchQuery ? '没有找到匹配的书签' : '此收藏集中还没有书签'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {searchQuery 
                  ? '尝试使用不同的搜索条件' 
                  : '点击"添加书签"按钮添加您的第一个书签'}
              </p>
              {!searchQuery && (
                <Button 
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleAddBookmark}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加书签
                </Button>
              )}
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
                  onDeleted={fetchCollectionData}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 编辑收藏集对话框 */}
      <EditCollectionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        collection={collection}
        onUpdated={fetchCollectionData}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除收藏集 "{collection.name}" 吗？此操作无法撤销，收藏集中的所有书签关联将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCollection}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 添加书签对话框 */}
      <AddBookmarkDialog
        open={isAddBookmarkDialogOpen}
        onOpenChange={setIsAddBookmarkDialogOpen}
        collectionId={collection.id}
        onAdded={handleBookmarkAdded}
      />
    </div>
  );
}

// 主 Collection 详情组件
export default function CollectionDetail() {
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

  return <CollectionContent />;
} 