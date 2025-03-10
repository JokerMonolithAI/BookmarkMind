'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import ImportButton from '@/components/dashboard/ImportButton';
import { ViewToggle, ViewProvider, useView } from '@/components/dashboard/ViewToggle';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { Loader2, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { mockApiService } from '@/lib/mockApiService';
import SimpleMindMap from '@/components/mindmap/SimpleMindMap';
import EnhancedMindMapWithProvider from '@/components/mindmap/EnhancedMindMap';
import AnalysisProgress from '@/components/mindmap/AnalysisProgress';
import { TaskStatus, MindMapData } from '@/types/mindmap';

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
  const { user } = useAuth();
  
  // 分析状态
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 处理分类点击
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // 切换分类时重置脑图数据
    setMindMapData(null);
    setTaskStatus(null);
    setTaskId(null);
    setPollCount(0);
    setError(null);
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
  
  // 处理分析按钮点击
  const handleAnalyzeClick = async () => {
    if (!user) return;
    
    setIsAnalyzing(true);
    setError(null);
    setMindMapData(null);
    setTaskStatus(null);
    setPollCount(0);
    
    try {
      // 启动分析任务
      const startResult = await mockApiService.startAnalyzeTask(user.uid, selectedCategory);
      setTaskId(startResult.taskId);
      setTaskStatus(startResult);
      
      // 开始轮询任务状态
      pollTaskStatus(startResult.taskId);
    } catch (err) {
      console.error('启动分析失败:', err);
      setError(err instanceof Error ? err.message : '启动分析失败，请稍后重试');
      setIsAnalyzing(false);
    }
  };
  
  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    try {
      // 更新轮询次数（使用函数式更新确保使用最新状态）
      setPollCount(prevCount => {
        const newPollCount = prevCount + 1;
        
        // 在状态更新的回调中执行后续逻辑
        setTimeout(async () => {
          try {
            // 获取任务状态
            const status = await mockApiService.getTaskStatus(taskId, newPollCount);
            setTaskStatus(status);
            
            // 根据状态决定下一步操作
            if (status.status === 'completed') {
              // 任务完成，获取结果
              const result = await mockApiService.getAnalysisResult(taskId, selectedCategory);
              setMindMapData(result);
              setIsAnalyzing(false);
            } else if (status.status === 'failed') {
              // 任务失败
              setError(status.error || '分析失败，请稍后重试');
              setIsAnalyzing(false);
            } else if (status.status === 'processing') {
              // 任务处理中，继续轮询
              pollTaskStatus(taskId);
            }
          } catch (err) {
            console.error('轮询任务状态失败:', err);
            setError(err instanceof Error ? err.message : '获取分析状态失败，请稍后重试');
            setIsAnalyzing(false);
          }
        }, 1500);
        
        return newPollCount;
      });
    } catch (err) {
      console.error('轮询任务状态失败:', err);
      setError(err instanceof Error ? err.message : '获取分析状态失败，请稍后重试');
      setIsAnalyzing(false);
    }
  };
  
  // 重试分析
  const handleRetry = () => {
    setError(null);
    handleAnalyzeClick();
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium">
              {selectedCategory === 'all' 
                ? '我的脑图' 
                : tempCategories.find(c => c.id === selectedCategory)?.name || ''}
            </h2>
            
            {/* 添加"开始分析"按钮 */}
            <Button 
              onClick={handleAnalyzeClick} 
              disabled={isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                '开始分析'
              )}
            </Button>
          </div>
          
          {/* 脑图展示区域 */}
          <div className="h-[calc(100vh-120px)] border border-gray-200 rounded-lg flex flex-col items-center justify-center">
            {isAnalyzing && taskStatus ? (
              <div className="p-8">
                <AnalysisProgress status={taskStatus} />
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                <p className="mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                >
                  重试
                </Button>
              </div>
            ) : mindMapData ? (
              <div className="h-full w-full">
                <EnhancedMindMapWithProvider data={mindMapData} />
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div>此区域为脑图全部区域</div>
                <div className="mt-2">点击"开始分析"按钮生成脑图</div>
              </div>
            )}
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