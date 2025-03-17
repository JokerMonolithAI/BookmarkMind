'use client';

import { useState } from 'react';
import { Folder } from '@/lib/collectionService';
import { ChevronRight, ChevronDown, Folder as FolderIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FolderTreeProps {
  folders: Folder[];
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

interface FolderNodeProps {
  folder: Folder;
  folders: Folder[];
  level: number;
  selectedFolder: string | null;
  onSelectFolder: (folderId: string) => void;
  childFolders: Folder[];
}

// 文件夹节点组件
function FolderNode({ 
  folder, 
  folders,
  level, 
  selectedFolder, 
  onSelectFolder, 
  childFolders 
}: FolderNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = childFolders.length > 0;
  
  // 切换展开/折叠状态
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };
  
  // 选择文件夹
  const handleSelect = () => {
    onSelectFolder(folder.id);
  };
  
  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
          selectedFolder === folder.id && "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        )}
        style={{ paddingLeft: `${(level * 12) + 4}px` }}
        onClick={handleSelect}
      >
        {hasChildren ? (
          <div 
            className="w-5 h-5 flex items-center justify-center mr-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={toggleExpand}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        ) : (
          <div className="w-5 h-5 mr-1"></div>
        )}
        <FolderIcon className="h-4 w-4 mr-2 text-yellow-500" />
        <span className="text-sm truncate">{folder.name}</span>
      </div>
      
      {expanded && hasChildren && (
        <div>
          {childFolders.map(childFolder => (
            <FolderNode
              key={childFolder.id}
              folder={childFolder}
              folders={folders}
              level={level + 1}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              childFolders={folders.filter(f => f.parentId === childFolder.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({ folders, selectedFolder, onSelectFolder }: FolderTreeProps) {
  // 处理"全部"文件夹的选择
  const handleSelectAll = () => {
    onSelectFolder(null);
  };
  
  // 获取根文件夹（没有父文件夹的文件夹）
  const rootFolders = folders.filter(folder => !folder.parentId);
  
  return (
    <div className="space-y-1">
      <div 
        className={cn(
          "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
          selectedFolder === null && "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        )}
        onClick={handleSelectAll}
      >
        <FolderIcon className="h-4 w-4 mr-2 text-blue-500" />
        <span className="text-sm font-medium">全部</span>
      </div>
      
      {rootFolders.map(folder => (
        <FolderNode
          key={folder.id}
          folder={folder}
          folders={folders}
          level={0}
          selectedFolder={selectedFolder}
          onSelectFolder={onSelectFolder}
          childFolders={folders.filter(f => f.parentId === folder.id)}
        />
      ))}
      
      {folders.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-2 px-2">
          暂无文件夹
        </div>
      )}
    </div>
  );
} 