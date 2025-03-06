'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { ref, get, remove } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trash } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useView } from './ViewToggle';
import ImportButton from './ImportButton';
import { eventService, EVENTS } from '@/lib/eventService';
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

// 在本地定义 Bookmark 接口
interface Bookmark {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  createdAt: number;
  addedAt: number;
  tags?: string[];
}

export default function BookmarkList() {
  const { user } = useAuth();
  const { activeView } = useView();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const bookmarksPerPage = 12;
  const [bookmarkToDelete, setBookmarkToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // 获取数据库引用 - 修复路径，添加额外的 bookmarks 层级
      const bookmarksRef = ref(db, `users/${user.uid}/bookmarks/bookmarks`);
      
      // 获取快照
      const snapshot = await get(bookmarksRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // 转换数据
        let bookmarksArray: Bookmark[] = [];
        
        // 检查数据结构，处理可能的嵌套情况
        if (typeof data === 'object') {
          // 直接遍历顶层对象
          Object.keys(data).forEach(key => {
            const item = data[key];
            
            // 检查是否是有效的书签对象
            if (item && typeof item === 'object' && item.url) {
              bookmarksArray.push({
                id: key,
                ...item
              });
            } else if (item && typeof item === 'object') {
              // 可能是嵌套的情况，再遍历一层
              Object.keys(item).forEach(subKey => {
                const subItem = item[subKey];
                if (subItem && typeof subItem === 'object' && subItem.url) {
                  bookmarksArray.push({
                    id: `${key}_${subKey}`,
                    ...subItem
                  });
                }
              });
            }
          });
        }
        
        // 按创建时间排序，最新的在前面
        bookmarksArray.sort((a, b) => {
          // 确保 createdAt 存在，如果不存在则使用 addedAt 或 0
          const timeA = a.createdAt || a.addedAt || 0;
          const timeB = b.createdAt || b.addedAt || 0;
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
        description: "请检查您的网络连接并重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 删除书签
  const deleteBookmark = async (id: string) => {
    if (!user) return;
    
    try {
      setIsDeleting(true);
      
      // 从数据库中删除书签 - 修复路径，添加额外的 bookmarks 层级
      console.log(`尝试删除书签: ${id}`);
      console.log(`删除路径: users/${user.uid}/bookmarks/bookmarks/${id}`);
      
      const bookmarkRef = ref(db, `users/${user.uid}/bookmarks/bookmarks/${id}`);
      
      // 检查书签是否存在
      const snapshot = await get(bookmarkRef);
      if (!snapshot.exists()) {
        console.error(`书签不存在: ${id}`);
        toast({
          title: "删除失败",
          description: "找不到要删除的书签",
          variant: "destructive"
        });
        return;
      }
      
      // 执行删除操作
      await remove(bookmarkRef);
      console.log(`书签已从数据库中删除: ${id}`);
      
      // 更新本地状态
      const updatedBookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
      setBookmarks(updatedBookmarks);
      setFilteredBookmarks(updatedBookmarks);
      
      toast({
        title: "书签已删除",
        description: "书签已成功从数据库中删除",
      });
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      
      // 详细记录错误信息
      if (error instanceof Error) {
        console.error(`错误类型: ${error.name}`);
        console.error(`错误消息: ${error.message}`);
        console.error(`错误堆栈: ${error.stack}`);
      }
      
      toast({
        title: "删除书签失败",
        description: "无法从数据库中删除书签，请检查控制台获取详细错误信息",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setBookmarkToDelete(null);
    }
  };

  // 获取当前页的书签
  const getCurrentPageBookmarks = () => {
    const indexOfLastBookmark = currentPage * bookmarksPerPage;
    const indexOfFirstBookmark = indexOfLastBookmark - bookmarksPerPage;
    return filteredBookmarks.slice(indexOfFirstBookmark, indexOfLastBookmark);
  };

  // 计算总页数
  const totalPages = Math.ceil(filteredBookmarks.length / bookmarksPerPage);

  // 页码导航
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user, fetchBookmarks]);

  // 订阅书签导入成功事件
  useEffect(() => {
    // 定义事件处理函数
    const handleBookmarksImported = () => {
      console.log('检测到书签导入成功事件，刷新书签列表');
      fetchBookmarks();
    };
    
    // 订阅事件
    eventService.subscribe(EVENTS.BOOKMARKS_IMPORTED, handleBookmarksImported);
    
    // 组件卸载时取消订阅
    return () => {
      eventService.unsubscribe(EVENTS.BOOKMARKS_IMPORTED, handleBookmarksImported);
    };
  }, [fetchBookmarks]);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-2 text-gray-500">加载书签中...</p>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 mb-4">您还没有添加任何书签</p>
        <ImportButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 书签列表 */}
      {filteredBookmarks.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">没有找到匹配的书签</p>
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-1 ${activeView === 'list' ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-4`}>
            {getCurrentPageBookmarks().map((bookmark) => (
              <div 
                key={bookmark.id}
                className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden mr-3 flex-shrink-0">
                    {bookmark.favicon ? (
                      <img 
                        src={bookmark.favicon} 
                        alt="" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // 如果图标加载失败，显示默认图标
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{bookmark.title || '无标题'}</h3>
                    <p className="text-sm text-gray-500 truncate">{bookmark.url || '无链接'}</p>
                  </div>
                </div>
                
                {bookmark.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{bookmark.description}</p>
                )}
                
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {bookmark.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-400">
                    {bookmark.createdAt ? new Date(bookmark.createdAt).toLocaleDateString() : '未知日期'}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      onClick={() => window.open(bookmark.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">打开链接</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setBookmarkToDelete(bookmark.id)}
                      disabled={isDeleting}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">删除</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-md"
                  disabled={currentPage === 1}
                  onClick={() => paginate(currentPage - 1)}
                >
                  &laquo;
                </Button>
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // 只显示当前页附近的页码
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === currentPage ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-8 p-0 rounded-md ${
                          pageNumber === currentPage
                            ? "bg-blue-600 text-white"
                            : "text-gray-700"
                        }`}
                        onClick={() => paginate(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  }
                  
                  // 显示省略号
                  if (
                    (pageNumber === currentPage - 2 && pageNumber > 1) ||
                    (pageNumber === currentPage + 2 && pageNumber < totalPages)
                  ) {
                    return <span key={pageNumber} className="px-2">...</span>;
                  }
                  
                  return null;
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-md"
                  disabled={currentPage === totalPages}
                  onClick={() => paginate(currentPage + 1)}
                >
                  &raquo;
                </Button>
              </nav>
            </div>
          )}
        </>
      )}
      
      {/* 删除确认对话框 */}
      <AlertDialog open={!!bookmarkToDelete} onOpenChange={(open) => !open && setBookmarkToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这个书签吗？此操作无法撤销，书签将从数据库中永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bookmarkToDelete && deleteBookmark(bookmarkToDelete)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <span className="mr-2">删除中</span>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                </>
              ) : (
                "删除"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 