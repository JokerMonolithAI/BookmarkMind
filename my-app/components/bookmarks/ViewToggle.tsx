'use client'

import { useState, createContext, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { List, Grid } from 'lucide-react'

// 创建一个上下文来共享视图状态
export const ViewContext = createContext<{
  activeView: 'list' | 'grid';
  setActiveView: (view: 'list' | 'grid') => void;
}>({
  activeView: 'list',
  setActiveView: () => {},
});

// 自定义钩子，方便在其他组件中使用
export const useView = () => useContext(ViewContext);

export function ViewToggle() {
  const { activeView, setActiveView } = useView();

  // 处理视图切换
  const handleViewChange = (view: 'list' | 'grid') => {
    setActiveView(view);
  };

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-md">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleViewChange('list')}
        className={`h-8 px-3 flex items-center gap-1.5 rounded-md transition-colors duration-200 ${
          activeView === 'list'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline text-sm font-medium">列表视图</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleViewChange('grid')}
        className={`h-8 px-3 flex items-center gap-1.5 rounded-md transition-colors duration-200 ${
          activeView === 'grid'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        <Grid className="h-4 w-4" />
        <span className="hidden sm:inline text-sm font-medium">网格视图</span>
      </Button>
    </div>
  )
}

// 提供视图上下文的组件
export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<'list' | 'grid'>('list');
  
  return (
    <ViewContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </ViewContext.Provider>
  );
} 