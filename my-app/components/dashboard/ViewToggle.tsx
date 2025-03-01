'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { List, Grid3X3, Clock } from 'lucide-react'

export function ViewToggle() {
  const [activeView, setActiveView] = useState<'list' | 'grid' | 'timeline'>('list');

  return (
    <div className="flex items-center bg-gray-100 p-1 rounded-md">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setActiveView('list')}
        className={`h-8 px-3 flex items-center gap-1.5 rounded-md transition-colors duration-200 ${
          activeView === 'list' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline text-sm font-medium">列表视图</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setActiveView('grid')}
        className={`h-8 px-3 flex items-center gap-1.5 rounded-md transition-colors duration-200 ${
          activeView === 'grid' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Grid3X3 className="h-4 w-4" />
        <span className="hidden sm:inline text-sm font-medium">脑图视图</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setActiveView('timeline')}
        className={`h-8 px-3 flex items-center gap-1.5 rounded-md transition-colors duration-200 ${
          activeView === 'timeline' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Clock className="h-4 w-4" />
        <span className="hidden sm:inline text-sm font-medium">时间轴</span>
      </Button>
    </div>
  )
} 