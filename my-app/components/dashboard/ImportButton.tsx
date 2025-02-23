'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlusIcon, Upload, FileIcon, ChevronLeft } from 'lucide-react'
import { parseBookmarkFile } from '@/lib/utils/bookmarkParser'
import { BrowserType, Bookmark } from '@/types/bookmark'
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from 'sonner'

export function ImportButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [browserType, setBrowserType] = useState<BrowserType>('chrome')
  const [fileName, setFileName] = useState<string>('')
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set())
  const [step, setStep] = useState<'upload' | 'select'>('upload')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsLoading(true)
      const file = event.target.files?.[0]
      if (!file) return
      
      setFileName(file.name)
      const parsedBookmarks = await parseBookmarkFile(file, browserType)
      setBookmarks(parsedBookmarks)
      // 默认全选
      setSelectedBookmarks(new Set(parsedBookmarks.map(b => b.url)))
      setStep('select')
      
    } catch (error) {
      console.error('Import error:', error)
      toast.error('导入失败，请检查文件格式是否正确')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    try {
      setIsLoading(true)
      const selectedBookmarksList = bookmarks.filter(b => selectedBookmarks.has(b.url))
      
      const response = await fetch('/api/bookmarks/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookmarks: selectedBookmarksList }),
      })

      if (!response.ok) throw new Error('Failed to import bookmarks')

      toast.success(`成功导入 ${selectedBookmarksList.length} 个书签`)
      // 重置状态
      setStep('upload')
      setFileName('')
      setBookmarks([])
      setSelectedBookmarks(new Set())
      
    } catch (error) {
      console.error('Import error:', error)
      toast.error('导入失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBookmark = (url: string) => {
    const newSelected = new Set(selectedBookmarks)
    if (newSelected.has(url)) {
      newSelected.delete(url)
    } else {
      newSelected.add(url)
    }
    setSelectedBookmarks(newSelected)
  }

  const toggleAll = () => {
    if (selectedBookmarks.size === bookmarks.length) {
      setSelectedBookmarks(new Set())
    } else {
      setSelectedBookmarks(new Set(bookmarks.map(b => b.url)))
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <div className="flex items-center">
            {step === 'select' && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={() => setStep('upload')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-xl font-semibold">
              {step === 'upload' ? '导入书签' : '选择书签'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {step === 'upload' ? (
          <div className="grid gap-6 py-4 overflow-y-auto">
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
        ) : (
          <div className="flex flex-col flex-1 py-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="selectAll"
                  checked={selectedBookmarks.size === bookmarks.length}
                  onClick={toggleAll}
                />
                <label
                  htmlFor="selectAll"
                  className="text-sm font-medium leading-none"
                >
                  全选
                </label>
              </div>
              <span className="text-sm text-muted-foreground">
                已选择 {selectedBookmarks.size} / {bookmarks.length} 个书签
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="space-y-2 px-1">
                {bookmarks.map((bookmark, index) => (
                  <div
                    key={`${bookmark.url}-${bookmark.addedAt?.getTime() || index}`}
                    className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <Checkbox
                      id={`bookmark-${index}`}
                      checked={selectedBookmarks.has(bookmark.url)}
                      onClick={() => toggleBookmark(bookmark.url)}
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`bookmark-${index}`}
                        className="text-sm font-medium leading-none hover:cursor-pointer"
                      >
                        {bookmark.title}
                      </label>
                      <p className="text-sm text-muted-foreground truncate">
                        {bookmark.url}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end pt-4 border-t">
              <Button
                onClick={handleImport}
                disabled={isLoading || selectedBookmarks.size === 0}
              >
                {isLoading ? '导入中...' : `导入 ${selectedBookmarks.size} 个书签`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 