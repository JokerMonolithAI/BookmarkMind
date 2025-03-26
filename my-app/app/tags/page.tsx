'use client';

import { useState, useEffect } from 'react';
import { Tag, getUserTags } from '@/lib/supabaseTagService';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TagsList } from '@/components/tags/TagsList';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import ImportButton from '@/components/dashboard/ImportButton';
import { Loader2 } from 'lucide-react';
import { Footer } from '@/components/ui/footer';

export default function TagsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  // 获取用户的所有标签
  const fetchTags = async () => {
    if (!user) return [];
    
    try {
      setIsLoading(true);
      const tagsData = await getUserTags(user.id);
      return tagsData;
    } catch (error) {
      console.error('Error fetching tags:', error);
      setError('加载标签时出错，请稍后再试');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadTags = async () => {
      const tagsData = await fetchTags();
      setTags(tagsData);
      setFilteredTags(tagsData);
    };

    // 检查身份验证状态
    if (user) {
      setAuthLoading(false);
      loadTags();
    } else {
      // 假设如果没有用户，我们延迟一个短时间来检查是否正在加载
      const timer = setTimeout(() => {
        setAuthLoading(false);
        if (!user) {
          router.push('/login');
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user, router]);

  // 根据搜索查询过滤标签
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredTags(tags);
      return;
    }
    
    const lowerCaseQuery = query.toLowerCase();
    const filtered = tags.filter(tag => 
      tag.name.toLowerCase().includes(lowerCaseQuery)
    );
    
    setFilteredTags(filtered);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-grow flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null; // 将会被路由重定向到登录页面
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex flex-1">
        <Sidebar />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <nav className="sticky top-0 z-30 border-b border-gray-200 bg-background dark:border-gray-700 shadow-sm p-2">
            <div className="mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 justify-center">
                <SearchBar onSearch={handleSearch} />
              </div>
              <div className="flex items-center gap-2">
                <ImportButton />
                <ThemeToggle />
              </div>
            </div>
          </nav>
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <TagsList
              initialTags={filteredTags}
              fetchTags={fetchTags}
              onSearchChange={handleSearch}
              isLoading={isLoading}
              error={error || undefined}
            />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
} 