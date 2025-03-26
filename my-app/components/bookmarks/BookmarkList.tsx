'use client'

import { useState, useEffect, useCallback } from 'react';
import { FileText, ExternalLink, Trash, Loader2, FileUp, File } from 'lucide-react';
import { eventService, EVENTS } from '@/lib/eventService';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useView as useDashboardView } from '@/components/dashboard/ViewToggle';
import { useView as useBookmarksView } from '@/components/bookmarks/ViewToggle';
import { Tag, getBookmarkTags } from '@/lib/supabaseTagService';
import { getBookmarkCollections } from '@/lib/supabaseCollectionService';
import { getUserBookmarks, deleteBookmark, updateBookmark, Bookmark } from '@/lib/supabaseBookmarkService';
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
import { supabase } from '@/lib/supabase';
import { Progress } from "@/components/ui/progress";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 修改 PDF 删除对话框参数类型，删除不需要的 fileId 字段
interface PdfDeleteParams {
  bookmarkId: string;
  fileName: string;
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
  // 获取当前页面路径，决定使用哪个view hook
  const isDashboardPage = typeof window !== 'undefined' && window.location.pathname.includes('/dashboard');
  // 根据页面选择对应的视图上下文
  const dashboardViewContext = useDashboardView();
  const bookmarksViewContext = useBookmarksView();
  // 使用对应页面的activeView
  const activeView = isDashboardPage ? dashboardViewContext.activeView : bookmarksViewContext.activeView;
  
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
  // 添加上传相关的状态
  const [uploadingBookmarkId, setUploadingBookmarkId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState<PdfDeleteParams | null>(null);

  // 获取书签数据 - 使用 Supabase 服务
  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // 使用 Supabase 服务获取书签
      const bookmarksArray = await getUserBookmarks(user.id);
      setBookmarks(bookmarksArray);
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
      
      // 处理书签事件
      const handleBookmarksImported = () => {
        fetchBookmarks();
      };
      
      const handleBookmarkDeleted = () => {
        fetchBookmarks();
      };
      
      // 订阅事件
      eventService.subscribe(EVENTS.BOOKMARKS_IMPORTED, handleBookmarksImported);
      eventService.subscribe(EVENTS.BOOKMARK_DELETED, handleBookmarkDeleted);
      
      // 组件卸载时取消订阅
      return () => {
        eventService.unsubscribe(EVENTS.BOOKMARKS_IMPORTED, handleBookmarksImported);
        eventService.unsubscribe(EVENTS.BOOKMARK_DELETED, handleBookmarkDeleted);
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

  // 删除书签 - 使用 Supabase 服务
  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!user || isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      // 获取书签详情，检查是否有 PDF 需要删除
      const bookmark = bookmarks.find(b => b.id === bookmarkId);
      if (bookmark?.pdf?.storagePath) {
        // 从 Supabase Storage 删除 PDF 文件
        const { error: storageError } = await supabase.storage
          .from('bookmarks')
          .remove([bookmark.pdf.storagePath]);
          
        if (storageError) {
          console.error('Error deleting PDF file:', storageError);
        }
      }
      
      // 使用 Supabase 服务删除书签
      await deleteBookmark(user.id, bookmarkId);
      
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
      const tags = await getBookmarkTags(user.id, bookmarkId);
      
      // 获取书签所属的收藏集
      const collectionIds = await getBookmarkCollections(user.id, bookmarkId);
      
      // 获取收藏集名称
      const collections: {id: string, name: string}[] = [];
      
      if (collectionIds.length > 0) {
        // 直接构建收藏集对象数组
        collections.push(...collectionIds.map(id => ({
          id,
          name: id // 临时使用 ID 作为名称，后续可改进
        })));
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
      title.includes('翻译') ||
      title.includes('google')
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
      title.includes('机器学习') ||
      title.includes('agi') ||
      title.includes('飞书')
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
      title.includes('platform') ||
      title.includes('前言') ||
      title.includes('capacity') ||
      title.includes('cloud')
    ) {
      return 'card-gradient-green';
    }
    
    // 默认情况下随机一个渐变色
    const gradients = ['card-gradient-purple', 'card-gradient-orange', 'card-gradient-green'];
    const randomIndex = Math.floor(bookmark.id.charCodeAt(0) % 3);
    return gradients[randomIndex];
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
            className="text-xs px-1.5 py-0.5 h-4 card-tag"
          >
            {tag.name}
          </Badge>
        ))}
        {metadata.tags.length > 3 && (
          <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-4 card-tag">
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
            className="text-xs px-1.5 py-0.5 h-4 card-tag"
          >
            {collection.name}
          </Badge>
        ))}
        {metadata.collections.length > 2 && (
          <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-4 card-tag">
            +{metadata.collections.length - 2}
          </Badge>
        )}
      </div>
    );
  };

  // 添加处理PDF上传的函数 - 使用 Supabase Storage
  const handlePdfUpload = async (bookmarkId: string, file: File) => {
    if (!user || isUploading) return;
    
    // 验证文件类型
    if (file.type !== 'application/pdf') {
      toast({
        title: "文件类型错误",
        description: "只能上传PDF文件",
        variant: "destructive",
      });
      return;
    }
    
    // 检查文件大小 (限制为 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "文件过大",
        description: "PDF文件大小不能超过10MB",
        variant: "destructive",
      });
      return;
    }
    
    // 找到书签对象
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    
    // 检查是否已有PDF文件
    if (bookmark?.pdf) {
      toast({
        title: "已存在PDF文件",
        description: "每个书签只能上传一个PDF文件，请先删除现有文件",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadingBookmarkId(bookmarkId);
      setUploadProgress(0);
      
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9_\-.]/g, '_')}`;
      const filePath = `${user.id}/${bookmarkId}/${fileName}`;
      
      // 上传文件到 Supabase Storage
      const { data, error } = await supabase.storage
        .from('bookmarks')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
        
      if (error) throw error;
      
      // 获取文件公共 URL
      const { data: publicUrlData } = supabase.storage
        .from('bookmarks')
        .getPublicUrl(filePath);
        
      if (!publicUrlData.publicUrl) throw new Error('Failed to get public URL');
      
      // 更新书签添加 PDF 信息
      const pdfData = {
        url: publicUrlData.publicUrl,
        name: file.name,
        addedAt: timestamp,
        storagePath: filePath,
        size: file.size
      };
      
      // 更新 Supabase 数据库中的书签
      await updateBookmark(user.id, bookmarkId, { pdf: pdfData });
      
      // 更新本地状态
      setBookmarks(prev => prev.map(b => {
        if (b.id === bookmarkId) {
          return {
            ...b,
            pdf: pdfData
          };
        }
        return b;
      }));
      
      toast({
        title: "PDF上传成功",
        description: `${file.name} 已成功上传`,
      });
      
    } catch (error) {
      console.error('Error handling PDF upload:', error);
      toast({
        title: "上传PDF失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadingBookmarkId(null);
    }
  };

  // 从 Supabase Storage 删除文件
  const deletePdf = async (bookmarkId: string, fileName: string) => {
    if (!user || isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      // 获取书签数据
      const bookmark = bookmarks.find(b => b.id === bookmarkId);
      
      if (!bookmark || !bookmark.pdf) {
        toast({
          title: "删除失败",
          description: "未找到PDF文件",
          variant: "destructive",
        });
        return;
      }
      
      // 从 Supabase Storage 删除文件
      const { error: storageError } = await supabase.storage
        .from('bookmarks')
        .remove([bookmark.pdf.storagePath]);
        
      if (storageError) throw storageError;
      
      // 更新书签数据，移除 PDF 信息
      // 使用 undefined 而不是 null 更新 pdf 字段
      await updateBookmark(user.id, bookmarkId, { pdf: undefined });
      
      // 更新本地状态
      setBookmarks(prev => prev.map(b => {
        if (b.id === bookmarkId) {
          // 创建一个新对象，但不包含 pdf 属性
          const { pdf, ...rest } = b;
          return rest as Bookmark;
        }
        return b;
      }));
      
      toast({
        title: "PDF已删除",
        description: `${fileName} 已成功删除`,
      });
      
    } catch (error) {
      console.error('Error deleting PDF:', error);
      toast({
        title: "删除PDF失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setPdfToDelete(null);
    }
  };

  // 文件上传处理器 - 保持不变
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, bookmarkId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePdfUpload(bookmarkId, file);
    }
    // 清空文件输入，以便可以再次选择同一文件
    e.target.value = '';
  };

  // 渲染PDF文件
  const renderPdfFile = (bookmark: Bookmark) => {
    if (!bookmark.pdf) return null;
    
    const pdfData = bookmark.pdf;
    
    return (
      <div className="flex items-center justify-between mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors pdf-container">
        <a 
          href={pdfData.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 dark:text-blue-400 flex-1 min-w-0 group"
        >
          <div className="bg-blue-100 dark:bg-blue-800 p-1.5 rounded-md mr-2 group-hover:bg-blue-200 dark:group-hover:bg-blue-700 transition-colors">
            <File className="h-3.5 w-3.5 text-blue-700 dark:text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium truncate block">{pdfData.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">点击查看PDF</span>
          </div>
        </a>
        <button
          onClick={() => setPdfToDelete({bookmarkId: bookmark.id, fileName: pdfData.name})}
          className="ml-2 p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0 transition-colors"
          aria-label="删除PDF文件"
        >
          <Trash className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  // 渲染PDF上传区域 - 更新以适应新的数据结构
  const renderPdfUploadArea = (bookmark: Bookmark, isGrid = false) => {
    if (bookmark.pdf) return null;
    
    const buttonId = isGrid ? `pdf-upload-grid-${bookmark.id}` : `pdf-upload-${bookmark.id}`;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <label 
              htmlFor={buttonId}
              className={`
                cursor-pointer flex items-center justify-center border border-dashed 
                border-blue-200 dark:border-blue-800 rounded-md mt-2 p-2
                hover:bg-blue-50 dark:hover:bg-blue-900/20 group transition-colors
                ${isGrid ? 'h-10' : 'h-9'}
              `}
            >
              <input 
                type="file" 
                id={buttonId} 
                accept="application/pdf" 
                className="hidden" 
                onChange={(e) => handleFileInputChange(e, bookmark.id)}
                disabled={isUploading}
              />
              <FileUp className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 mr-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-300" />
              <span className="text-xs text-blue-500 dark:text-blue-400 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-300">
                添加PDF文件
              </span>
            </label>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>上传与此书签相关的PDF文件</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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

    // 在仪表盘页面始终使用网格布局，在书签页面根据activeView决定
    const useGridLayout = isDashboardPage || activeView === 'grid';

    return (
      <div className={`grid grid-cols-1 ${useGridLayout ? 'md:grid-cols-3 lg:grid-cols-4' : ''} gap-4`}>
        {currentPageBookmarks.map(bookmark => {
          const cardClass = getBookmarkCardClass(bookmark);
          const hasGradient = cardClass !== '';
          
          // 在仪表盘页面或网格视图下使用卡片样式
          if (useGridLayout) {
            return (
              <div 
                key={bookmark.id}
                className="rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 bookmark-card-hover"
              >
                <div className="flex flex-col h-full">
                  {/* 上半部分背景色区域 */}
                  <div className={`${cardClass} p-4 h-32`}>
                    {/* 标题区域 */}
                    <div className="mb-1">
                      <h2 className="text-base font-bold leading-tight line-clamp-2 text-white">
                        {bookmark.title || '无标题'}
                      </h2>
                    </div>
                    
                    {/* 描述区域 */}
                    {bookmark.description && (
                      <p className="text-xs line-clamp-2 text-white/90">
                        {bookmark.description}
                      </p>
                    )}
                  </div>
                  
                  {/* 下半部分白色区域 */}
                  <div className="bg-white dark:bg-gray-800 p-3 flex-grow flex flex-col">
                    {/* 渲染PDF文件 */}
                    {renderPdfFile(bookmark)}
                    
                    {/* 渲染PDF上传区域 */}
                    {renderPdfUploadArea(bookmark, true)}
                    
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
                        
                        <div className="flex items-center">
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
              </div>
            );
          }
          
          // 列表视图
          return (
            <div 
              key={bookmark.id}
              className="rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 flex bookmark-card-hover"
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
                  
                  {/* 渲染PDF文件 */}
                  {renderPdfFile(bookmark)}
                  
                  {/* 渲染PDF上传区域 */}
                  {renderPdfUploadArea(bookmark)}
                  
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
      
      {/* PDF删除确认对话框 */}
      <AlertDialog open={!!pdfToDelete} onOpenChange={(open) => !open && setPdfToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除PDF</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除此PDF文件吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => pdfToDelete && deletePdf(pdfToDelete.bookmarkId, pdfToDelete.fileName)}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 上传进度对话框 */}
      <AlertDialog open={isUploading} onOpenChange={(open) => !open && setIsUploading(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>上传PDF</AlertDialogTitle>
            <AlertDialogDescription>
              正在上传文件，请稍候...
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-gray-500 mt-2 text-center">{Math.round(uploadProgress)}%</p>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 