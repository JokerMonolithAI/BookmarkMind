'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  List as ListIcon, 
  Network as NetworkIcon, 
  Clock as ClockIcon 
} from 'lucide-react'

export function ViewToggle() {
  const [view, setView] = useState<'list' | 'mind-map' | 'timeline'>('list')

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-white p-1">
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setView('list')}
      >
        <ListIcon className="mr-2 h-4 w-4" />
        列表视图
      </Button>
      <Button
        variant={view === 'mind-map' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setView('mind-map')}
      >
        <NetworkIcon className="mr-2 h-4 w-4" />
        脑图视图
      </Button>
      <Button
        variant={view === 'timeline' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setView('timeline')}
      >
        <ClockIcon className="mr-2 h-4 w-4" />
        时间轴
      </Button>
    </div>
  )
} 