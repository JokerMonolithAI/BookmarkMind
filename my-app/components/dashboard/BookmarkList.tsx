'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { ref, get, remove } from 'firebase/database';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trash, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { useView } from './ViewToggle';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const bookmarksPerPage = 12;

  const fetchBookmarks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // 获取数据库引用
      const bookmarksRef = ref(db, `users/${user.uid}/bookmarks`);
      
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
  };

  // 删除书签
  const deleteBookmark = async (id: string) => {
    if (!user) return;
    
    try {
      const bookmarkRef = ref(db, `users/${user.uid}/bookmarks/${id}`);
      await remove(bookmarkRef);
      
      // 更新本地状态
      const updatedBookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
      setBookmarks(updatedBookmarks);
      setFilteredBookmarks(updatedBookmarks.filter(bookmark => 
        (bookmark.title && bookmark.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (bookmark.url && bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()))
      ));
      
      toast({
        title: "书签已删除",
        description: "书签已成功删除",
      });
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast({
        title: "删除书签失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  };

  // 搜索过滤
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBookmarks(bookmarks);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = bookmarks.filter(bookmark => 
        (bookmark.title && bookmark.title.toLowerCase().includes(term)) ||
        (bookmark.url && bookmark.url.toLowerCase().includes(term)) ||
        (bookmark.description && bookmark.description.toLowerCase().includes(term)) ||
        (bookmark.tags && bookmark.tags.some(tag => tag.toLowerCase().includes(term)))
      );
      setFilteredBookmarks(filtered);
    }
    setCurrentPage(1); // 重置到第一页
  }, [searchTerm, bookmarks]);

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
  }, [user]);

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
        <Button 
          variant="outline"
          className="h-10 px-4 py-2.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors duration-200"
        >
          导入书签
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 搜索和统计信息 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">我的书签</h2>
          <p className="text-sm text-gray-500 mt-1">共 {bookmarks.length} 个书签</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="搜索书签..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 w-full border border-gray-200 rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all duration-200"
          />
        </div>
      </div>
      
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
                      onClick={() => deleteBookmark(bookmark.id)}
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
    </div>
  );
} 