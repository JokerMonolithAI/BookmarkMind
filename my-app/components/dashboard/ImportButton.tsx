'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlusIcon, Upload, FileIcon } from 'lucide-react'
import { parseBookmarkFile } from '@/lib/utils/bookmarkParser'
import { BrowserType } from '@/types/bookmark'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'

export function ImportButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [browserType, setBrowserType] = useState<BrowserType>('chrome')
  const [fileName, setFileName] = useState<string>('')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsLoading(true)
      const file = event.target.files?.[0]
      if (!file) return
      
      setFileName(file.name)
      const bookmarks = await parseBookmarkFile(file, browserType)

      const response = await fetch('/api/bookmarks/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookmarks }),
      })

      if (!response.ok) throw new Error('Failed to import bookmarks')

      toast.success(`成功导入 ${bookmarks.length} 个书签`)
      
    } catch (error) {
      console.error('Import error:', error)
      toast.error('导入失败，请检查文件格式是否正确')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:border-gray-800"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          导入书签
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">导入书签</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              选择浏览器
            </label>
            <Select
              value={browserType}
              onValueChange={(value: string) => setBrowserType(value as BrowserType)}
            >
              <SelectTrigger className="w-full bg-white dark:bg-gray-950">
                <SelectValue placeholder="选择浏览器类型" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-950">
                <SelectItem value="chrome">Chrome</SelectItem>
                <SelectItem value="firefox">Firefox</SelectItem>
                <SelectItem value="edge">Edge</SelectItem>
                <SelectItem value="safari">Safari</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              请选择书签来源的浏览器类型
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              上传书签文件
            </label>
            <div className="grid gap-2">
              <div className="rounded-lg border border-dashed p-4 hover:bg-gray-50 transition-colors">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('bookmarkFile')?.click()}
                  disabled={isLoading}
                  className="w-full h-24 flex flex-col items-center justify-center space-y-2"
                >
                  {fileName ? (
                    <>
                      <FileIcon className="h-8 w-8 text-blue-500" />
                      <span className="text-sm text-muted-foreground">{fileName}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8" />
                      <span className="text-sm text-muted-foreground">
                        {isLoading ? '导入中...' : '点击或拖拽文件到此处'}
                      </span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                支持 .html 或 .json 格式的书签文件
              </p>
            </div>
            <input
              id="bookmarkFile"
              type="file"
              accept=".html,.json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 