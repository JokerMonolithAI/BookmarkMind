'use client'

import { useState } from 'react';
import { FileText } from 'lucide-react';

interface BookmarkListProps {
  searchQuery?: string;
  sortOption?: 'date' | 'title';
  timeRange?: 'all' | 'today' | 'week' | 'month';
}

export default function BookmarkList({
  searchQuery = '',
  sortOption = 'date',
  timeRange = 'all'
}: BookmarkListProps) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="text-center py-8">
      <FileText className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">正在开发中</h3>
      <p className="text-gray-500 dark:text-gray-400 mt-1">
        书签列表功能即将上线
      </p>
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>搜索词: {searchQuery || '无'}</p>
        <p>排序方式: {sortOption}</p>
        <p>时间范围: {timeRange}</p>
      </div>
    </div>
  );
} 