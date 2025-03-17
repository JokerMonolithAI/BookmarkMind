'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  SortAsc, 
  Clock, 
  Calendar, 
  CalendarDays, 
  CalendarRange, 
  CalendarClock,
  ChevronDown
} from 'lucide-react'

interface FilterBarProps {
  sortOption: 'date' | 'title';
  onSortChange: (option: 'date' | 'title') => void;
  timeRange: 'all' | 'today' | 'week' | 'month';
  onTimeRangeChange: (range: 'all' | 'today' | 'week' | 'month') => void;
}

export function FilterBar({ 
  sortOption, 
  onSortChange, 
  timeRange,
  onTimeRangeChange
}: FilterBarProps) {
  
  // 排序选项标签
  const getSortLabel = () => {
    switch (sortOption) {
      case 'date':
        return '按日期排序';
      case 'title':
        return '按标题排序';
      default:
        return '排序';
    }
  };
  
  // 时间范围标签
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'all':
        return '全部时间';
      case 'today':
        return '今天';
      case 'week':
        return '本周';
      case 'month':
        return '本月';
      default:
        return '时间范围';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* 排序下拉菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <SortAsc className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">{getSortLabel()}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onSortChange('date')}>
            <Clock className="h-4 w-4 mr-2" />
            <span>按日期排序</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange('title')}>
            <SortAsc className="h-4 w-4 mr-2" />
            <span>按标题排序</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* 时间范围下拉菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">{getTimeRangeLabel()}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onTimeRangeChange('all')}>
            <CalendarRange className="h-4 w-4 mr-2" />
            <span>全部时间</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTimeRangeChange('today')}>
            <CalendarClock className="h-4 w-4 mr-2" />
            <span>今天</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTimeRangeChange('week')}>
            <CalendarDays className="h-4 w-4 mr-2" />
            <span>本周</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTimeRangeChange('month')}>
            <Calendar className="h-4 w-4 mr-2" />
            <span>本月</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 