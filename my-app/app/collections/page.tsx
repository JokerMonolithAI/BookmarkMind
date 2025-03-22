'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import ImportButton from '@/components/dashboard/ImportButton';
import { Loader2, FolderHeart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collection, getUserCollections } from '@/lib/collectionService';
import { CollectionCard } from '@/components/collections/CollectionCard';
import { CreateCollectionDialog } from '@/components/collections/CreateCollectionDialog';
import { Footer } from '@/components/ui/footer';

function CollectionsContent() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
    fetchCollections();
  }, [user]);

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 过滤收藏集
  const filteredCollections = collections.filter(collection => 
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (collection.description && collection.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 创建收藏集成功后的回调
  const handleCollectionCreated = () => {
    fetchCollections();
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <div className="flex flex-1">
        {/* 左侧边栏 */}
        <Sidebar />
        
        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation Bar - 固定在顶部 */}
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

          {/* 页面标题和操作按钮 */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderHeart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">我的收藏集</h1>
              </div>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                新建收藏集
              </Button>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="flex-1 mx-auto w-full max-w-7xl p-4 md:p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredCollections.length === 0 ? (
              <div className="text-center py-12">
                <FolderHeart className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                {collections.length === 0 ? (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">还没有收藏集</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      创建您的第一个收藏集来组织您的书签
                    </p>
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      新建收藏集
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">没有找到匹配的收藏集</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      尝试使用不同的搜索条件
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCollections.map(collection => (
                  <CollectionCard 
                    key={collection.id} 
                    collection={collection} 
                    onDeleted={fetchCollections}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* 创建收藏集对话框 */}
      <CreateCollectionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreated={handleCollectionCreated}
      />
    </div>
  );
}

// 主 Collections 组件
export default function Collections() {
  const { user, loading } = useAuth();
  const router = useRouter();

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

  return <CollectionsContent />;
} 