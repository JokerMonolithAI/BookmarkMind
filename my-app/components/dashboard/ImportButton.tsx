'use client'

import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'

export function ImportButton() {
  const handleImport = () => {
    // 这里将来实现书签导入逻辑
    console.log('Import bookmarks')
  }

  return (
    <Button onClick={handleImport}>
      <PlusIcon className="mr-2 h-4 w-4" />
      导入书签
    </Button>
  )
} 