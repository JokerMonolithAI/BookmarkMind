'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { Folder, createFolder } from '@/lib/collectionService';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  folders: Folder[];
  onCreated: () => void;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  collectionId,
  folders,
  onCreated,
}: CreateFolderDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 重置表单
  const resetForm = () => {
    setName('');
    setParentId(undefined);
    setError('');
  };

  // 处理对话框关闭
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
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
      setError('文件夹名称不能为空');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      // 创建文件夹数据对象
      const folderData: { name: string; parentId?: string } = {
        name: name.trim(),
      };
      
      // 只有当parentId有值且不是'root'时才添加parentId属性
      if (parentId && parentId !== 'root') {
        folderData.parentId = parentId;
      }
      
      await createFolder(user.id, collectionId, folderData);
      
      resetForm();
      onCreated();
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('创建文件夹失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取可选的父文件夹列表
  const parentFolders = folders.filter(folder => {
    // 排除自身作为父文件夹
    return true; // 这里可以添加更复杂的逻辑，例如防止循环引用
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
            <DialogDescription>
              在收藏集中创建一个新的文件夹来组织您的书签。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name" className="required">
                文件夹名称
              </Label>
              <Input
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入文件夹名称"
                className="col-span-3"
                autoFocus
                maxLength={50}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parent-folder">
                父文件夹 <span className="text-gray-400 text-sm">(可选)</span>
              </Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger id="parent-folder">
                  <SelectValue placeholder="选择父文件夹" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">根目录</SelectItem>
                  {parentFolders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 