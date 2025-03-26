'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Search, Check } from 'lucide-react';
import { addBookmarkToCollection, addBookmarksToCollection } from '@/lib/supabaseCollectionService';
import { getUserBookmarks, Bookmark } from '@/lib/supabaseBookmarkService';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AddBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  onAdded: () => void;
}

export function AddBookmarkDialog({
  open,
  onOpenChange,
  collectionId,
  onAdded,
}: AddBookmarkDialogProps) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 获取用户的所有书签
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user || !open) return;
      
      try {
        setIsLoading(true);
        setError('');
        
        // 获取用户的所有书签
        const userBookmarks = await getUserBookmarks(user.id);
        setBookmarks(userBookmarks);
        setFilteredBookmarks(userBookmarks);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
        setError('获取书签失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookmarks();
  }, [user, open]);

  // 监听选中书签的变化，确保状态更新
  useEffect(() => {
    console.log('Selected bookmarks:', selectedBookmarkIds.length);
  }, [selectedBookmarkIds]);

  // 处理对话框关闭
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedBookmarkIds([]);
      setSearchQuery('');
      setError('');
    }
    onOpenChange(open);
  };

  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredBookmarks(bookmarks);
      return;
    }
    
    const filtered = bookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(query.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(query.toLowerCase()) ||
      (bookmark.description && bookmark.description.toLowerCase().includes(query.toLowerCase()))
    );
    
    setFilteredBookmarks(filtered);
  };

  // 处理书签选择
  const handleBookmarkSelect = (bookmarkId: string) => {
    setSelectedBookmarkIds(prevSelected => {
      const newSelected = prevSelected.includes(bookmarkId)
        ? prevSelected.filter(id => id !== bookmarkId)
        : [...prevSelected, bookmarkId];
      
      console.log('Updating selected bookmarks:', newSelected.length);
      return newSelected;
    });
  };

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('用户未登录');
      return;
    }

    if (selectedBookmarkIds.length === 0) {
      setError('请至少选择一个要添加的书签');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      // 批量添加所有选中的书签到收藏集
      await addBookmarksToCollection(user.id, collectionId, selectedBookmarkIds);
      
      setSelectedBookmarkIds([]);
      setSearchQuery('');
      onAdded();
    } catch (error) {
      console.error('Error adding bookmarks to collection:', error);
      setError('添加书签失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>添加书签到收藏集</DialogTitle>
            <DialogDescription>
              从您的书签中选择要添加到当前收藏集的书签。您可以选择多个书签同时添加。
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="search"
                placeholder="搜索书签..."
                className="pl-9"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            {/* 书签列表 */}
            <div className="border rounded-md">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">加载书签中...</span>
                </div>
              ) : filteredBookmarks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? '没有找到匹配的书签' : '您还没有添加任何书签'}
                </div>
              ) : (
                <ScrollArea className="h-[240px]">
                  <div className="p-1">
                    {filteredBookmarks.map(bookmark => (
                      <div
                        key={bookmark.id}
                        className={cn(
                          "flex items-start gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                          selectedBookmarkIds.includes(bookmark.id) && "bg-blue-50 dark:bg-blue-900/20"
                        )}
                        onClick={() => handleBookmarkSelect(bookmark.id)}
                      >
                        {bookmark.favicon ? (
                          <img 
                            src={bookmark.favicon} 
                            alt="" 
                            className="w-5 h-5 mt-0.5 rounded-sm"
                          />
                        ) : (
                          <div className="w-5 h-5 mt-0.5 bg-gray-200 dark:bg-gray-700 rounded-sm flex items-center justify-center text-xs">
                            {bookmark.title.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{bookmark.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{bookmark.url}</div>
                        </div>
                        {selectedBookmarkIds.includes(bookmark.id) && (
                          <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
            
            {/* 已选择的书签数量 */}
            {selectedBookmarkIds.length > 0 && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                已选择 {selectedBookmarkIds.length} 个书签
              </div>
            )}
            
            {error && (
              <div className="text-sm text-red-500 mt-1">{error}</div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || selectedBookmarkIds.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  添加中...
                </>
              ) : (
                <>
                  添加
                  {selectedBookmarkIds.length > 0 && (
                    <span className="ml-1">({selectedBookmarkIds.length})</span>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 