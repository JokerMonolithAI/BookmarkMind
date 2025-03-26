'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { createCollection } from '@/lib/supabaseCollectionService';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// 推荐的收藏集名称
const SUGGESTED_COLLECTION_NAMES = [
  { name: "AI工具集", description: "收集各类AI工具、模型和应用" },
  { name: "AI学习路径", description: "存放AI学习资源、教程和论文" },
  { name: "AI提示词库", description: "收集有效的提示词和提示工程技巧" },
  { name: "考试备考", description: "适合存放考试资料、习题和备考策略" },
  { name: "语言学习", description: "收集语言学习资源、词汇和练习材料" },
  { name: "职业发展", description: "存放职业规划、简历模板和面试技巧" },
  { name: "创意项目", description: "收集DIY项目、手工艺和创意灵感" },
  { name: "健康生活", description: "收集健康知识、锻炼计划和饮食建议" },
  { name: "每日精选", description: "收集每日值得阅读的文章和新闻" },
  { name: "深度阅读", description: "存放长篇文章、研究报告和深度分析" },
];

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateCollectionDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 重置表单
  const resetForm = () => {
    setName('');
    setDescription('');
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
      setError('收藏集名称不能为空');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      await createCollection(user.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      
      resetForm();
      onCreated();
    } catch (error) {
      console.error('Error creating collection:', error);
      setError('创建收藏集失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 选择推荐的收藏集名称
  const handleSelectSuggestion = (suggestion: { name: string; description: string }) => {
    setName(suggestion.name);
    setDescription(suggestion.description);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>新建收藏集</DialogTitle>
            <DialogDescription>
              创建一个新的收藏集来组织您的书签。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="name" className="required">
                  收藏集名称
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-2 text-xs"
                      type="button"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      推荐名称
                      <ChevronDown className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 max-h-80 overflow-auto">
                    {SUGGESTED_COLLECTION_NAMES.map((suggestion, index) => (
                      <DropdownMenuItem 
                        key={index}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="flex flex-col items-start p-2.5 cursor-pointer"
                      >
                        <span className="font-medium text-sm">{suggestion.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{suggestion.description}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入收藏集名称"
                className="col-span-3"
                autoFocus
                maxLength={50}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">
                描述 <span className="text-gray-400 text-sm">(可选)</span>
              </Label>
              <Textarea
                id="description"
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