'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { ref, get, remove, update } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { 
  Trash, 
  FileUp, 
  ExternalLink, 
  FileText,
  File,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useView } from './ViewToggle';
import ImportButton from './ImportButton';
import { eventService, EVENTS } from '@/lib/eventService';
// 导入Firebase Storage相关函数
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
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
import { Progress } from "@/components/ui/progress";
// 导入标签和收藏集相关功能
import { Tag, getBookmarkTags } from '@/lib/tagService';
import { getBookmarkCollections } from '@/lib/collectionService';
import { Badge } from '@/components/ui/badge';
// 导入Tooltip组件
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 在本地定义 Bookmark 接口，添加PDF相关字段
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
}

export default function BookmarkList({ searchQuery = '' }: BookmarkListProps) {
  const { user } = useAuth();
  const { activeView } = useView();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkToDelete, setBookmarkToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingBookmarkId, setUploadingBookmarkId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  // 添加标签和收藏集的状态
  const [bookmarkMetadata, setBookmarkMetadata] = useState<{[key: string]: BookmarkMetadata}>({});
  const [loadingMetadata, setLoadingMetadata] = useState<{[key: string]: boolean}>({});
  const [pdfToDelete, setPdfToDelete] = useState<{bookmarkId: string, fileId: string, fileName: string} | null>(null);

  // 获取书签数据
  const fetchBookmarks = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const bookmarksRef = ref(db, `users/${user.uid}/bookmarks`);
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
        setFilteredBookmarks(bookmarksArray);
      } else {
        setBookmarks([]);
        setFilteredBookmarks([]);
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

  // 初始加载
  useEffect(() => {
    if (user) {
      fetchBookmarks();
      
      // 订阅书签导入成功事件
      const handleBookmarksImported = () => {
        fetchBookmarks();
      };
      
      eventService.subscribe(EVENTS.BOOKMARKS_IMPORTED, handleBookmarksImported);
      
      // 组件卸载时取消订阅
      return () => {
        eventService.unsubscribe(EVENTS.BOOKMARKS_IMPORTED, handleBookmarksImported);
      };
    }
  }, [user, fetchBookmarks]);

  // 订阅书签删除事件
  useEffect(() => {
    const handleBookmarkDeleted = () => {
      fetchBookmarks();
    };
    
    eventService.subscribe(EVENTS.BOOKMARK_DELETED, handleBookmarkDeleted);
    
    return () => {
      eventService.unsubscribe(EVENTS.BOOKMARK_DELETED, handleBookmarkDeleted);
    };
  }, [user]);

  // 处理搜索过滤
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBookmarks(bookmarks);
      return;
    }

    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = bookmarks.filter(bookmark => 
      bookmark.title?.toLowerCase().includes(lowercaseQuery) || 
      bookmark.url.toLowerCase().includes(lowercaseQuery) ||
      bookmark.description?.toLowerCase().includes(lowercaseQuery)
    );

    setFilteredBookmarks(filtered);
  }, [searchQuery, bookmarks]);

  // 删除书签
  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!user || isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      // 获取书签数据，检查是否有PDF需要删除
      const bookmarkRef = ref(db, `users/${user.uid}/bookmarks/${bookmarkId}`);
      const snapshot = await get(bookmarkRef);
      
      if (snapshot.exists()) {
        const bookmarkData = snapshot.val();
        
        // 如果有PDF文件，先删除Storage中的文件
        if (bookmarkData.pdfFiles) {
          const storage = getStorage();
          
          for (const fileId in bookmarkData.pdfFiles) {
            const fileData = bookmarkData.pdfFiles[fileId];
            if (fileData.storagePath) {
              try {
                const fileRef = storageRef(storage, fileData.storagePath);
                await deleteObject(fileRef);
              } catch (error) {
                console.error('Error deleting PDF file:', error);
              }
            }
          }
        }
      }
      
      // 删除书签数据
      await remove(ref(db, `users/${user.uid}/bookmarks/${bookmarkId}`));
      
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

  // 处理PDF上传
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
    
    // 找到书签对象
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    
    // 检查是否已有PDF文件
    if (bookmark?.pdfFiles && Object.keys(bookmark.pdfFiles).length > 0) {
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
      
      const storage = getStorage();
      const timestamp = Date.now();
      const filePath = `users/${user.uid}/pdfs/${bookmarkId}/${timestamp}_${file.name}`;
      const fileRef = storageRef(storage, filePath);
      
      // 创建上传任务
      const uploadTask = uploadBytesResumable(fileRef, file);
      
      // 监听上传进度
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading PDF:', error);
          toast({
            title: "上传PDF失败",
            description: "请稍后再试",
            variant: "destructive",
          });
          setIsUploading(false);
          setUploadingBookmarkId(null);
        },
        async () => {
          // 上传完成，获取下载URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // 更新书签数据，添加PDF信息
          const bookmarkRef = ref(db, `users/${user.uid}/bookmarks/${bookmarkId}`);
          
          const fileId = `pdf_${timestamp}`;
          const pdfFiles = {
            [fileId]: {
              url: downloadURL,
              name: file.name,
              addedAt: timestamp,
              storagePath: filePath
            }
          };
          
          // 更新数据库
          await update(bookmarkRef, { pdfFiles });
          
          // 更新本地状态
          setBookmarks(prev => prev.map(bookmark => {
            if (bookmark.id === bookmarkId) {
              return {
                ...bookmark,
                pdfFiles
              };
            }
            return bookmark;
          }));
          
          toast({
            title: "PDF上传成功",
            description: `${file.name} 已成功上传`,
          });
          
          setIsUploading(false);
          setUploadingBookmarkId(null);
        }
      );
      
    } catch (error) {
      console.error('Error handling PDF upload:', error);
      toast({
        title: "上传PDF失败",
        description: "请稍后再试",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadingBookmarkId(null);
    }
  };

  // 添加文件上传处理器
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, bookmarkId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePdfUpload(bookmarkId, file);
    }
    // 清空文件输入，以便可以再次选择同一文件
    e.target.value = '';
  };

  // 更新deletePdf函数，确保完全删除文件
  const deletePdf = async (bookmarkId: string, fileId: string, fileName: string) => {
    if (!user || isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      // 获取书签数据
      const bookmarkRef = ref(db, `users/${user.uid}/bookmarks/${bookmarkId}`);
      const bookmark = bookmarks.find(b => b.id === bookmarkId);
      
      if (bookmark?.pdfFiles && bookmark.pdfFiles[fileId]) {
        const fileData = bookmark.pdfFiles[fileId];
        
        // 如果有存储路径，删除Storage中的文件
        if (fileData.storagePath) {
          const storage = getStorage();
          const fileRef = storageRef(storage, fileData.storagePath);
          await deleteObject(fileRef);
        }
        
        // 更新数据库，清空pdfFiles字段
        await update(bookmarkRef, { pdfFiles: null });
        
        // 更新本地状态
        setBookmarks(prev => prev.map(b => {
          if (b.id === bookmarkId) {
            // 创建一个新对象，但不包含pdfFiles属性
            const { pdfFiles, ...rest } = b;
            return rest;
          }
          return b;
        }));
        
        toast({
          title: "PDF已删除",
          description: `${fileName} 已成功删除`,
        });
      }
      
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

  // 获取当前页的书签
  const getCurrentPageBookmarks = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBookmarks.slice(startIndex, endIndex);
  };

  // 处理翻页
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

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
  
  // 在renderBookmarks函数中，修改书签卡片的渲染方式
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
      <div className="flex flex-wrap gap-1 mt-1.5 mb-2">
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
      <div className="flex flex-wrap gap-1 mt-1 mb-2">
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

  // 修改renderPdfFile函数，优化PDF文件显示样式
  const renderPdfFile = (bookmark: Bookmark) => {
    if (!bookmark.pdfFiles) return null;
    
    const fileId = Object.keys(bookmark.pdfFiles)[0];
    if (!fileId) return null;
    
    const file = bookmark.pdfFiles[fileId];
    
    return (
      <div className="flex items-center justify-between mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
        <a 
          href={file.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 dark:text-blue-400 flex-1 min-w-0 group"
        >
          <div className="bg-blue-100 dark:bg-blue-800 p-1.5 rounded-md mr-2 group-hover:bg-blue-200 dark:group-hover:bg-blue-700 transition-colors">
            <File className="h-3.5 w-3.5 text-blue-700 dark:text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium truncate block">{file.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">点击查看PDF</span>
          </div>
        </a>
        <button
          onClick={() => setPdfToDelete({bookmarkId: bookmark.id, fileId, fileName: file.name})}
          className="ml-2 p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0 transition-colors"
          aria-label="删除PDF文件"
        >
          <Trash className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  // 添加PDF上传区域组件
  const renderPdfUploadArea = (bookmark: Bookmark, isGrid = false) => {
    if (bookmark.pdfFiles) return null;
    
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 如果书签为空
  if (bookmarks.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          您还没有添加任何书签
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
          添加书签来组织和保存您的网页收藏
        </p>
        <ImportButton />
      </div>
    );
  }

  // 如果过滤后没有结果
  if (filteredBookmarks.length === 0 && searchQuery && !loading) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          没有找到匹配的书签
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          尝试其他搜索词或浏览所有书签
        </p>
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
    
    // 无论是列表视图还是网格视图，都使用网格布局和相同的卡片样式
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentPageBookmarks.map(bookmark => {
          const cardClass = getBookmarkCardClass(bookmark);
          const hasGradient = cardClass !== '';
          const bgClass = cardClass; // 总是使用渐变背景
          
          return (
            <div 
              key={bookmark.id}
              className="rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="flex flex-col h-full">
                {/* 上半部分背景色区域 */}
                <div className={`${bgClass} p-4 h-32`}>
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
        })}
      </div>
    );
  };

  // 渲染分页控件
  const renderPagination = () => {
    if (filteredBookmarks.length <= itemsPerPage) return null;
    
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
          
          {Array.from({ length: Math.ceil(filteredBookmarks.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
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
            disabled={currentPage === Math.ceil(filteredBookmarks.length / itemsPerPage)}
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
              onClick={() => pdfToDelete && deletePdf(pdfToDelete.bookmarkId, pdfToDelete.fileId, pdfToDelete.fileName)}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 上传进度对话框 */}
      {isUploading && (
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
      )}
    </div>
  );
} 