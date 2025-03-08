'use client'

import { useState, createContext, useContext, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { List, Grid3X3, Clock } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

// 创建一个上下文来共享视图状态
export const ViewContext = createContext<{
  activeView: 'list' | 'grid' | 'timeline';
  setActiveView: (view: 'list' | 'grid' | 'timeline') => void;
}>({
  activeView: 'list',
  setActiveView: () => {},
});

// 自定义钩子，方便在其他组件中使用
export const useView = () => useContext(ViewContext);

export function ViewToggle() {
  const { activeView, setActiveView } = useView();
  const router = useRouter();
  const pathname = usePathname();

  // 处理视图切换
  const handleViewChange = (view: 'list' | 'grid' | 'timeline') => {
    setActiveView(view);
    
    // 根据视图类型跳转到相应页面
    if (view === 'grid' && pathname !== '/mindmap') {
      router.push('/mindmap');
    } else if (view === 'list' && pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex items-center bg-gray-100 p-1 rounded-md">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleViewChange('list')}
        className={`h-8 px-3 flex items-center gap-1.5 rounded-md transition-colors duration-200 ${
          (activeView === 'list' || pathname === '/dashboard')
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
        onClick={() => handleViewChange('grid')}
        className={`h-8 px-3 flex items-center gap-1.5 rounded-md transition-colors duration-200 ${
          (activeView === 'grid' || pathname === '/mindmap')
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
        onClick={() => handleViewChange('timeline')}
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

// 提供视图上下文的组件
export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<'list' | 'grid' | 'timeline'>('list');
  const pathname = usePathname();
  
  // 根据当前路径设置初始视图
  useEffect(() => {
    if (pathname === '/mindmap') {
      setActiveView('grid');
    } else if (pathname === '/dashboard') {
      setActiveView('list');
    }
  }, [pathname]);
  
  return (
    <ViewContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </ViewContext.Provider>
  );
} 