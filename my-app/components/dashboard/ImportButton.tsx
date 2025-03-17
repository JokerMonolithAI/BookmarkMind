'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Import, FileUp, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog"
import BookmarkImport from './BookmarkImport'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { eventService, EVENTS } from '@/lib/eventService'

// 使用默认导出
export default function ImportButton() {
  const [open, setOpen] = useState(false);
  const importSuccessRef = useRef(false);

  // 处理弹窗关闭
  const handleOpenChange = (newOpen: boolean) => {
    // 如果是关闭弹窗，并且有导入成功的标记，则刷新书签列表
    if (!newOpen && importSuccessRef.current) {
      // 重置标记
      importSuccessRef.current = false;
      // 发布事件
      eventService.publish(EVENTS.BOOKMARKS_IMPORTED);
    }
    setOpen(newOpen);
  };

  // 监听导入成功事件
  const handleImportSuccess = () => {
    importSuccessRef.current = true;
  };

  // 使用useEffect管理事件订阅
  useEffect(() => {
    // 订阅导入成功事件
    eventService.subscribe(EVENTS.BOOKMARKS_IMPORTED, handleImportSuccess);
    
    // 组件卸载时取消订阅
    return () => {
      eventService.unsubscribe(EVENTS.BOOKMARKS_IMPORTED, handleImportSuccess);
    };
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="h-10 px-3 py-2.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center rounded-full mr-2">
                  <svg className="w-4 h-4 text-[#1877F2] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="hidden sm:inline">导入书签</span>
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="sm:max-w-[500px] bg-white border-gray-100 shadow-sm rounded-xl"
            >
              <DialogHeader className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <FileUp className="h-6 w-6 text-blue-600" />
                </div>
                <DialogTitle className="text-center text-xl font-semibold text-gray-900">导入书签</DialogTitle>
                <DialogDescription className="text-center text-gray-500">
                  从浏览器导出的书签文件中导入到您的收藏中
                </DialogDescription>
              </DialogHeader>
              
              <div className="my-2 rounded-lg bg-gray-50 p-3">
                <div className="flex items-start gap-2.5">
                  <Info className="mt-0.5 h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">支持的格式</p>
                    <ul className="space-y-0.5 list-inside list-disc text-xs">
                      <li>Chrome/Edge 导出的 HTML 书签文件</li>
                      <li>Firefox 导出的 JSON 书签文件</li>
                      <li>Safari 导出的书签文件</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <BookmarkImport />
              
              <DialogFooter className="mt-2 flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto h-10 px-4 py-2.5 border border-transparent rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200"
                >
                  关闭
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-white text-gray-700 text-xs border border-gray-100 shadow-sm">
          <p>导入浏览器书签</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 