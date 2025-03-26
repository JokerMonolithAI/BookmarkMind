'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createTag, TAG_COLORS } from '@/lib/supabaseTagService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { eventService, EVENTS } from '@/lib/eventService';

interface CreateTagDialogProps {
  onCreated: () => void;
}

export function CreateTagDialog({ onCreated }: CreateTagDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('blue');
  const [customColor, setCustomColor] = useState(TAG_COLORS.blue.bg);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; color?: string }>({});

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // 重置表单状态
      setName('');
      setColor('blue');
      setCustomColor(TAG_COLORS.blue.bg);
      setErrors({});
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; color?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = '标签名称不能为空';
    }
    
    if (!color && !customColor) {
      newErrors.color = '请选择颜色';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      await createTag(user.id, {
        name,
        color,
        bgColor: customColor
      });
      
      toast({
        title: '标签已创建',
        description: `标签 "${name}" 已成功创建`,
      });
      
      // 发布标签更新事件
      eventService.publish(EVENTS.TAG_CREATED);
      
      onCreated();
      handleOpenChange(false);
    } catch (error) {
      console.error('Error creating tag:', error);
      
      toast({
        title: '创建标签失败',
        description: error instanceof Error ? error.message : '发生了未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="h-4 w-4" />
          新建标签
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>创建新标签</DialogTitle>
          <DialogDescription>
            创建新标签并设置名称和颜色。
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tag-name">标签名称</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入标签名称"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label>标签颜色</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TAG_COLORS).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setColor(key);
                    setCustomColor(value.bg);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    color === key ? 'ring-2 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: value.bg }}
                  disabled={isLoading}
                >
                  {color === key && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={value.text}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Label htmlFor="custom-color" className="shrink-0">自定义颜色</Label>
              <Input
                id="custom-color"
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setColor('custom');
                }}
                className="w-16 h-8 p-1"
                disabled={isLoading}
              />
            </div>
            
            {errors.color && (
              <p className="text-sm text-red-500">{errors.color}</p>
            )}
          </div>
          
          <div className="mt-2">
            <Label>预览</Label>
            <div 
              className="mt-1 p-2 rounded-md flex items-center gap-2"
              style={{ 
                backgroundColor: `${customColor}20`, 
                color: customColor 
              }}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: customColor }}></span>
              <span>{name || '标签名称'}</span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                创建中...
              </>
            ) : (
              '创建'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 