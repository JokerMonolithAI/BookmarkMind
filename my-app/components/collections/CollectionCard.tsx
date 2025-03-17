'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  FolderHeart, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Bookmark, 
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Collection, deleteCollection } from '@/lib/collectionService';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditCollectionDialog } from './EditCollectionDialog';
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

interface CollectionCardProps {
  collection: Collection;
  onDeleted: () => void;
}

export function CollectionCard({ collection, onDeleted }: CollectionCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 格式化更新时间
  const formattedDate = collection.updatedAt 
    ? formatDistanceToNow(new Date(collection.updatedAt), { addSuffix: true, locale: zhCN })
    : '未知时间';

  // 处理点击卡片
  const handleCardClick = () => {
    router.push(`/collections/${collection.id}`);
  };

  // 处理删除收藏集
  const handleDelete = async () => {
    if (!user) return;
    
    try {
      setIsDeleting(true);
      await deleteCollection(user.uid, collection.id);
      onDeleted();
    } catch (error) {
      console.error('Error deleting collection:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
          <div className="flex justify-between items-start">
            <div className="bg-white dark:bg-gray-800 rounded-full p-2">
              <FolderHeart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="text-white hover:bg-blue-600/20">
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
        </CardHeader>
        <div onClick={handleCardClick}>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
              {collection.name}
            </h3>
            {collection.description && (
              <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                {collection.description}
              </p>
            )}
          </CardContent>
          <CardFooter className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Bookmark className="h-4 w-4 mr-1" />
              <span>{collection.bookmarkCount || 0} 书签</span>
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formattedDate}</span>
            </div>
          </CardFooter>
        </div>
      </Card>

      {/* 编辑收藏集对话框 */}
      <EditCollectionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        collection={collection}
        onUpdated={onDeleted}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除收藏集 "{collection.name}" 吗？此操作无法撤销，收藏集中的所有文件夹和书签关联将被永久删除。
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