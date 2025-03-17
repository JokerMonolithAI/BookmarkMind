'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // 在组件挂载时检查系统主题和本地存储的主题
  useEffect(() => {
    // 检查本地存储
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    
    // 如果有存储的主题，使用它
    if (storedTheme) {
      setTheme(storedTheme)
      document.documentElement.classList.toggle('dark', storedTheme === 'dark')
    } 
    // 否则检查系统主题
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    }
  }, [])

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    
    // 更新DOM
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    
    // 保存到本地存储
    localStorage.setItem('theme', newTheme)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="h-9 w-9 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {theme === 'light' ? (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            )}
            <span className="sr-only">切换主题</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>切换{theme === 'light' ? '暗色' : '亮色'}模式</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 