'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (onSearch) {
      onSearch(value);
    }
  };
  
  return (
    <div className="relative w-full md:w-[400px] lg:w-[500px]">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
      <Input
        type="search"
        placeholder="搜索书签..."
        className="pl-9 h-10 w-full border border-gray-200 dark:border-gray-700 rounded-md shadow-sm bg-transparent text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 dark:focus:border-blue-600 focus:outline-none transition-all duration-200"
        value={query}
        onChange={handleSearch}
      />
    </div>
  )
} 