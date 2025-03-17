'use client'

import { useState } from 'react'
import { Brain, FolderHeart, Tag, Clock } from 'lucide-react'

type CategoryType = 'smart' | 'collections' | 'tags' | 'timeline'

interface CategoryTabsProps {
  onCategoryChange: (category: CategoryType) => void
}

export function CategoryTabs({ onCategoryChange }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('smart')

  const handleCategoryChange = (category: CategoryType) => {
    setActiveCategory(category)
    onCategoryChange(category)
  }

  return (
    <div className="flex items-center border-b border-gray-200 mb-4">
      <button
        onClick={() => handleCategoryChange('smart')}
        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
          activeCategory === 'smart'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        <Brain className="h-5 w-5" />
        <span className="font-medium">智能分类</span>
      </button>
      
      <button
        onClick={() => handleCategoryChange('collections')}
        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
          activeCategory === 'collections'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        <FolderHeart className="h-5 w-5" />
        <span className="font-medium">收藏集</span>
      </button>
      
      <button
        onClick={() => handleCategoryChange('tags')}
        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
          activeCategory === 'tags'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        <Tag className="h-5 w-5" />
        <span className="font-medium">标签</span>
      </button>
      
      <button
        onClick={() => handleCategoryChange('timeline')}
        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
          activeCategory === 'timeline'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        }`}
      >
        <Clock className="h-5 w-5" />
        <span className="font-medium">时间线</span>
      </button>
    </div>
  )
} 