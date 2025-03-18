'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bookmark } from '@/lib/bookmarkService';
import { Tag, addTagToBookmark, removeTagFromBookmark, getBookmarkTags } from '@/lib/tagService';
import { BookmarkForm } from './BookmarkForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { eventService, EVENTS } from '@/lib/eventService';

interface EditBookmarkDialogProps {
  bookmark: Omit<Bookmark, 'createdAt'> & {
    createdAt: string | number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function EditBookmarkDialog({ 
  bookmark, 
  open, 
  onOpenChange, 
  onUpdated 
}: EditBookmarkDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark>({
    ...bookmark,
    createdAt: typeof bookmark.createdAt === 'string' ? Date.parse(bookmark.createdAt) : bookmark.createdAt
  });

  // 当书签或打开状态改变时，更新当前书签
  useEffect(() => {
    if (open && bookmark) {
      setCurrentBookmark({
        ...bookmark,
        createdAt: typeof bookmark.createdAt === 'string' ? Date.parse(bookmark.createdAt) : bookmark.createdAt
      });
    }
  }, [bookmark, open]);

  const handleUpdateBookmark = async (updatedBookmark: Partial<Bookmark>, tags: Tag[]) => {
    if (!user || !currentBookmark.id) return;
    
    try {
      setIsSubmitting(true);
      
      // 更新书签
      const response = await fetch(`/api/bookmarks/${currentBookmark.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          title: updatedBookmark.title,
          url: updatedBookmark.url,
          description: updatedBookmark.description || ''
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update bookmark');
      }
      
      // 获取当前书签的标签
      const currentTags = await getBookmarkTags(user.uid, currentBookmark.id);
      
      // 比较当前标签和新标签
      const tagsToAdd = tags.filter(tag => !currentTags.some(t => t.id === tag.id));
      const tagsToRemove = currentTags.filter(tag => !tags.some(t => t.id === tag.id));
      
      // 添加新标签
      for (const tag of tagsToAdd) {
        await addTagToBookmark(user.uid, currentBookmark.id, tag.id);
      }
      
      // 移除已删除的标签
      for (const tag of tagsToRemove) {
        await removeTagFromBookmark(user.uid, currentBookmark.id, tag.id);
      }
      
      toast({
        title: '书签已更新',
        description: `书签 "${updatedBookmark.title}" 已成功更新`,
      });
      
      // 发布书签更新事件
      eventService.publish(EVENTS.BOOKMARKS_IMPORTED);
      
      // 调用onUpdated回调
      if (onUpdated) {
        onUpdated();
      }
      
      // 关闭对话框
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating bookmark:', error);
      
      toast({
        title: '更新书签失败',
        description: error instanceof Error ? error.message : '更新书签时出错',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 如果isLoading，显示加载指示器
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isSubmitting) {
        onOpenChange(newOpen);
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑书签</DialogTitle>
          <DialogDescription>
            修改书签信息和标签
          </DialogDescription>
        </DialogHeader>
        
        <BookmarkForm
          bookmark={currentBookmark}
          onSubmit={handleUpdateBookmark}
          isSubmitting={isSubmitting}
          submitLabel="更新书签"
        />
      </DialogContent>
    </Dialog>
  );
} 