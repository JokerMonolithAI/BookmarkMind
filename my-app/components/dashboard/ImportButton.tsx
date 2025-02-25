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
              <Button variant="outline" size="sm" className="h-8 gap-1 transition-all hover:bg-primary hover:text-primary-foreground">
                <Import className="h-4 w-4" />
                <span className="hidden sm:inline">导入</span>
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="sm:max-w-[500px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-xl"
            >
              <DialogHeader className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <FileUp className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-center text-xl">导入书签</DialogTitle>
                <DialogDescription className="text-center">
                  从浏览器导出的书签文件中导入到您的收藏中
                </DialogDescription>
              </DialogHeader>
              
              <div className="my-2 rounded-lg bg-muted/70 p-3">
                <div className="flex items-start gap-2.5">
                  <Info className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
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
                  className="w-full sm:w-auto"
                >
                  取消
                </Button>
                <div className="text-xs text-muted-foreground sm:ml-auto sm:text-right">
                  导入后，您可以随时编辑或删除书签
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>导入浏览器书签</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 