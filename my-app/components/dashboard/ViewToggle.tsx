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
    <div className="flex items-center gap-2">
      <Button
        variant={view === 'list' ? 'outline' : 'ghost'}
        onClick={() => setView('list')}
      >
        <ListIcon className="mr-2 h-4 w-4" />
        列表视图
      </Button>
      <Button
        variant={view === 'mind-map' ? 'outline' : 'ghost'}
        onClick={() => setView('mind-map')}
      >
        <NetworkIcon className="mr-2 h-4 w-4" />
        脑图视图
      </Button>
      <Button
        variant={view === 'timeline' ? 'outline' : 'ghost'}
        onClick={() => setView('timeline')}
      >
        <ClockIcon className="mr-2 h-4 w-4" />
        时间轴
      </Button>
    </div>
  )
} 