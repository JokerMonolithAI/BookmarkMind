'use client';

import { useRouter } from 'next/navigation';
import { FolderOpen } from 'lucide-react';
import { Collection } from '@/lib/collectionService';

interface SidebarStyleCollectionCardProps {
  collection: Collection;
  onDeleted?: () => void;
}

export function SidebarStyleCollectionCard({ collection }: SidebarStyleCollectionCardProps) {
  const router = useRouter();

  // 处理点击卡片
  const handleCardClick = () => {
    router.push(`/collections/${collection.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="flex items-center justify-between px-3 py-1.5 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span>{collection.name}</span>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{collection.bookmarkCount || 0}</span>
    </div>
  );
} 