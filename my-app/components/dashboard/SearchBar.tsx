'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function SearchBar() {
  return (
    <div className="relative w-full md:w-[400px] lg:w-[500px]">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
      <Input
        type="search"
        placeholder="搜索书签..."
        className="pl-9 h-10 w-full border border-gray-200 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 dark:focus:border-blue-600 focus:outline-none transition-all duration-200"
      />
    </div>
  )
} 