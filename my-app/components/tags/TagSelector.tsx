'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Tag, getUserTags, createTag } from '@/lib/tagService';
import { Button } from '@/components/ui/button';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator 
} from '@/components/ui/command';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Check, Hash, PlusCircle, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // 获取用户的所有标签
  const fetchTags = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userTags = await getUserTags(user.uid);
      setTags(userTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [user]);

  // 创建新标签
  const handleCreateTag = async () => {
    if (!user || !newTagName.trim()) return;

    try {
      setIsLoading(true);
      const newTag = await createTag(user.uid, { 
        name: newTagName,
        color: 'blue'  // 添加默认颜色
      });
      setTags(prevTags => [...prevTags, newTag]);
      
      // 添加新创建的标签到已选标签中
      onTagsChange([...selectedTags, newTag]);
      
      // 重置新标签名称
      setNewTagName('');
    } catch (error) {
      console.error('Error creating tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 选择或取消选择标签
  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    
    if (isSelected) {
      // 如果已选择，则从选择列表中移除
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    } else {
      // 如果未选择，则添加到选择列表
      onTagsChange([...selectedTags, tag]);
    }
  };

  // 从已选标签中移除标签
  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedTags.length > 0 
                ? `已选择 ${selectedTags.length} 个标签` 
                : '选择标签'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder="搜索标签..." 
              value={newTagName}
              onValueChange={setNewTagName}
            />
            <CommandEmpty>
              {newTagName ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start pl-2"
                  onClick={handleCreateTag}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  创建标签 &quot;{newTagName}&quot;
                </Button>
              ) : (
                <div className="py-2 px-2 text-center text-sm">没有找到标签</div>
              )}
            </CommandEmpty>
            <CommandList>
              <CommandGroup heading="选择标签">
                <ScrollArea className="h-[200px]">
                  {tags.map(tag => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => toggleTag(tag)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.bgColor }}
                        />
                        <span>{tag.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {tag.count}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedTags.some(t => t.id === tag.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={handleCreateTag}
                  disabled={!newTagName.trim() || isLoading}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  创建新标签
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 显示已选标签 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedTags.map(tag => (
            <Badge
              key={tag.id}
              variant="outline"
              className="gap-1 pl-1.5 pr-1"
              style={{ 
                backgroundColor: `${tag.bgColor}20`,
                color: tag.bgColor,
                borderColor: `${tag.bgColor}40`
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.bgColor }} />
              {tag.name}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 rounded-full p-0 hover:bg-transparent"
                onClick={() => removeTag(tag.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
} 