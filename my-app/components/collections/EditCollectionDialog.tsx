'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { Collection, updateCollection } from '@/lib/supabaseCollectionService';
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
import { Textarea } from '@/components/ui/textarea';

interface EditCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection;
  onUpdated: () => void;
}

export function EditCollectionDialog({
  open,
  onOpenChange,
  collection,
  onUpdated,
}: EditCollectionDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 当收藏集数据变化时更新表单
  useEffect(() => {
    if (collection) {
      setName(collection.name || '');
      setDescription(collection.description || '');
    }
  }, [collection]);

  // 处理对话框关闭
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError('');
    }
    onOpenChange(open);
  };

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('用户未登录');
      return;
    }

    if (!name.trim()) {
      setError('收藏集名称不能为空');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      await updateCollection(user.id, collection.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      
      onUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating collection:', error);
      setError('更新收藏集失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>编辑收藏集</DialogTitle>
            <DialogDescription>
              修改收藏集的名称和描述。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="required">
                收藏集名称
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入收藏集名称"
                className="col-span-3"
                autoFocus
                maxLength={50}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">
                描述 <span className="text-gray-400 text-sm">(可选)</span>
              </Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入收藏集描述"
                className="col-span-3 resize-none"
                rows={3}
                maxLength={200}
              />
            </div>
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
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 