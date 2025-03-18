'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bookmark } from '@/lib/bookmarkService';
import { Tag, addTagToBookmark } from '@/lib/tagService';
import { BookmarkForm } from './BookmarkForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { eventService, EVENTS } from '@/lib/eventService';

interface CreateBookmarkDialogProps {
  onCreate?: () => void;
  trigger?: React.ReactNode;
}

export function CreateBookmarkDialog({ onCreate, trigger }: CreateBookmarkDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!isSubmitting) {
      setOpen(open);
    }
  };

  const handleCreateBookmark = async (bookmark: Partial<Bookmark>, tags: Tag[]) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // 创建书签
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          title: bookmark.title,
          url: bookmark.url,
          description: bookmark.description || ''
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create bookmark');
      }
      
      const data = await response.json();
      const newBookmarkId = data.id;
      
      // 添加标签到书签
      if (tags.length > 0) {
        for (const tag of tags) {
          await addTagToBookmark(user.uid, newBookmarkId, tag.id);
        }
      }
      
      toast({
        title: '书签已创建',
        description: `书签 "${bookmark.title}" 已成功创建`,
      });
      
      // 发布书签创建事件
      eventService.publish(EVENTS.BOOKMARKS_IMPORTED);
      
      // 调用onCreate回调
      if (onCreate) {
        onCreate();
      }
      
      // 关闭对话框
      setOpen(false);
    } catch (error) {
      console.error('Error creating bookmark:', error);
      
      toast({
        title: '创建书签失败',
        description: error instanceof Error ? error.message : '创建书签时出错',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            添加书签
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加新书签</DialogTitle>
          <DialogDescription>
            添加新的网站书签到您的收藏中
          </DialogDescription>
        </DialogHeader>
        
        <BookmarkForm
          onSubmit={handleCreateBookmark}
          isSubmitting={isSubmitting}
          submitLabel="添加书签"
        />
      </DialogContent>
    </Dialog>
  );
} 