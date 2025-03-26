'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserTags, Tag } from '@/lib/supabaseTagService';
import { Loader2, Tag as TagIcon, Bookmark, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function DashboardTagsList() {
  const { user } = useAuth();
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取标签数据
  const fetchTags = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const tagsData = await getUserTags(user.id);
      setTags(tagsData);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [user]);

  // 排序标签 - 默认按使用频率排序
  const sortedTags = [...tags].sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="text-center py-12">
        <TagIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          还没有标签
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1 mb-4">
          标签可以帮助您更好地组织和查找书签
        </p>
        <Link href="/tags">
          <Button 
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            管理标签
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sortedTags.map((tag) => (
        <div 
          key={tag.id} 
          onClick={() => router.push(`/tags/${tag.id}`)} 
          className="cursor-pointer"
        >
          <div 
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
                <span>{formatDate(tag.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
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

// 格式化日期
function formatDate(timestamp: number): string {
  if (!timestamp) return '未知时间';
  
  const date = new Date(timestamp);
  return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
} 