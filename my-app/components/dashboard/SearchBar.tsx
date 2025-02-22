'use client'

import { Input } from '@/components/ui/input'
import { SearchIcon } from 'lucide-react'

export function SearchBar() {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="search"
        placeholder="搜索书签..."
        className="pl-10 w-[300px]"
      />
    </div>
  )
} 