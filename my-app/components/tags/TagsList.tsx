'use client';

import { useCallback, useEffect, useState } from 'react';
import { Tag, deleteTag } from '@/lib/tagService';
import { TagCard } from './TagCard';
import { CreateTagDialog } from './CreateTagDialog';
import { useAuth } from '@/context/AuthContext';
import { Loader2, SortAsc, Hash, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { eventService, EVENTS } from '@/lib/eventService';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagsListProps {
  initialTags: Tag[];
  fetchTags: () => Promise<Tag[]>;
  onSearchChange?: (query: string) => void;
  isLoading?: boolean;
  error?: string;
}

type SortOption = 'count' | 'name';

export function TagsList({ 
  initialTags, 
  fetchTags, 
  onSearchChange,
  isLoading = false, 
  error 
}: TagsListProps) {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>(initialTags || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('count');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshTags = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsRefreshing(true);
      const updatedTags = await fetchTags();
      setTags(updatedTags);
    } catch (error) {
      console.error('Error refreshing tags:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user, fetchTags]);

  useEffect(() => {
    const handleTagCreated = () => {
      refreshTags();
    };

    const handleTagDeleted = () => {
      refreshTags();
    };

    const handleTagUpdated = () => {
      refreshTags();
    };

    eventService.subscribe(EVENTS.TAG_CREATED, handleTagCreated);
    eventService.subscribe(EVENTS.TAG_DELETED, handleTagDeleted);
    eventService.subscribe(EVENTS.TAG_UPDATED, handleTagUpdated);

    return () => {
      eventService.unsubscribe(EVENTS.TAG_CREATED, handleTagCreated);
      eventService.unsubscribe(EVENTS.TAG_DELETED, handleTagDeleted);
      eventService.unsubscribe(EVENTS.TAG_UPDATED, handleTagUpdated);
    };
  }, [refreshTags]);

  useEffect(() => {
    setTags(initialTags || []);
  }, [initialTags]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearchChange) {
      onSearchChange(query);
    }
  };

  const handleTagDeleted = async (tagId: string) => {
    if (!user) return;
    
    try {
      await deleteTag(user.uid, tagId);
      toast({
        title: '标签已删除',
        description: '标签已成功删除',
      });
      eventService.publish(EVENTS.TAG_DELETED);
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: '删除标签失败',
        description: error instanceof Error ? error.message : '删除标签时出错',
        variant: 'destructive',
      });
    }
  };

  const sortTags = (tags: Tag[]): Tag[] => {
    return [...tags].sort((a, b) => {
      if (sortBy === 'count') {
        return b.count - a.count;
      } else {
        return a.name.localeCompare(b.name, 'zh-CN');
      }
    });
  };

  const filteredTags = sortTags(tags);
  const loading = isLoading || isRefreshing;

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>加载失败</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TagIcon className="h-5 w-5" />
          我的标签
        </h2>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto min-w-[200px]">
            <Hash className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索标签..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-8"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <SortAsc className="h-4 w-4" />
                {sortBy === 'count' ? '按使用频率' : '按名称'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('count')}>
                按使用频率
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                按名称
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <CreateTagDialog onCreated={refreshTags} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <div className="flex justify-center mb-2">
            <TagIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">没有找到标签</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? '没有匹配搜索条件的标签' : '您还没有创建任何标签'}
          </p>
          {!searchQuery && <CreateTagDialog onCreated={refreshTags} />}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTags.map((tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              onDeleted={() => handleTagDeleted(tag.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
} 