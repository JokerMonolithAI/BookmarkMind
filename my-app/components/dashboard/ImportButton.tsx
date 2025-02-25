'use client'

import { useState, useMemo } from 'react'
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
import { useBookmarks } from '@/context/BookmarkContext'

// 添加一个生成唯一ID的函数
const generateUniqueId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function ImportButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [browserType, setBrowserType] = useState<BrowserType>('chrome')
  const [fileName, setFileName] = useState<string>('')
  const [bookmarks, setBookmarks] = useState<(Bookmark & { id: string })[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [step, setStep] = useState<'upload' | 'select'>('upload')
  const { saveBookmarks } = useBookmarks()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsLoading(true)
      const file = event.target.files?.[0]
      if (!file) return
      
      setFileName(file.name)
      const parsedBookmarks = await parseBookmarkFile(file, browserType)
      const bookmarksWithIds = parsedBookmarks.map(bookmark => ({
        ...bookmark,
        id: generateUniqueId()
      }))

      setBookmarks(bookmarksWithIds)
      setSelectedIds(bookmarksWithIds.map(b => b.id))
      setStep('select')
      
    } catch (error) {
      console.error('Import error:', error)
      toast.error('导入失败，请检查文件格式是否正确')
    } finally {
      setIsLoading(false)
      // 清空文件输入，以便可以再次选择同一文件
      event.target.value = ''
    }
  }

  const handleImport = async () => {
    try {
      setIsLoading(true)
      const selectedBookmarksList = bookmarks.filter(b => selectedIds.includes(b.id))
      
      const bookmarksRecord = selectedBookmarksList.reduce((acc, bookmark) => {
        acc[bookmark.id] = bookmark;
        return acc;
      }, {} as Record<string, Bookmark>);
      
      await saveBookmarks(bookmarksRecord, {});
      
      const response = await fetch('/api/bookmarks/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookmarks: selectedBookmarksList }),
      })

      if (!response.ok) throw new Error('Failed to import bookmarks')

      toast.success(`成功导入 ${selectedBookmarksList.length} 个书签`)
      setStep('upload')
      setFileName('')
      setBookmarks([])
      setSelectedIds([])
      
    } catch (error) {
      console.error('Import error:', error)
      toast.error('导入失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBookmark = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const toggleAll = () => {
    if (selectedIds.length === bookmarks.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(bookmarks.map(b => b.id))
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
                  checked={selectedIds.length === bookmarks.length && bookmarks.length > 0}
                  onClick={toggleAll}
                />
                <label
                  htmlFor="selectAll"
                  className="text-sm font-medium leading-none hover:cursor-pointer select-none"
                >
                  全选
                </label>
              </div>
              <span className="text-sm text-muted-foreground">
                已选择 {selectedIds.length} / {bookmarks.length} 个书签
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="space-y-2 px-1">
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                    onClick={() => toggleBookmark(bookmark.id)}
                  >
                    <Checkbox
                      id={bookmark.id}
                      checked={selectedIds.includes(bookmark.id)}
                    />
                    <div className="flex-1 min-w-0 select-none">
                      <div className="text-sm font-medium leading-none">
                        {bookmark.title}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
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
                disabled={isLoading || selectedIds.length === 0}
              >
                {isLoading ? '导入中...' : `导入 ${selectedIds.length} 个书签`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 