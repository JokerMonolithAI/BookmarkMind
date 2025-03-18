'use client'

import { useState, useEffect, useCallback } from 'react';
import { FileText, ExternalLink, Trash, Loader2 } from 'lucide-react';
import { eventService, EVENTS } from '@/lib/eventService';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { ref, get, remove } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useView } from '@/components/bookmarks/ViewToggle';
import { Tag, getBookmarkTags } from '@/lib/tagService';
import { getBookmarkCollections } from '@/lib/collectionService';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// 定义书签接口
interface Bookmark {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  createdAt: number;
  addedAt: number;
  tags?: string[];
  pdfFiles?: {
    [key: string]: {
      url: string;
      name: string;
      addedAt: number;
      storagePath?: string;
    }
  };
}

// 添加书签元数据接口
interface BookmarkMetadata {
  tags: Tag[];
  collections: {
    id: string;
    name: string;
  }[];
}

interface BookmarkListProps {
  searchQuery?: string;
  sortOption?: 'date' | 'title';
  timeRange?: 'all' | 'today' | 'week' | 'month';
}

export default function BookmarkList({
  searchQuery = '',
  sortOption = 'date',
  timeRange = 'all'
}: BookmarkListProps) {
  const { user } = useAuth();
  const { activeView } = useView();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkToDelete, setBookmarkToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  // 添加标签和收藏集的状态
  const [bookmarkMetadata, setBookmarkMetadata] = useState<{[key: string]: BookmarkMetadata}>({});
  const [loadingMetadata, setLoadingMetadata] = useState<{[key: string]: boolean}>({});

  // 获取书签数据
  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const bookmarksRef = ref(db, `users/${user.uid}/bookmarks/bookmarks`);
      const snapshot = await get(bookmarksRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const bookmarksArray: Bookmark[] = [];
        
        // 处理数据，转换为数组
        Object.keys(data).forEach(key => {
          if (data[key].url) {
            bookmarksArray.push({
              id: key,
              ...data[key]
            });
          }
        });
        
        // 按添加时间排序，最新的在前面
        bookmarksArray.sort((a, b) => {
          const timeA = a.addedAt || a.createdAt || 0;
          const timeB = b.addedAt || b.createdAt || 0;
          return timeB - timeA;
        });
        
        setBookmarks(bookmarksArray);
      } else {
        setBookmarks([]);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast({
        title: "获取书签失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 初始加载和事件订阅
  useEffect(() => {
    if (user) {
      fetchBookmarks();
      
      // 处理书签导入成功事件
      const handleBookmarksImported = () => {
        fetchBookmarks();
      };
      
      // 订阅事件
      eventService.subscribe(EVENTS.BOOKMARKS_IMPORTED, handleBookmarksImported);
      
      // 组件卸载时取消订阅
      return () => {
        eventService.unsubscribe(EVENTS.BOOKMARKS_IMPORTED, handleBookmarksImported);
      };
    }
  }, [user, fetchBookmarks]);

  // 根据搜索、排序和时间范围过滤书签
  useEffect(() => {
    if (!bookmarks.length) {
      setFilteredBookmarks([]);
      return;
    }

    let filtered = [...bookmarks];

    // 应用搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bookmark => 
        bookmark.title?.toLowerCase().includes(query) || 
        bookmark.description?.toLowerCase().includes(query) ||
        bookmark.url?.toLowerCase().includes(query)
      );
    }

    // 应用时间范围过滤
    if (timeRange !== 'all') {
      const now = new Date();
      let startTime: Date;

      switch (timeRange) {
        case 'today':
          startTime = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          // 获取本周一
          const day = now.getDay() || 7; // 如果是周日，getDay()返回0，我们将其视为7
          startTime = new Date(now);
          startTime.setDate(now.getDate() - day + 1);
          startTime.setHours(0, 0, 0, 0);
          break;
        case 'month':
          // 获取本月第一天
          startTime = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startTime = new Date(0); // 1970年1月1日
      }

      const startTimestamp = startTime.getTime();
      filtered = filtered.filter(bookmark => {
        const bookmarkTime = bookmark.addedAt || bookmark.createdAt || 0;
        // 检查时间戳是否为秒级（10位数），如果是则转换为毫秒级（13位数）
        const normalizedTimestamp = bookmarkTime.toString().length === 10 
          ? bookmarkTime * 1000 
          : bookmarkTime;
        return normalizedTimestamp >= startTimestamp;
      });
    }

    // 应用排序
    if (sortOption === 'title') {
      filtered.sort((a, b) => {
        const titleA = a.title || '';
        const titleB = b.title || '';
        return titleA.localeCompare(titleB);
      });
    } else {
      // 默认按日期排序
      filtered.sort((a, b) => {
        const timeA = a.addedAt || a.createdAt || 0;
        const timeB = b.addedAt || b.createdAt || 0;
        return timeB - timeA;
      });
    }

    setFilteredBookmarks(filtered);
    // 重置到第一页
    setCurrentPage(1);
  }, [bookmarks, searchQuery, sortOption, timeRange]);

  // 删除书签
  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!user || isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      // 删除书签数据
      await remove(ref(db, `users/${user.uid}/bookmarks/bookmarks/${bookmarkId}`));
      
      // 更新本地状态
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
      
      toast({
        title: "书签已删除",
        description: "书签已成功删除",
      });
      
      // 发布书签删除事件
      eventService.publish(EVENTS.BOOKMARK_DELETED);
      
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast({
        title: "删除书签失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setBookmarkToDelete(null);
    }
  };

  // 分页相关函数
  const totalPages = Math.ceil(filteredBookmarks.length / itemsPerPage);
  
  const getCurrentPageBookmarks = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBookmarks.slice(startIndex, endIndex);
  };
  
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // 获取书签的标签和收藏集
  const fetchBookmarkMetadata = useCallback(async (bookmarkId: string) => {
    if (!user || loadingMetadata[bookmarkId]) return;
    
    setLoadingMetadata(prev => ({ ...prev, [bookmarkId]: true }));
    
    try {
      // 获取书签的标签
      const tags = await getBookmarkTags(user.uid, bookmarkId);
      
      // 获取书签所属的收藏集
      const collectionIds = await getBookmarkCollections(user.uid, bookmarkId);
      
      // 获取收藏集名称
      const collections: {id: string, name: string}[] = [];
      
      if (collectionIds.length > 0) {
        for (const id of collectionIds) {
          const collectionRef = ref(db, `users/${user.uid}/collections/${id}`);
          const snapshot = await get(collectionRef);
          
          if (snapshot.exists()) {
            collections.push({
              id,
              name: snapshot.val().name
            });
          }
        }
      }
      
      // 更新状态
      setBookmarkMetadata(prev => ({
        ...prev,
        [bookmarkId]: { tags, collections }
      }));
    } catch (error) {
      console.error('Error fetching bookmark metadata:', error);
      // 即使出错也更新状态，避免重复请求
      setBookmarkMetadata(prev => ({
        ...prev,
        [bookmarkId]: { tags: [], collections: [] }
      }));
    } finally {
      setLoadingMetadata(prev => ({ ...prev, [bookmarkId]: false }));
    }
  }, [user, loadingMetadata]);

  // 在 useEffect 中预加载当前页的书签元数据
  useEffect(() => {
    if (!user || !filteredBookmarks.length) return;

    const currentPageBookmarks = getCurrentPageBookmarks();
    currentPageBookmarks.forEach(bookmark => {
      if (!bookmarkMetadata[bookmark.id] && !loadingMetadata[bookmark.id]) {
        fetchBookmarkMetadata(bookmark.id);
      }
    });
  }, [user, filteredBookmarks, currentPage, bookmarkMetadata, loadingMetadata, fetchBookmarkMetadata]);

  // 格式化日期
  const formatDate = (timestamp: number) => {
    if (!timestamp) return '未知日期';
    
    // 检查时间戳是否为秒级（10位数），如果是则转换为毫秒级（13位数）
    const normalizedTimestamp = timestamp.toString().length === 10 
      ? timestamp * 1000 
      : timestamp;
    
    const date = new Date(normalizedTimestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // 添加一个函数来确定书签类型并返回对应的CSS类名
  const getBookmarkCardClass = (bookmark: Bookmark) => {
    const url = bookmark.url.toLowerCase();
    const title = (bookmark.title || '').toLowerCase();
    
    // 开发工具类 - 紫色渐变
    if (
      url.includes('github.com') || 
      url.includes('stackoverflow.com') || 
      url.includes('vscode') || 
      url.includes('code') ||
      url.includes('dev.') ||
      url.includes('translate.google') ||
      title.includes('工具') ||
      title.includes('翻译')
    ) {
      return 'card-gradient-purple';
    }
    
    // 人工智能类 - 橙色渐变
    if (
      url.includes('ai') || 
      url.includes('openai') || 
      url.includes('gpt') || 
      url.includes('claude') ||
      url.includes('llm') ||
      url.includes('feishu') ||
      title.includes('ai') ||
      title.includes('人工智能') ||
      title.includes('机器学习')
    ) {
      return 'card-gradient-orange';
    }
    
    // 开发框架类 - 绿色渐变
    if (
      url.includes('react') || 
      url.includes('vue') || 
      url.includes('angular') || 
      url.includes('next') ||
      url.includes('framework') ||
      url.includes('platform') ||
      url.includes('kancloud') ||
      title.includes('框架') ||
      title.includes('platform')
    ) {
      return 'card-gradient-green';
    }
    
    // 默认返回空字符串，使用默认样式
    return '';
  };

  // 渲染标签
  const renderTags = (bookmarkId: string) => {
    const metadata = bookmarkMetadata[bookmarkId];
    
    if (!metadata || metadata.tags.length === 0) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {metadata.tags.slice(0, 3).map(tag => (
          <Badge 
            key={tag.id}
            style={{ 
              backgroundColor: tag.bgColor,
              color: tag.textColor
            }}
            className="text-xs px-1.5 py-0.5 h-4"
          >
            {tag.name}
          </Badge>
        ))}
        {metadata.tags.length > 3 && (
          <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-4">
            +{metadata.tags.length - 3}
          </Badge>
        )}
      </div>
    );
  };
  
  // 渲染收藏集
  const renderCollections = (bookmarkId: string) => {
    const metadata = bookmarkMetadata[bookmarkId];
    
    if (!metadata || metadata.collections.length === 0) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {metadata.collections.slice(0, 2).map(collection => (
          <Badge 
            key={collection.id}
            variant="secondary"
            className="text-xs px-1.5 py-0.5 h-4"
          >
            {collection.name}
          </Badge>
        ))}
        {metadata.collections.length > 2 && (
          <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-4">
            +{metadata.collections.length - 2}
          </Badge>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // 渲染书签列表
  const renderBookmarks = () => {
    if (filteredBookmarks.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {bookmarks.length === 0 ? '还没有书签' : '没有找到匹配的书签'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {bookmarks.length === 0 
              ? '导入或添加您的第一个书签开始使用' 
              : '尝试使用不同的搜索条件'}
          </p>
        </div>
      );
    }

    const currentPageBookmarks = getCurrentPageBookmarks();

    return (
      <div className={`grid grid-cols-1 ${activeView === 'grid' ? 'md:grid-cols-3 lg:grid-cols-4' : ''} gap-4`}>
        {currentPageBookmarks.map(bookmark => {
          const cardClass = getBookmarkCardClass(bookmark);
          const hasGradient = cardClass !== '';
          
          if (activeView === 'list') {
            // 列表视图 - 优化为左侧彩色背景
            return (
              <div 
                key={bookmark.id}
                className="rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 flex"
              >
                {/* 左侧彩色背景区域 */}
                <div className={`${hasGradient ? cardClass : 'bg-gray-100 dark:bg-gray-700'} w-2 flex-shrink-0`}></div>
                
                <div className="flex items-start p-3 flex-grow">
                  {/* 图标 */}
                  <div className="flex-shrink-0 mr-3">
                    {bookmark.favicon ? (
                      <img 
                        src={bookmark.favicon} 
                        alt="" 
                        className="w-8 h-8 rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/globe.svg';
                        }}
                      />
                    ) : (
                      <div className={`w-8 h-8 ${hasGradient ? cardClass : 'bg-gray-100 dark:bg-gray-700'} rounded-md flex items-center justify-center`}>
                        <ExternalLink className={`h-4 w-4 ${hasGradient ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                      </div>
                    )}
                  </div>
                  
                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold leading-tight line-clamp-1 text-gray-900 dark:text-gray-100">
                      {bookmark.title || '无标题'}
                    </h2>
                    
                    {bookmark.description && (
                      <p className="mt-0.5 text-xs line-clamp-1 text-gray-600 dark:text-gray-300">
                        {bookmark.description}
                      </p>
                    )}
                    
                    {/* 添加标签和收藏集展示 */}
                    {renderTags(bookmark.id)}
                    {renderCollections(bookmark.id)}
                    
                    <div className="flex items-center justify-between mt-1">
                      <a 
                        href={bookmark.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        {new URL(bookmark.url).hostname}
                      </a>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(bookmark.addedAt || bookmark.createdAt)}
                        </span>
                        
                        <button
                          onClick={() => setBookmarkToDelete(bookmark.id)}
                          className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          
          // 网格视图 - 缩小卡片尺寸
          return (
            <div 
              key={bookmark.id}
              className="rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="flex flex-col h-full">
                {/* 上半部分背景色区域 - 减小高度为h-32 */}
                <div className={`${hasGradient ? cardClass : 'bg-white dark:bg-gray-800'} p-4 h-32`}>
                  {/* 标题区域 */}
                  <div className="mb-1">
                    <h2 className={`text-base font-bold leading-tight line-clamp-2 ${
                      hasGradient ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {bookmark.title || '无标题'}
                    </h2>
                  </div>
                  
                  {/* 描述区域 */}
                  {bookmark.description && (
                    <p className={`text-xs line-clamp-2 ${
                      hasGradient ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {bookmark.description}
                    </p>
                  )}
                </div>
                
                {/* 下半部分白色区域 - 减小内边距 */}
                <div className="bg-white dark:bg-gray-800 p-3 flex-grow">
                  {/* 添加标签和收藏集展示 */}
                  {renderTags(bookmark.id)}
                  {renderCollections(bookmark.id)}
                  
                  {/* 底部信息区域 */}
                  <div className="mt-auto">
                    {/* 分隔线 */}
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1.5"></div>
                    
                    {/* 链接和操作区域 */}
                    <div className="flex items-center justify-between">
                      <a 
                        href={bookmark.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <div className="flex items-center">
                          {bookmark.favicon ? (
                            <img 
                              src={bookmark.favicon} 
                              alt="" 
                              className="w-3.5 h-3.5 mr-1.5 rounded-sm"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/globe.svg';
                              }}
                            />
                          ) : (
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          <span className="text-xs truncate max-w-[120px]">
                            {new URL(bookmark.url).hostname}
                          </span>
                        </div>
                      </a>
                      
                      <button
                        onClick={() => setBookmarkToDelete(bookmark.id)}
                        className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染分页控件
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-6">
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3"
          >
            上一页
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => goToPage(page)}
              className="px-3"
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3"
          >
            下一页
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderBookmarks()}
      {renderPagination()}
      
      {/* 删除确认对话框 */}
      <AlertDialog open={!!bookmarkToDelete} onOpenChange={(open) => !open && setBookmarkToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这个书签吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => bookmarkToDelete && handleDeleteBookmark(bookmarkToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 