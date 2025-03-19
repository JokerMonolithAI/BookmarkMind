'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { ViewProvider, useView } from '@/components/dashboard/ViewToggle';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import ImportButton from '@/components/dashboard/ImportButton';
import MarkMap from '@/components/mindmap/MarkMap';
import AnalysisProgress from '@/components/mindmap/AnalysisProgress';
import { TaskStatus } from '@/types/mindmap';
import { getUserBookmarkCategories, updateBookmarkCategory } from '@/lib/bookmarkService';
import { apiService } from '@/lib/apiService';

// 脑图内容组件
function MindMapContent() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [originalCategoryName, setOriginalCategoryName] = useState('');
  const { activeView } = useView();
  const { user } = useAuth();
  
  // 分类数据状态
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([
    { id: 'all', name: '我的脑图' } // 默认固定的第一个分类
  ]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  
  // 分析状态
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [markdownData, setMarkdownData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 脑图控制
  const [showControls, setShowControls] = useState(true);

  // 加载分类数据
  useEffect(() => {
    async function loadCategories() {
      if (!user) return;
      
      setIsLoadingCategories(true);
      setCategoryError(null);
      
      try {
        // 获取用户的所有书签分类
        const categoryList = await getUserBookmarkCategories(user.uid);
        
        // 将分类数据转换为组件所需的格式
        const formattedCategories = categoryList.map((category, index) => ({
          id: `cat${index + 1}`, // 生成唯一ID
          name: category
        }));
        
        // 合并固定的"我的脑图"分类和从数据库获取的分类
        setCategories([
          { id: 'all', name: '我的脑图' },
          ...formattedCategories
        ]);
      } catch (err) {
        console.error('加载分类失败:', err);
        setCategoryError(err instanceof Error ? err.message : '加载分类失败，请刷新页面重试');
      } finally {
        setIsLoadingCategories(false);
      }
    }
    
    loadCategories();
  }, [user]);
  
  // 加载分类的脑图数据
  const loadCategoryMarkdown = useCallback(async (categoryId: string) => {
    if (!user) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // 获取当前选择的分类名称
      const categoryName = categoryId === 'all' 
        ? '我的脑图' // 使用"我的脑图"作为默认分类名称
        : categories.find(c => c.id === categoryId)?.name || '我的脑图';
      
      console.log(`加载分类脑图: ${categoryName}`);
      
      // 调用API获取markdown数据
      const response = await apiService.getBookmarksMarkdown(categoryName);
      
      if (response.markdown) {
        // 直接显示markdown数据
        console.log('获取到markdown数据');
        // 使用requestAnimationFrame确保DOM已更新
        requestAnimationFrame(() => {
          setMarkdownData(response.markdown || null);
        });
      } else {
        throw new Error('获取脑图数据失败');
      }
    } catch (err) {
      console.error('加载分类脑图失败:', err);
      setError(err instanceof Error ? err.message : '加载分类脑图失败，请稍后重试');
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, categories]);

  // 在分类数据加载完成后自动加载默认分类的脑图数据
  useEffect(() => {
    // 确保分类数据已加载完成且不在加载状态
    if (!isLoadingCategories && categories.length > 0 && user && !markdownData && !isAnalyzing) {
      // 加载默认选中分类的脑图数据
      loadCategoryMarkdown(selectedCategory);
    }
  }, [isLoadingCategories, categories, user, selectedCategory, loadCategoryMarkdown, markdownData, isAnalyzing]);

  // 处理分类点击
  const handleCategoryClick = async (categoryId: string) => {
    // 如果已经选中该分类，则不重复加载
    if (selectedCategory === categoryId) return;
    
    setSelectedCategory(categoryId);
    // 切换分类时重置脑图数据
    setMarkdownData(null);
    setTaskStatus(null);
    setTaskId(null);
    setPollCount(0);
    setError(null);
    
    // 自动加载对应分类的脑图数据
    await loadCategoryMarkdown(categoryId);
  };
  
  // 处理分类编辑
  const handleEditClick = (category: { id: string; name: string }) => {
    setEditingCategory(category.id);
    setCategoryName(category.name);
    setOriginalCategoryName(category.name);
  };

  // 处理编辑保存
  const handleSaveEdit = async () => {
    if (!user || !editingCategory) return;
    
    // 如果分类名称没有变化，直接关闭编辑模式
    if (categoryName === originalCategoryName) {
      setEditingCategory(null);
      return;
    }
    
    setIsSavingCategory(true);
    setCategoryError(null);
    
    try {
      // 更新数据库中的分类
      await updateBookmarkCategory(user.uid, originalCategoryName, categoryName);
      
      // 更新本地分类列表
      setCategories(prevCategories => 
        prevCategories.map(cat => 
          cat.id === editingCategory ? { ...cat, name: categoryName } : cat
        )
      );
      
      // 如果当前选中的是被编辑的分类，更新选中状态
      if (selectedCategory === editingCategory) {
        // 重置脑图数据，以便使用新的分类名称重新加载
        setMarkdownData(null);
        setTaskStatus(null);
        setTaskId(null);
        setPollCount(0);
        setError(null);
      }
      
      // 关闭编辑模式
      setEditingCategory(null);
    } catch (err) {
      console.error('保存分类失败:', err);
      setCategoryError(err instanceof Error ? err.message : '保存分类失败，请重试');
    } finally {
      setIsSavingCategory(false);
    }
  };
  
  // 取消编辑
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setCategoryName('');
    setOriginalCategoryName('');
  };
  
  // 处理分析按钮点击
  const handleAnalyzeClick = async () => {
    if (!user) return;
    
    setIsAnalyzing(true);
    setError(null);
    setMarkdownData(null);
    setTaskStatus(null);
    setTaskId(null);
    setPollCount(0);
    
    try {
      // 获取当前选择的分类名称
      const categoryName = selectedCategory === 'all' 
        ? '我的脑图' // 使用"我的脑图"作为默认分类名称
        : categories.find(c => c.id === selectedCategory)?.name || '我的脑图';
      
      console.log(`开始分析分类: ${categoryName}`);
      
      // 使用真实API启动分析任务
      const response = await apiService.analyzeBookmarks(categoryName);
      
      if (response.taskId) {
        setTaskId(response.taskId);
        // 创建初始任务状态
        const initialStatus: TaskStatus = {
          taskId: response.taskId,
          status: 'processing',
          progress: 10,
          stage: 'initializing'
        };
        setTaskStatus(initialStatus);
        
        // 开始轮询任务状态
        pollTaskStatus(response.taskId);
      } else if (response.markdown) {
        // 如果直接返回Markdown结果，无需轮询
        console.log('直接获取到分析结果:', response.markdown);
        // 使用requestAnimationFrame确保DOM已更新
        requestAnimationFrame(() => {
          setMarkdownData(response.markdown || null);
          setIsAnalyzing(false);
        });
      } else {
        throw new Error('分析任务启动失败');
      }
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
            const status = await apiService.getTaskStatus(taskId);
            setTaskStatus(status);
            
            // 根据状态决定下一步操作
            if (status.status === 'completed') {
              // 任务完成，获取结果
              console.log('任务完成，获取分析结果');
              const result = await apiService.getAnalysisResult(taskId);
              console.log('获取到分析结果:', result);
              
              // 确保结果格式正确
              if (result && result.markdown) {
                // 使用requestAnimationFrame确保DOM已更新
                requestAnimationFrame(() => {
                  setMarkdownData(result.markdown || null);
                  setIsAnalyzing(false);
                });
              } else {
                console.error('分析结果格式不正确:', result);
                setError('分析结果格式不正确，请重试');
                setIsAnalyzing(false);
              }
            } else if (status.status === 'failed') {
              // 任务失败
              console.error('分析任务失败:', status.error);
              setError(status.error || '分析失败，请稍后重试');
              setIsAnalyzing(false);
            } else if (status.status === 'processing') {
              // 任务处理中，继续轮询
              console.log(`任务处理中，进度: ${status.progress}%, 阶段: ${status.stage}`);
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

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 获取分类的随机颜色
  const getCategoryColor = (categoryId: string) => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-green-500 to-teal-600',
      'from-purple-500 to-pink-600',
      'from-yellow-500 to-orange-600',
      'from-red-500 to-pink-600',
      'from-indigo-500 to-purple-600',
    ];
    
    // 使用分类ID的哈希值来确定颜色，确保同一分类始终使用相同的颜色
    const hashCode = categoryId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hashCode % colors.length];
  };

  // 切换控制面板显示
  const toggleControls = () => {
    setShowControls(!showControls);
  };

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
              <ImportButton />
              <Button 
                onClick={handleAnalyzeClick} 
                disabled={isAnalyzing}
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 dark:bg-blue-700 dark:hover:bg-blue-800 hover:scale-105"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4 animate-pulse" />
                    AI智能分析
                  </>
                )}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* Main Content - 改为单列布局，顶部是标签页 */}
        <div className="flex-1 flex flex-col">
          {/* 顶部标签页导航 */}
          <div className="sticky top-[57px] z-20 bg-white dark:bg-gray-900 px-4 md:px-6 mt-4">
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
              {isLoadingCategories ? (
                <div className="py-3 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                  <span className="text-sm text-gray-500">加载分类...</span>
                </div>
              ) : categoryError ? (
                <div className="text-red-500 text-sm py-3">
                  {categoryError}
                </div>
              ) : (
                <div className="flex items-center overflow-x-auto scrollbar-hide">
                  {categories.map((category) => (
                    <div key={category.id} className="relative">
                      {editingCategory === category.id ? (
                        <div className="flex items-center bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-md p-1 m-2">
                          <input
                            type="text"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="w-full max-w-[120px] text-sm bg-transparent border-none outline-none focus:ring-0 text-gray-900 dark:text-gray-100"
                            autoFocus
                          />
                          <div className="flex">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSaveEdit}
                              disabled={isSavingCategory}
                              className="h-5 w-5 p-0 ml-1"
                              title="保存"
                            >
                              {isSavingCategory ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "✓"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              disabled={isSavingCategory}
                              className="h-5 w-5 p-0"
                              title="取消"
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCategoryClick(category.id)}
                          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                            selectedCategory === category.id
                              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
                        >
                          <span className="font-medium">{category.name}</span>
                          
                          {/* 只对非"我的脑图"显示编辑按钮 */}
                          {category.id !== 'all' && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(category);
                              }}
                              className="h-5 w-5 p-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                              title="编辑分类名称"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                <path d="m15 5 4 4"/>
                              </svg>
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* 脑图内容区域 */}
          <div className="flex-1 overflow-hidden relative">
            <Suspense fallback={
              <div className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            }>
              <div className="w-full h-[calc(100vh-110px)] relative">
                {/* 分析状态显示 */}
                {isAnalyzing && taskStatus && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-96 max-w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
                    <AnalysisProgress status={taskStatus} />
                  </div>
                )}
                
                {/* 错误信息显示 */}
                {error && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-96 max-w-full">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center text-red-700 dark:text-red-300 p-4">
                      <AlertCircle className="mr-2 h-5 w-5" />
                      <span>{error}</span>
                      <Button variant="outline" size="sm" className="ml-auto" onClick={handleRetry}>
                        重试
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* 脑图显示区域 - 占据整个空间 */}
                <div className="w-full h-full bg-white dark:bg-gray-900 p-4">
                  {markdownData ? (
                    <div className="w-full h-full">
                      <MarkMap markdown={markdownData} />
                    </div>
                  ) : isAnalyzing ? (
                    <div className="flex items-center justify-center h-full flex-col">
                      <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">加载脑图中...</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full flex-col">
                      <p className="text-gray-500 dark:text-gray-400 mb-2">
                        {error ? '加载失败，请重试或选择其他分类' : '请选择分类或点击"AI智能分析"'}
                      </p>
                      {error && (
                        <Button 
                          onClick={() => loadCategoryMarkdown(selectedCategory)} 
                          variant="outline"
                          size="sm"
                        >
                          重新加载
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Suspense>
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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">加载中...</p>
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