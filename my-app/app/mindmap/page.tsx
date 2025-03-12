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
import { apiService } from '@/lib/apiService';
import SimpleMindMap from '@/components/mindmap/SimpleMindMap';
import EnhancedMindMapWithProvider from '@/components/mindmap/EnhancedMindMap';
import AnalysisProgress from '@/components/mindmap/AnalysisProgress';
import { TaskStatus, MindMapData, MindMapNode, MindMapEdge } from '@/types/mindmap';

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
      // 获取当前选择的分类名称
      const categoryName = selectedCategory === 'all' 
        ? '书签脑图' // 使用"书签脑图"作为默认分类名称，与后端匹配
        : tempCategories.find(c => c.id === selectedCategory)?.name || '书签脑图';
      
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
      } else if (response.results) {
        // 如果直接返回结果，无需轮询
        console.log('直接获取到分析结果:', response.results);
        const transformedData = transformApiResponseToMindMapData(response);
        setMindMapData(transformedData);
        setIsAnalyzing(false);
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
              if (result && (result.results || result.data)) {
                const dataToTransform = {
                  success: true,
                  results: result.results || result.data || {}
                };
                const transformedData = transformApiResponseToMindMapData(dataToTransform);
                setMindMapData(transformedData);
              } else {
                console.error('分析结果格式不正确:', result);
                setError('分析结果格式不正确，请重试');
              }
              setIsAnalyzing(false);
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
  
  // 将API响应转换为MindMapData格式
  const transformApiResponseToMindMapData = (apiResponse: any): MindMapData => {
    const nodes: MindMapNode[] = [];
    const edges: MindMapEdge[] = [];
    
    // 创建中心节点
    const centerNodeId = 'center';
    nodes.push({
      id: centerNodeId,
      type: 'centerNode',
      data: {
        label: '我的脑图',
      },
      position: { x: 0, y: 0 }
    });
    
    // 获取主要分类数据
    // 查找主要分类键（可能是"书签脑图"或"我的脑图"等）
    const mainCategoryKey = Object.keys(apiResponse.results || {})[0] || '';
    if (!mainCategoryKey) return { nodes, edges };
    
    // 处理主要分类数据
    const categoryData = apiResponse.results[mainCategoryKey] || [];
    
    // 过滤掉详情数据（通常是以_details结尾的键）
    const mainCategories = categoryData.filter((item: any) => {
      const key = Object.keys(item)[0] || '';
      return !key.endsWith('_details') && !key.startsWith('file_');
    });
    
    // 处理主要分类
    mainCategories.forEach((categoryItem: any, categoryIndex: number) => {
      // 获取分类名称（对象的第一个键）
      const categoryName = Object.keys(categoryItem)[0];
      
      if (!categoryName) return;
      
      // 计算分支节点的角度和距离
      const angle = (2 * Math.PI * categoryIndex) / mainCategories.length;
      const branchDistance = 200;
      
      // 创建分支节点
      const branchNodeId = `branch-${categoryIndex}`;
      nodes.push({
        id: branchNodeId,
        type: 'branchNode',
        data: {
          label: categoryName,
          branchIndex: categoryIndex
        },
        position: { 
          x: Math.cos(angle) * branchDistance, 
          y: Math.sin(angle) * branchDistance 
        }
      });
      
      // 连接中心节点和分支节点
      edges.push({
        id: `edge-center-to-${branchNodeId}`,
        source: centerNodeId,
        target: branchNodeId,
        type: 'branchEdge',
        data: {
          branchIndex: categoryIndex
        }
      });
      
      // 处理主题
      const topics = categoryItem[categoryName] || [];
      topics.forEach((topicItem: any, topicIndex: number) => {
        // 获取主题名称（对象的第一个键）
        const topicName = Object.keys(topicItem)[0];
        
        if (!topicName) return;
        
        // 主题数据
        const topicData = topicItem[topicName];
        
        // 计算主题节点的位置
        const topicDistance = 400;
        const topicX = Math.cos(angle) * topicDistance + (topicIndex % 2) * 50;
        const topicY = Math.sin(angle) * topicDistance + Math.floor(topicIndex / 2) * 100;
        
        // 创建主题节点
        const topicNodeId = `topic-${categoryIndex}-${topicIndex}`;
        nodes.push({
          id: topicNodeId,
          type: 'topicNode',
          data: {
            label: topicName,
            branchIndex: categoryIndex
          },
          position: { x: topicX, y: topicY }
        });
        
        // 连接分支节点和主题节点
        edges.push({
          id: `edge-${branchNodeId}-to-${topicNodeId}`,
          source: branchNodeId,
          target: topicNodeId,
          type: 'topicEdge',
          data: {
            branchIndex: categoryIndex
          }
        });
        
        // 计算详情节点的基础位置
        const detailDistance = 600;
        const detailBaseX = Math.cos(angle) * detailDistance + (topicIndex % 2) * 50;
        const detailBaseY = Math.sin(angle) * detailDistance + Math.floor(topicIndex / 2) * 400; // 大幅增加垂直间距
        
        // 创建URL节点（第一个详情节点）
        const urlNodeId = `url-${categoryIndex}-${topicIndex}`;
        nodes.push({
          id: urlNodeId,
          type: 'detailNode',
          data: {
            label: 'URL',
            url: topicData.url,
            content: topicData.url,
            branchIndex: categoryIndex,
            parentId: topicNodeId,
            isStructured: true,
            structureType: 'url'
          },
          position: { x: detailBaseX, y: detailBaseY - 200 } // 上方
        });
        
        // 连接主题节点和URL节点
        edges.push({
          id: `edge-${topicNodeId}-to-${urlNodeId}`,
          source: topicNodeId,
          target: urlNodeId,
          type: 'detailEdge',
          data: { branchIndex: categoryIndex }
        });
        
        // 创建标题节点（第二个详情节点）
        const titleNodeId = `title-${categoryIndex}-${topicIndex}`;
        nodes.push({
          id: titleNodeId,
          type: 'detailNode',
          data: {
            label: '标题',
            content: topicData.title || topicName,
            branchIndex: categoryIndex,
            parentId: topicNodeId,
            isStructured: true,
            structureType: 'title'
          },
          position: { x: detailBaseX, y: detailBaseY } // 中间
        });
        
        // 连接主题节点和标题节点
        edges.push({
          id: `edge-${topicNodeId}-to-${titleNodeId}`,
          source: topicNodeId,
          target: titleNodeId,
          type: 'detailEdge',
          data: { branchIndex: categoryIndex }
        });
        
        // 创建摘要节点（第三个详情节点）
        const summaryNodeId = `summary-${categoryIndex}-${topicIndex}`;
        nodes.push({
          id: summaryNodeId,
          type: 'detailNode',
          data: {
            label: '摘要',
            content: topicData.summary || '无摘要',
            branchIndex: categoryIndex,
            parentId: topicNodeId,
            isStructured: true,
            structureType: 'summary'
          },
          position: { x: detailBaseX, y: detailBaseY + 200 } // 下方
        });
        
        // 连接主题节点和摘要节点
        edges.push({
          id: `edge-${topicNodeId}-to-${summaryNodeId}`,
          source: topicNodeId,
          target: summaryNodeId,
          type: 'detailEdge',
          data: { branchIndex: categoryIndex }
        });
        
        // 如果有文件属性，创建文件节点
        if (topicData.file) {
          const fileNodeId = `file-${categoryIndex}-${topicIndex}`;
          let fileContent = '无文件内容';
          
          if (apiResponse.results[topicData.file]) {
            try {
              fileContent = JSON.stringify(apiResponse.results[topicData.file], null, 2);
            } catch (e) {
              console.error('无法解析文件内容:', e);
            }
          }
          
          nodes.push({
            id: fileNodeId,
            type: 'fileNode',
            data: {
              label: '文件内容',
              content: fileContent,
              branchIndex: categoryIndex,
              parentId: topicNodeId,
              file: topicData.file
            },
            position: { x: detailBaseX, y: detailBaseY + 400 } // 最下方
          });
          
          // 连接主题节点和文件节点
          edges.push({
            id: `edge-${topicNodeId}-to-${fileNodeId}`,
            source: topicNodeId,
            target: fileNodeId,
            type: 'detailEdge',
            data: { branchIndex: categoryIndex }
          });
          
          // 处理详细信息数据
          if (apiResponse.results[topicData.file]) {
            const detailsData = apiResponse.results[topicData.file] || [];
            detailsData.forEach((detailCategory: any, detailCatIndex: number) => {
              const detailCatName = Object.keys(detailCategory)[0];
              if (!detailCatName) return;
              
              // 计算详细分类节点的位置
              const detailCatDistance = 800;
              const detailCatX = Math.cos(angle) * detailCatDistance + (detailCatIndex % 2) * 50;
              const detailCatY = Math.sin(angle) * detailCatDistance + topicIndex * 100 + detailCatIndex * 50;
              
              // 创建详细分类节点
              const detailCatNodeId = `detail-cat-${categoryIndex}-${topicIndex}-${detailCatIndex}`;
              nodes.push({
                id: detailCatNodeId,
                type: 'topicNode',
                data: {
                  label: detailCatName,
                  branchIndex: categoryIndex,
                  parentId: topicNodeId
                },
                position: { x: detailCatX, y: detailCatY }
              });
              
              // 连接主题节点和详细分类节点
              edges.push({
                id: `edge-${topicNodeId}-to-${detailCatNodeId}`,
                source: topicNodeId,
                target: detailCatNodeId,
                type: 'detailEdge',
                data: { branchIndex: categoryIndex }
              });
              
              // 处理详细主题
              const detailTopics = detailCategory[detailCatName] || [];
              detailTopics.forEach((detailTopic: any, detailTopicIndex: number) => {
                const detailTopicName = Object.keys(detailTopic)[0];
                if (!detailTopicName) return;
                
                const detailTopicData = detailTopic[detailTopicName];
                
                // 计算详细主题节点的基础位置
                const detailTopicDistance = 1000;
                const detailTopicBaseX = Math.cos(angle) * detailTopicDistance + (detailTopicIndex % 2) * 50;
                const detailTopicBaseY = Math.sin(angle) * detailTopicDistance + topicIndex * 100 + detailCatIndex * 50 + detailTopicIndex * 600; // 大幅增加垂直间距
                
                // 创建URL节点
                const detailUrlNodeId = `detail-url-${categoryIndex}-${topicIndex}-${detailCatIndex}-${detailTopicIndex}`;
                nodes.push({
                  id: detailUrlNodeId,
                  type: 'detailNode',
                  data: {
                    label: 'URL',
                    url: detailTopicData.url,
                    content: detailTopicData.url,
                    branchIndex: categoryIndex,
                    parentId: detailCatNodeId,
                    isStructured: true,
                    structureType: 'url'
                  },
                  position: { x: detailTopicBaseX, y: detailTopicBaseY - 200 } // 上方
                });
                
                // 连接详细分类节点和URL节点
                edges.push({
                  id: `edge-${detailCatNodeId}-to-${detailUrlNodeId}`,
                  source: detailCatNodeId,
                  target: detailUrlNodeId,
                  type: 'detailEdge',
                  data: { branchIndex: categoryIndex }
                });
                
                // 创建标题节点
                const detailTitleNodeId = `detail-title-${categoryIndex}-${topicIndex}-${detailCatIndex}-${detailTopicIndex}`;
                nodes.push({
                  id: detailTitleNodeId,
                  type: 'detailNode',
                  data: {
                    label: '标题',
                    content: detailTopicData.title || detailTopicName,
                    branchIndex: categoryIndex,
                    parentId: detailCatNodeId,
                    isStructured: true,
                    structureType: 'title'
                  },
                  position: { x: detailTopicBaseX, y: detailTopicBaseY } // 中间
                });
                
                // 连接详细分类节点和标题节点
                edges.push({
                  id: `edge-${detailCatNodeId}-to-${detailTitleNodeId}`,
                  source: detailCatNodeId,
                  target: detailTitleNodeId,
                  type: 'detailEdge',
                  data: { branchIndex: categoryIndex }
                });
                
                // 创建摘要节点
                const detailSummaryNodeId = `detail-summary-${categoryIndex}-${topicIndex}-${detailCatIndex}-${detailTopicIndex}`;
                nodes.push({
                  id: detailSummaryNodeId,
                  type: 'detailNode',
                  data: {
                    label: '摘要',
                    content: detailTopicData.summary || '无摘要',
                    branchIndex: categoryIndex,
                    parentId: detailCatNodeId,
                    isStructured: true,
                    structureType: 'summary'
                  },
                  position: { x: detailTopicBaseX, y: detailTopicBaseY + 200 } // 下方
                });
                
                // 连接详细分类节点和摘要节点
                edges.push({
                  id: `edge-${detailCatNodeId}-to-${detailSummaryNodeId}`,
                  source: detailCatNodeId,
                  target: detailSummaryNodeId,
                  type: 'detailEdge',
                  data: { branchIndex: categoryIndex }
                });
                
                // 如果有文件属性，创建文件节点
                if (detailTopicData.file) {
                  const detailFileNodeId = `detail-file-${categoryIndex}-${topicIndex}-${detailCatIndex}-${detailTopicIndex}`;
                  let detailFileContent = '无文件内容';
                  
                  if (apiResponse.results[detailTopicData.file]) {
                    try {
                      detailFileContent = JSON.stringify(apiResponse.results[detailTopicData.file], null, 2);
                    } catch (e) {
                      console.error('无法解析文件内容:', e);
                    }
                  }
                  
                  nodes.push({
                    id: detailFileNodeId,
                    type: 'fileNode',
                    data: {
                      label: '文件内容',
                      content: detailFileContent,
                      branchIndex: categoryIndex,
                      parentId: detailCatNodeId,
                      file: detailTopicData.file
                    },
                    position: { x: detailTopicBaseX, y: detailTopicBaseY + 400 } // 最下方
                  });
                  
                  // 连接详细分类节点和文件节点
                  edges.push({
                    id: `edge-${detailCatNodeId}-to-${detailFileNodeId}`,
                    source: detailCatNodeId,
                    target: detailFileNodeId,
                    type: 'detailEdge',
                    data: { branchIndex: categoryIndex }
                  });
                }
              });
            });
          }
        }
      });
    });
    
    return { nodes, edges };
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