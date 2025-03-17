'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { ref, get } from 'firebase/database'
import { 
  Home, 
  Bookmark, 
  FolderHeart, 
  Tag, 
  Clock, 
  Brain, 
  BarChart, 
  ChevronDown, 
  ChevronRight,
  FolderOpen,
  Hash
} from 'lucide-react'

interface Collection {
  id: string;
  name: string;
  count: number;
}

interface TagItem {
  id: string;
  name: string;
  count: number;
}

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [collections, setCollections] = useState<Collection[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [collectionsOpen, setCollectionsOpen] = useState(true)
  const [tagsOpen, setTagsOpen] = useState(true)

  // 获取收藏集数据
  useEffect(() => {
    if (!user) return

    const fetchCollections = async () => {
      try {
        // 这里是模拟数据，实际项目中应该从数据库获取
        const mockCollections = [
          { id: 'dev-resources', name: '开发资源', count: 8 },
          { id: 'learning', name: '学习资料', count: 5 },
          { id: 'work', name: '工作项目', count: 12 }
        ]
        setCollections(mockCollections)
      } catch (error) {
        console.error('Error fetching collections:', error)
      }
    }

    fetchCollections()
  }, [user])

  // 获取标签数据
  useEffect(() => {
    if (!user) return

    const fetchTags = async () => {
      try {
        // 这里是模拟数据，实际项目中应该从数据库获取
        const mockTags = [
          { id: 'dev', name: '开发', count: 15 },
          { id: 'ai', name: 'AI', count: 7 },
          { id: 'tools', name: '工具', count: 10 }
        ]
        setTags(mockTags)
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    }

    fetchTags()
  }, [user])

  // 导航项组件
  const NavItem = ({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) => {
    const isActive = pathname === href
    
    return (
      <Link 
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
          isActive 
            ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-400' 
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        }`}
      >
        {icon}
        <span>{children}</span>
      </Link>
    )
  }

  return (
    <div className="w-64 h-screen border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* 应用标题和图标 */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <Link href="/dashboard" className="flex items-center text-[#1877F2] font-bold">
          <svg className="w-10 h-10 text-[#1877F2] dark:text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-2xl">BookmarkMind</span>
        </Link>
      </div>
      
      {/* 导航菜单 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <NavItem href="/dashboard" icon={<Home className="h-5 w-5" />}>主页</NavItem>
        <NavItem href="/bookmarks" icon={<Bookmark className="h-5 w-5" />}>所有书签</NavItem>
        <NavItem href="/collections" icon={<FolderHeart className="h-5 w-5" />}>收藏集</NavItem>
        <NavItem href="/tags" icon={<Tag className="h-5 w-5" />}>标签</NavItem>
        <NavItem href="/recent" icon={<Clock className="h-5 w-5" />}>最近添加</NavItem>
        <NavItem href="/smart" icon={<Brain className="h-5 w-5" />}>智能分类</NavItem>
        <NavItem href="/stats" icon={<BarChart className="h-5 w-5" />}>统计分析</NavItem>
        <NavItem href="/mindmap" icon={<Brain className="h-5 w-5" />}>知识图谱</NavItem>
        
        {/* 收藏集 */}
        <div className="mt-6">
          <button 
            onClick={() => setCollectionsOpen(!collectionsOpen)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-200"
          >
            <span>收藏集</span>
            {collectionsOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {collectionsOpen && (
            <div className="mt-1 pl-2 space-y-1">
              {collections.map(collection => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.id}`}
                  className="flex items-center justify-between px-3 py-1.5 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span>{collection.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{collection.count}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* 热门标签 */}
        <div className="mt-4">
          <button 
            onClick={() => setTagsOpen(!tagsOpen)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-200"
          >
            <span>热门标签</span>
            {tagsOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {tagsOpen && (
            <div className="mt-1 pl-2 space-y-1">
              {tags.map(tag => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.id}`}
                  className="flex items-center justify-between px-3 py-1.5 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span>{tag.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{tag.count}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 