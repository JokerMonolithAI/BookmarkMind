'use client'

import { useState } from 'react'
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

// 使用默认导出
export default function ImportButton() {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="h-10 px-3 py-2.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
              >
                <Import className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">导入</span>
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
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto h-10 px-4 py-2.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors duration-200"
                >
                  取消
                </Button>
                <Button
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto h-10 px-4 py-2.5 border border-transparent rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200"
                >
                  确认导入
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