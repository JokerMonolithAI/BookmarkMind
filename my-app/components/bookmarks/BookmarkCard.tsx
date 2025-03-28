'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Bookmark, 
  ExternalLink, 
  MoreVertical, 
  Trash2, 
  Star, 
  Clock,
  Loader2,
  Edit
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Bookmark as BookmarkType, deleteBookmark } from '@/lib/supabaseBookmarkService';
import { removeBookmarkFromCollection } from '@/lib/supabaseCollectionService';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { extractDomain, truncateText } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { eventService, EVENTS } from '@/lib/eventService';
import { Tag, getBookmarkTags } from '@/lib/supabaseTagService';
import { EditBookmarkDialog } from './EditBookmarkDialog';

interface BookmarkCardProps {
  bookmark: Omit<BookmarkType, 'createdAt'> & {
    createdAt: string | number;
  };
  viewMode?: 'grid' | 'list';
  onDeleted?: () => void;
  collectionId?: string;
}

export function BookmarkCard({ bookmark, viewMode = 'grid', onDeleted, collectionId }: BookmarkCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  
  // 格式化更新时间
  const formattedDate = bookmark.updatedAt 
    ? formatDistanceToNow(new Date(bookmark.updatedAt), { addSuffix: true, locale: zhCN })
    : '未知时间';
  
  // 提取域名
  const domain = extractDomain(bookmark.url);
  
  // 处理点击书签
  const handleBookmarkClick = () => {
    window.open(bookmark.url, '_blank');
  };
  
  // 处理删除书签
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };
  
  // 确认删除书签
  const confirmDelete = async () => {
    if (!user) return;
    
    try {
      setIsDeleting(true);
      
      // 如果提供了收藏集ID，只从收藏集中移除书签
      if (collectionId) {
        await removeBookmarkFromCollection(user.id, collectionId, bookmark.id);
        
        // 显示成功提示
        toast({
          title: "书签已移除",
          description: "书签已从收藏集中移除",
        });
      } else {
        // 否则删除书签数据
        await deleteBookmark(user.id, bookmark.id);
        
        // 显示成功提示
        toast({
          title: "书签已删除",
          description: "书签已成功删除",
        });
      }
      
      // 发布书签删除事件，通知其他组件刷新
      eventService.publish(EVENTS.BOOKMARK_DELETED, { bookmarkId: bookmark.id });
      
      // 调用父组件提供的回调函数
      if (onDeleted) {
        onDeleted();
      }
      
      // 强制刷新页面
      router.refresh();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast({
        title: collectionId ? "移除书签失败" : "删除书签失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // 生成随机渐变背景色
  const getGradientClass = () => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-green-500 to-teal-600',
      'from-purple-500 to-pink-600',
      'from-yellow-500 to-orange-600',
      'from-red-500 to-pink-600',
      'from-indigo-500 to-purple-600',
    ];
    
    // 使用书签ID的哈希值来确定渐变色，确保同一书签始终使用相同的渐变色
    const hashCode = bookmark.id.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return gradients[hashCode % gradients.length];
  };
  
  // 获取书签的标签
  useEffect(() => {
    const fetchTags = async () => {
      if (!user) return;
      
      try {
        setIsLoadingTags(true);
        const bookmarkTags = await getBookmarkTags(user.id, bookmark.id);
        setTags(bookmarkTags);
      } catch (error) {
        console.error('Error fetching bookmark tags:', error);
      } finally {
        setIsLoadingTags(false);
      }
    };

    fetchTags();
  }, [user, bookmark.id]);
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsEditDialogOpen(true);
  };
  
  // 网格视图
  if (viewMode === 'grid') {
    return (
      <>
        <Card className="h-full transition-shadow hover:shadow-md">
          <div 
            className="flex flex-col h-full cursor-pointer"
            onClick={handleBookmarkClick}
          >
            <div className={`h-2 bg-gradient-to-r ${getGradientClass()}`}></div>
            <CardContent className="p-4 pb-0">
              <div className="flex justify-between items-start">
                <h3 className="font-medium line-clamp-1 mb-1" title={bookmark.title}>
                  {bookmark.title}
                </h3>
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEditClick}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>编辑</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDeleteClick}
                      className="text-red-600 hover:text-red-700 focus:text-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>删除</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {bookmark.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                  {bookmark.description}
                </p>
              )}
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                <ExternalLink className="h-3 w-3 mr-1" />
                <span className="truncate">{domain}</span>
              </div>
              
              {/* 显示标签 */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 mb-3">
                  {tags.map(tag => (
                    <div
                      key={tag.id}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ 
                        backgroundColor: `${tag.bgColor}20`,
                        color: tag.bgColor
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/tags/${tag.id}`);
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: tag.bgColor }} />
                      {tag.name}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                {/* 移除左侧内容 */}
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>{formattedDate}</span>
              </div>
            </CardFooter>
          </div>
        </Card>
        
        {/* 删除确认对话框 */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认{collectionId ? '移除' : '删除'}</AlertDialogTitle>
              <AlertDialogDescription>
                您确定要{collectionId ? '从收藏集中移除' : '删除'}书签 "{bookmark.title}" 吗？{!collectionId && '此操作无法撤销。'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {collectionId ? '移除中...' : '删除中...'}
                  </>
                ) : (
                  collectionId ? '移除' : '删除'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* 编辑书签对话框 */}
        <EditBookmarkDialog
          bookmark={bookmark}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onUpdated={onDeleted}
        />
      </>
    );
  }
  
  // 列表视图
  return (
    <>
      <div 
        className="flex items-center border rounded-md p-3 hover:shadow-sm transition-shadow duration-200 cursor-pointer bg-white dark:bg-gray-800"
        onClick={handleBookmarkClick}
      >
        <div className={`w-1 self-stretch rounded-full bg-gradient-to-b ${getGradientClass()} mr-3`}></div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
              {bookmark.title}
            </h3>
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEditClick}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>编辑</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDeleteClick}
                  className="text-red-600 hover:text-red-700 focus:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>删除</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
            {domain}
          </div>
          
          {/* 显示标签 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ 
                    backgroundColor: `${tag.bgColor}20`,
                    color: tag.bgColor
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/tags/${tag.id}`);
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: tag.bgColor }} />
                  {tag.name}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center text-xs text-gray-500 mt-2">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
      
      {/* 删除确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认{collectionId ? '移除' : '删除'}</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要{collectionId ? '从收藏集中移除' : '删除'}书签 "{bookmark.title}" 吗？{!collectionId && '此操作无法撤销。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {collectionId ? '移除中...' : '删除中...'}
                </>
              ) : (
                collectionId ? '移除' : '删除'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 编辑书签对话框 */}
      <EditBookmarkDialog
        bookmark={bookmark}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdated={onDeleted}
      />
    </>
  );
} 