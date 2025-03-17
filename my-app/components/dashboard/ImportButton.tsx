'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { ref, push, set, update } from 'firebase/database'
import { toast } from '@/components/ui/use-toast'
import { eventService, EVENTS } from '@/lib/eventService'
import { Loader2 } from 'lucide-react'

export default function ImportButton() {
  const { user } = useAuth()
  const [isImporting, setIsImporting] = useState(false)

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    try {
      setIsImporting(true)
      
      // 读取文件内容
      const fileContent = await readFileAsText(file)
      
      // 解析书签
      const bookmarks = parseBookmarks(fileContent)
      
      if (bookmarks.length === 0) {
        toast({
          title: "导入失败",
          description: "未找到有效的书签",
          variant: "destructive",
        })
        return
      }
      
      // 保存到数据库
      await saveBookmarks(bookmarks)
      
      toast({
        title: "导入成功",
        description: `成功导入 ${bookmarks.length} 个书签`,
      })
      
      // 发布书签导入成功事件
      eventService.publish(EVENTS.BOOKMARKS_IMPORTED)
      
    } catch (error) {
      console.error('Error importing bookmarks:', error)
      toast({
        title: "导入失败",
        description: "处理书签文件时出错",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      // 重置文件输入
      event.target.value = ''
    }
  }

  // 读取文件内容
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = (e) => reject(e)
      reader.readAsText(file)
    })
  }

  // 解析书签
  const parseBookmarks = (content: string) => {
    const bookmarks: any[] = []
    
    // 简单解析 HTML 书签文件
    // 这里使用正则表达式匹配 <A> 标签
    const regex = /<A[^>]*HREF="([^"]*)"[^>]*>(.*?)<\/A>/gi
    let match
    
    while ((match = regex.exec(content)) !== null) {
      const url = match[1]
      const title = match[2].replace(/<[^>]*>/g, '').trim()
      
      if (url && title) {
        bookmarks.push({
          url,
          title,
          createdAt: Date.now(),
          addedAt: Date.now()
        })
      }
    }
    
    return bookmarks
  }

  // 保存书签到数据库
  const saveBookmarks = async (bookmarks: any[]) => {
    if (!user) return
    
    const timestamp = Date.now()
    const bookmarksRef = ref(db, `users/${user.uid}/bookmarks/bookmarks`)
    
    // 批量添加书签
    const promises = bookmarks.map(bookmark => {
      const newBookmarkRef = push(bookmarksRef)
      return set(newBookmarkRef, bookmark)
    })
    
    // 更新最后修改时间
    promises.push(
      update(ref(db, `users/${user.uid}/bookmarks`), {
        lastUpdated: timestamp
      })
    )
    
    await Promise.all(promises)
  }

  return (
    <div>
      <label>
        <input
          type="file"
          accept=".html"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isImporting}
        />
        <Button
          variant="outline"
          className="h-10 px-3 py-2.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          disabled={isImporting}
          asChild
        >
          <div className="flex items-center">
            {isImporting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                <span className="hidden sm:inline">导入中...</span>
              </>
            ) : (
              <>
                <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center rounded-full mr-2">
                  <svg className="w-4 h-4 text-[#1877F2] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="hidden sm:inline">导入书签</span>
              </>
            )}
          </div>
        </Button>
      </label>
    </div>
  )
} 