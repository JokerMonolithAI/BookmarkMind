'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bookmark } from '@/lib/bookmarkService';
import { Tag, getBookmarkTags, addTagToBookmark, removeTagFromBookmark } from '@/lib/tagService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { TagSelector } from '@/components/tags/TagSelector';

interface BookmarkFormProps {
  bookmark?: Partial<Bookmark>;
  onSubmit: (bookmark: Partial<Bookmark>, tags: Tag[]) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function BookmarkForm({ 
  bookmark, 
  onSubmit, 
  isSubmitting = false,
  submitLabel = '保存'
}: BookmarkFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(bookmark?.title || '');
  const [url, setUrl] = useState(bookmark?.url || '');
  const [description, setDescription] = useState(bookmark?.description || '');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    url?: string;
  }>({});

  // 如果是编辑模式，获取书签的标签
  useEffect(() => {
    if (user && bookmark?.id) {
      const fetchTags = async () => {
        try {
          setIsLoadingTags(true);
          const tags = await getBookmarkTags(user.uid, bookmark.id);
          setSelectedTags(tags);
        } catch (error) {
          console.error('Error fetching bookmark tags:', error);
        } finally {
          setIsLoadingTags(false);
        }
      };
      
      fetchTags();
    }
  }, [user, bookmark?.id]);

  // 从URL自动提取标题
  useEffect(() => {
    if (url && !title && !isSubmitting) {
      // 只有在用户填写了URL但没有填写标题时才尝试获取
      const fetchTitle = async () => {
        try {
          const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
          const data = await response.json();
          
          if (data.title) {
            setTitle(data.title);
          }
          
          if (data.description && !description) {
            setDescription(data.description);
          }
        } catch (error) {
          console.error('Error fetching title:', error);
        }
      };
      
      fetchTitle();
    }
  }, [url, title, description, isSubmitting]);

  const handleTagsChange = (tags: Tag[]) => {
    setSelectedTags(tags);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证表单
    const newErrors: {
      title?: string;
      url?: string;
    } = {};
    
    if (!title.trim()) {
      newErrors.title = '请输入标题';
    }
    
    if (!url.trim()) {
      newErrors.url = '请输入URL';
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // 简单的URL验证，确保以http://或https://开头
      newErrors.url = '请输入有效的URL（以http://或https://开头）';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    // 提交表单
    await onSubmit(
      {
        ...bookmark,
        title,
        url,
        description: description.trim() || undefined
      }, 
      selectedTags
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">标题 *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入书签标题"
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="url">URL *</Label>
        <Input
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="输入书签URL（以http://或https://开头）"
          disabled={isSubmitting}
        />
        {errors.url && (
          <p className="text-sm text-red-500">{errors.url}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="输入书签描述（可选）"
          disabled={isSubmitting}
          className="min-h-[100px]"
        />
      </div>
      
      <div className="space-y-2">
        <Label>标签</Label>
        <TagSelector
          selectedTags={selectedTags}
          onTagsChange={handleTagsChange}
        />
      </div>
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            保存中...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
} 