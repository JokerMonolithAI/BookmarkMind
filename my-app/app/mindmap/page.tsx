'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import ImportButton from '@/components/dashboard/ImportButton';
import { ViewToggle, ViewProvider, useView } from '@/components/dashboard/ViewToggle';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// 临时的分类数据，后续会从数据库获取
const tempCategories = [
  { id: 'all', name: '我的脑图' },
  { id: 'cat1', name: '分类1' },
  { id: 'cat2', name: '分类2' },
  { id: 'cat3', name: '分类3' },
];

// 脑图内容组件
function MindMapContent() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');

  // 处理分类点击
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // 处理分类编辑
  const handleEditClick = (category: { id: string; name: string }) => {
    setEditingCategory(category.id);
    setCategoryName(category.name);
  };

  // 处理分类删除
  const handleDeleteClick = (categoryId: string) => {
    // 这里将来会实现删除逻辑
    console.log('删除分类:', categoryId);
  };

  // 处理编辑保存
  const handleSaveEdit = () => {
    // 这里将来会实现保存逻辑
    console.log('保存编辑:', editingCategory, categoryName);
    setEditingCategory(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top Navigation Bar - 固定在顶部 */}
      <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white p-2">
        <div className="mx-auto flex items-center justify-between">
          {/* 系统图标区域 */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-blue-600 font-bold text-xl mr-4">
              BookmarkMind
            </Link>
          </div>
          
          <div className="flex items-center gap-3 flex-1 justify-center">
            <ImportButton />
            <SearchBar />
          </div>
          
          <div className="flex items-center">
            <ViewToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* 左侧导航区 - 缩小宽度 */}
        <div className="w-48 border-r border-gray-200 bg-white">
          <div className="p-4">
            <h2 className="text-gray-500 text-sm font-medium mb-3">分类导航</h2>
            <ul className="space-y-1">
              {tempCategories.map((category) => (
                <li key={category.id}>
                  <div className="flex items-center justify-between group">
                    {editingCategory === category.id ? (
                      <div className="flex items-center w-full">
                        <input
                          type="text"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          className="flex-1 p-1 border border-blue-300 rounded text-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSaveEdit}
                          className="ml-1 h-6 w-6 p-0"
                        >
                          ✓
                        </Button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCategoryClick(category.id)}
                          className={`w-full text-left py-1.5 px-2 rounded-md text-sm ${
                            selectedCategory === category.id
                              ? 'bg-blue-50 text-blue-600'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {category.name}
                        </button>
                        
                        {/* 只对非"我的脑图"显示编辑和删除按钮 */}
                        {category.id !== 'all' && (
                          <div className="hidden group-hover:flex">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditClick(category)}
                              className="h-6 w-6 p-0"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteClick(category.id)}
                              className="h-6 w-6 p-0 text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 右侧脑图区域 - 扩大区域 */}
        <div className="flex-1 p-4">
          <h2 className="text-xl font-medium mb-4">
            {selectedCategory === 'all' 
              ? '我的脑图' 
              : tempCategories.find(c => c.id === selectedCategory)?.name || ''}
          </h2>
          <div className="h-[calc(100vh-120px)] border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-500">
            <div>此区域为脑图全部区域</div>
            <div className="mt-2">思维导图视图开发中...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 主 MindMap 页面组件
export default function MindMapPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  // 使用 ViewProvider 包装内容
  return (
    <ViewProvider>
      <MindMapContent />
    </ViewProvider>
  );
} 