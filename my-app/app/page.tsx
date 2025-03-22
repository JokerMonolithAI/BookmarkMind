'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Footer } from '@/components/ui/footer';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // 自动重定向到登录页面
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center justify-center text-center p-5">
          <div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded-md mb-4"></div>
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded-md mb-2"></div>
          <div className="h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
