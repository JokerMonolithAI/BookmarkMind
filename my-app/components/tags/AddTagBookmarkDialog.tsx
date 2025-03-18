'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Search, Check } from 'lucide-react';
import { addTagToBookmarks } from '@/lib/tagService';
import { getUserBookmarks, Bookmark } from '@/lib/bookmarkService';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface AddTagBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagId: string;
  tagName: string;
  onAdded: () => void;
}

export function AddTagBookmarkDialog({
  open,
  onOpenChange,
  tagId,
  tagName,
  onAdded,
}: AddTagBookmarkDialogProps) {
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
        
        // 每次打开对话框时重置选择状态
        setSelectedBookmarkIds([]);
        
        // 获取用户的所有书签
        const userBookmarks = await getUserBookmarks(user.uid);
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

  // 处理对话框关闭
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // 关闭对话框时重置所有状态
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

  // 处理书签选择 - 完全重写以修复计数问题
  const handleBookmarkSelect = (bookmarkId: string) => {
    setSelectedBookmarkIds(prevIds => {
      // 检查书签是否已被选中
      const isSelected = prevIds.includes(bookmarkId);
      
      // 如果已选中，则从数组中移除
      if (isSelected) {
        console.log(`移除书签: ${bookmarkId}`);
        return prevIds.filter(id => id !== bookmarkId);
      } 
      // 如果未选中，则添加到数组中
      else {
        console.log(`添加书签: ${bookmarkId}`);
        return [...prevIds, bookmarkId];
      }
    });
  };

  // 计算当前选中的书签数量
  const selectedCount = selectedBookmarkIds.length;
  
  // 用于调试的副作用钩子
  useEffect(() => {
    console.log(`当前选中的书签数量: ${selectedCount}`);
    console.log('选中的书签IDs:', selectedBookmarkIds);
  }, [selectedBookmarkIds, selectedCount]);

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('用户未登录');
      return;
    }

    // 获取当前选中的书签列表
    const bookmarksToAdd = [...selectedBookmarkIds];
    const bookmarksCount = bookmarksToAdd.length;
    
    if (bookmarksCount === 0) {
      setError('请至少选择一个要添加的书签');
      return;
    }

    console.log(`准备添加 ${bookmarksCount} 个书签到标签`);
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // 批量添加所有选中的书签到标签
      await addTagToBookmarks(user.uid, tagId, bookmarksToAdd);
      
      toast({
        title: "添加成功",
        description: `已成功将 ${bookmarksCount} 个书签添加到"${tagName}"标签`,
      });
      
      // 重置状态并关闭对话框
      setSelectedBookmarkIds([]);
      setSearchQuery('');
      onAdded();
    } catch (error) {
      console.error('Error adding bookmarks to tag:', error);
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
            <DialogTitle>添加书签到"{tagName}"标签</DialogTitle>
            <DialogDescription>
              从您的书签中选择要添加到此标签的书签。您可以选择多个书签同时添加。
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
                    {filteredBookmarks.map(bookmark => {
                      // 检查当前书签是否被选中
                      const isSelected = selectedBookmarkIds.includes(bookmark.id);
                      
                      return (
                        <div
                          key={bookmark.id}
                          className={cn(
                            "flex items-start gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                            isSelected && "bg-blue-50 dark:bg-blue-900/20"
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
                          {isSelected && (
                            <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
            
            {/* 已选择的书签数量 - 直接显示当前计数 */}
            {selectedCount > 0 && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                已选择 {selectedCount} 个书签
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
              disabled={isSubmitting || selectedCount === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  添加中...
                </>
              ) : (
                <>添加书签</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 