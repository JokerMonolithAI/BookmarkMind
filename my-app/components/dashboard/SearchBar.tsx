'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function SearchBar() {
  return (
    <div className="relative w-full md:w-[300px]">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="search"
        placeholder="搜索书签..."
        className="pl-9 h-10 w-full border border-gray-200 rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all duration-200"
      />
    </div>
  )
} 