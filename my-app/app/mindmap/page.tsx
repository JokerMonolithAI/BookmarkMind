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
import { Footer } from '@/components/ui/footer';

// 删除旧的炫酷按钮样式
const glowingButtonStyles = {
  button: `
    relative overflow-hidden 
    bg-gradient-to-r from-blue-500 to-indigo-600
    hover:from-blue-600 hover:to-indigo-700
    text-white font-medium py-2 px-4 
    rounded-lg shadow-lg
    transform hover:scale-102 active:scale-98
    transition-all duration-300 ease-out
    border border-blue-400/30
  `,
  
  glow: `
    absolute inset-0
    bg-gradient-to-r from-blue-400/20 to-indigo-400/20
    opacity-70 
  `,
  
  shine: `
    absolute top-0 left-0 w-full h-full
    bg-gradient-to-r from-transparent via-white/10 to-transparent
    skew-x-[-20deg] translate-x-[-100%]
    animate-shimmer
  `,
  
  icon: `
    mr-2 h-5 w-5 
    text-white/90
  `,
  
  text: `
    relative z-10 
    font-medium text-white
    tracking-wide
  `
};

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
        const categoryList = await getUserBookmarkCategories(user.id);
        
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
      await updateBookmarkCategory(user.id, originalCategoryName, categoryName);
      
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
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <div className="flex flex-1">
        {/* 侧边栏 */}
        <Sidebar />
        
        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* 顶部导航栏 */}
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
          
          {/* 脑图内容 */}
          <div className="flex-1 overflow-auto">
            {/* 分类选择器和脑图区域容器 */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 h-full">
              {/* 分类选择器 - 移动屏幕上隐藏，或者使用不同的布局，可以通过按钮展开 */}
              <div className={`${showControls ? 'md:block' : 'hidden'} md:col-span-1 p-3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto`}>
                <div className="flex flex-col space-y-1">
                  <div className="font-medium mb-2 flex justify-between items-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">分类</span>
                    <button 
                      className="text-gray-400 hover:text-blue-500 text-xs"
                      onClick={toggleControls}
                    >
                      隐藏
                    </button>
                  </div>
                  
                  {isLoadingCategories ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {categories.map(category => (
                        <div key={category.id} className="flex items-center">
                          {editingCategory === category.id ? (
                            <div className="flex items-center w-full">
                              <input 
                                type="text"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                className="p-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md w-full" 
                                autoFocus
                              />
                              <button 
                                onClick={handleSaveEdit}
                                disabled={isSavingCategory || !categoryName.trim()}
                                className="ml-1 text-xs text-green-600 dark:text-green-500 hover:text-green-800 disabled:text-gray-400"
                              >
                                {isSavingCategory ? '...' : '保存'}
                              </button>
                              <button 
                                onClick={handleCancelEdit}
                                className="ml-1 text-xs text-red-600 dark:text-red-500 hover:text-red-800"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleCategoryClick(category.id)}
                                className={`py-1 px-2 text-sm rounded-md flex-grow text-left ${
                                  selectedCategory === category.id
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-medium'
                                    : 'text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                              >
                                <span 
                                  className="inline-block w-2 h-2 rounded-full mr-2"
                                  style={{ backgroundColor: getCategoryColor(category.id) }}
                                ></span>
                                {category.name}
                              </button>
                              
                              {category.id !== 'all' && (
                                <button
                                  onClick={() => handleEditClick(category)}
                                  className="ml-1 text-xs text-gray-400 hover:text-blue-500"
                                >
                                  编辑
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                      
                      {categoryError && (
                        <div className="text-red-500 text-xs mt-2 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {categoryError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <Button
                    onClick={handleAnalyzeClick}
                    disabled={isAnalyzing || !user}
                    className="bg-blue-500 hover:bg-blue-600 text-white w-full flex items-center justify-center"
                    size="sm"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    {isAnalyzing ? '分析中...' : '重新分析'}
                  </Button>
                </div>
              </div>
              
              {/* 脑图区域 */}
              <div 
                className={`
                  relative
                  md:col-span-${showControls ? '5' : '6'}
                  flex-1 
                  overflow-hidden
                  bg-white 
                  dark:bg-gray-900
                `}
              >
                {/* 在小屏幕上显示的控制按钮 */}
                <div className="md:hidden absolute top-2 left-2 z-20">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleControls}
                    className="bg-white/90 dark:bg-gray-800/90"
                  >
                    {showControls ? '隐藏侧栏' : '显示侧栏'}
                  </Button>
                </div>
                
                {/* 在小屏幕上，如果控制面板可见，显示浮动控制面板 */}
                {showControls && (
                  <div className="md:hidden fixed inset-0 bg-black/20 z-40" onClick={toggleControls}>
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-lg p-3 overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col space-y-1">
                        <div className="font-medium mb-2 flex justify-between items-center">
                          <span className="text-sm text-gray-700 dark:text-gray-300">分类</span>
                          <button 
                            className="text-gray-400 hover:text-blue-500 text-xs"
                            onClick={toggleControls}
                          >
                            关闭
                          </button>
                        </div>
                        
                        {isLoadingCategories ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {categories.map(category => (
                              <div key={category.id} className="flex items-center">
                                {editingCategory === category.id ? (
                                  <div className="flex items-center w-full">
                                    <input 
                                      type="text"
                                      value={categoryName}
                                      onChange={(e) => setCategoryName(e.target.value)}
                                      className="p-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md w-full" 
                                      autoFocus
                                    />
                                    <button 
                                      onClick={handleSaveEdit}
                                      disabled={isSavingCategory || !categoryName.trim()}
                                      className="ml-1 text-xs text-green-600 dark:text-green-500 hover:text-green-800 disabled:text-gray-400"
                                    >
                                      {isSavingCategory ? '...' : '保存'}
                                    </button>
                                    <button 
                                      onClick={handleCancelEdit}
                                      className="ml-1 text-xs text-red-600 dark:text-red-500 hover:text-red-800"
                                    >
                                      取消
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        handleCategoryClick(category.id);
                                        toggleControls(); // 在移动端点击分类后关闭侧栏
                                      }}
                                      className={`py-1 px-2 text-sm rounded-md flex-grow text-left ${
                                        selectedCategory === category.id
                                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-medium'
                                          : 'text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                      }`}
                                    >
                                      <span 
                                        className="inline-block w-2 h-2 rounded-full mr-2"
                                        style={{ backgroundColor: getCategoryColor(category.id) }}
                                      ></span>
                                      {category.name}
                                    </button>
                                    
                                    {category.id !== 'all' && (
                                      <button
                                        onClick={() => handleEditClick(category)}
                                        className="ml-1 text-xs text-gray-400 hover:text-blue-500"
                                      >
                                        编辑
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <Button
                            onClick={() => {
                              handleAnalyzeClick();
                              toggleControls(); // 在移动端点击分析后关闭侧栏
                            }}
                            disabled={isAnalyzing || !user}
                            className="bg-blue-500 hover:bg-blue-600 text-white w-full flex items-center justify-center"
                            size="sm"
                          >
                            <Zap className="mr-2 h-4 w-4" />
                            {isAnalyzing ? '分析中...' : '重新分析'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 脑图组件 */}
                <div className="h-full w-full p-0 md:p-4 relative flex items-center justify-center">
                  {isAnalyzing && taskStatus && (
                    <AnalysisProgress
                      status={taskStatus}
                      onRetry={handleRetry}
                    />
                  )}
                  
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-md mx-auto">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                            加载脑图失败
                          </h3>
                          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                            <p>{error}</p>
                          </div>
                          <div className="mt-4">
                            <Button
                              size="sm"
                              onClick={handleRetry}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              重试
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!error && !isAnalyzing && markdownData && <MarkMap markdown={markdownData} />}
                  
                  {!error && !isAnalyzing && !markdownData && !taskStatus && (
                    <div className="text-center p-8">
                      <div className="rounded-full bg-blue-50 dark:bg-blue-900/20 p-3 mx-auto w-12 h-12 flex items-center justify-center mb-4">
                        <Zap className="h-6 w-6 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        分析您的书签
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        点击"重新分析"按钮，我们将分析您的书签并生成思维导图，帮助您更好地理解和管理您的收藏内容。
                      </p>
                      <div className="mt-4">
                        <Button
                          onClick={handleAnalyzeClick}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <Zap className="mr-2 h-4 w-4" />
                          开始分析
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// 主 MindMap 页面组件
export default function MindMapPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
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

  // 使用 ViewProvider 包装内容
  return (
    <ViewProvider>
      <MindMapContent />
    </ViewProvider>
  );
} 