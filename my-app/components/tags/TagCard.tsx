'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Tag as TagIcon, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Bookmark, 
  Clock 
} from 'lucide-react';
import { Tag, deleteTag } from '@/lib/supabaseTagService';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditTagDialog } from './EditTagDialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TagCardProps {
  tag: Tag;
  onDeleted: () => void;
}

export function TagCard({ tag, onDeleted }: TagCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 格式化更新时间
  const formattedTime = tag.updatedAt 
    ? formatDistanceToNow(new Date(tag.updatedAt), { addSuffix: true, locale: zhCN })
    : '未知时间';

  // 处理点击卡片
  const handleCardClick = () => {
    router.push(`/tags/${tag.id}`);
  };

  // 处理删除标签
  const handleDelete = async () => {
    if (!user) return;
    
    try {
      setIsDeleting(true);
      await deleteTag(user.id, tag.id);
      onDeleted();
    } catch (error) {
      console.error('Error deleting tag:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // 处理标签更新
  const handleTagUpdated = () => {
    // 刷新标签数据但不触发删除
    router.refresh();
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white dark:bg-gray-800"
      >
        {/* 顶部带颜色的背景部分 */}
        <div 
          className="p-4 flex justify-between items-start"
          style={{ 
            background: `linear-gradient(to right, ${tag.bgColor}, ${adjustColor(tag.bgColor, 20)})` 
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-full p-2">
            <TagIcon className="h-6 w-6" style={{ color: tag.bgColor }} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setIsEditDialogOpen(true);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                <span>编辑</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }}
                className="text-red-600 hover:text-red-700 focus:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>删除</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* 标签名称和描述 */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {tag.name}
          </h3>
          <div 
            className="inline-flex items-center px-2 py-1 mt-2 rounded-full text-xs"
            style={{ 
              backgroundColor: `${tag.bgColor}20`, // 添加透明度
              color: tag.bgColor 
            }}
          >
            <TagIcon className="h-3 w-3 mr-1" />
            <span>#{tag.name}</span>
          </div>
        </div>
        
        {/* 底部信息区域 */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Bookmark className="h-4 w-4 mr-1" />
            <span>{tag.count || 0} 书签</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4 mr-1" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* 编辑标签对话框 */}
      <EditTagDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        tag={tag}
        onUpdated={handleTagUpdated}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除标签 "{tag.name}" 吗？此操作无法撤销，标签与书签的关联将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// 辅助函数：调整颜色亮度以创建渐变效果
function adjustColor(color: string, amount: number): string {
  // 如果颜色不是HEX格式，直接返回
  if (!color.startsWith('#')) return color;
  
  let hex = color.slice(1);
  
  // 处理3位颜色
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // 转换为RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // 调整亮度
  const newR = Math.min(255, Math.max(0, r + amount));
  const newG = Math.min(255, Math.max(0, g + amount));
  const newB = Math.min(255, Math.max(0, b + amount));
  
  // 转回HEX
  const newHex = '#' + 
    ((1 << 24) + (newR << 16) + (newG << 8) + newB)
      .toString(16)
      .slice(1);
  
  return newHex;
} 