import { Bookmark } from '../types/bookmark';
import { normalizeUrl, isValidUrl } from './url-utils';
import { generateId } from '@/lib/utils';

/**
 * 安全地解析时间戳
 * 确保返回的时间戳在PostgreSQL支持的范围内
 * @param timestamp 原始时间戳（可能是秒或毫秒）
 * @returns 标准化的时间戳
 */
function safeParseTimestamp(timestamp: string | number | null | undefined): number {
  if (!timestamp) {
    return Date.now();
  }
  
  try {
    let ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp as number;
    
    // 检查是否是秒级时间戳(Chrome书签通常是秒级)
    if (ts < 10000000000) { // 小于2286年的秒级时间戳
      ts = ts * 1000; // 转为毫秒
    }
    
    // 确保时间戳在合理范围内(1970-2038年之间)
    if (ts < 0 || ts > 2145916800000) { // 2038-01-19的毫秒时间戳
      return Date.now();
    }
    
    return ts;
  } catch (e) {
    return Date.now();
  }
}

/**
 * 解析书签文件
 * @param file 书签文件
 * @returns 解析后的书签数组和去重信息
 */
export async function parseBookmarkFile(file: File): Promise<{
  bookmarks: Bookmark[];
  duplicatesCount: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        
        // 根据文件类型选择解析方法
        let bookmarks: Bookmark[] = [];
        if (file.name.endsWith('.json')) {
          bookmarks = parseJsonBookmarks(content);
        } else {
          bookmarks = parseHtmlBookmarks(content);
        }
        
        // 去重处理
        const uniqueUrls = new Set<string>();
        const uniqueBookmarks: Bookmark[] = [];
        let duplicatesCount = 0;
        
        for (const bookmark of bookmarks) {
          if (bookmark.url && bookmark.url.trim()) {
            const normalizedUrl = normalizeUrl(bookmark.url);
            if (!uniqueUrls.has(normalizedUrl)) {
              uniqueUrls.add(normalizedUrl);
              uniqueBookmarks.push(bookmark);
            } else {
              duplicatesCount++;
            }
          }
        }
                
        resolve({
          bookmarks: uniqueBookmarks,
          duplicatesCount
        });
      } catch (error) {
        console.error('解析书签文件时出错:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('读取文件时出错:', error);
      reject(new Error('读取文件失败'));
    };
    
    // 开始读取文件
    reader.readAsText(file);
  });
}

/**
 * 读取文件内容
 */
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
};

/**
 * 解析JSON格式的书签
 */
const parseJsonBookmarks = (content: string): Bookmark[] => {
  try {
    const data = JSON.parse(content);
    
    // 处理Chrome书签JSON格式
    if (data.roots) {
      return extractChromeBookmarks(data.roots);
    }
    
    // 处理Firefox书签JSON格式
    if (data.children) {
      return extractFirefoxBookmarks(data);
    }
    
    // 处理通用JSON格式
    if (Array.isArray(data)) {
      return data.map(item => {
        const now = Date.now();
        return {
          id: item.id || generateId('bm'),
          url: item.url,
          title: item.title || item.name || '未命名书签',
          description: item.description || '',
          favicon: item.favicon || '',
          createdAt: safeParseTimestamp(item.createdAt || item.dateAdded),
          addedAt: now,
          tags: item.tags || []
        };
      });
    }
    
    throw new Error('不支持的JSON格式');
  } catch (error) {
    console.error('解析JSON书签失败:', error);
    throw new Error('解析书签文件失败，请确保文件格式正确');
  }
};

/**
 * 解析HTML格式的书签
 */
const parseHtmlBookmarks = (content: string): Bookmark[] => {
  const bookmarks: Bookmark[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  
  // 查找所有书签链接
  const links = doc.querySelectorAll('a');
  
  links.forEach((link, index) => {
    const url = link.getAttribute('href');
    if (url && isValidUrl(url)) {
      const title = link.textContent || '未命名书签';
      const addDate = link.getAttribute('add_date') || link.getAttribute('dateAdded');
      const icon = link.getAttribute('icon') || '';
      const now = Date.now();
      
      bookmarks.push({
        id: generateId('bm'),
        url,
        title,
        favicon: icon,
        createdAt: safeParseTimestamp(addDate),
        addedAt: now,
        description: '',
        tags: []
      });
    }
  });
  
  return bookmarks;
};

/**
 * 从Chrome书签JSON中提取书签
 */
const extractChromeBookmarks = (roots: any): Bookmark[] => {
  const bookmarks: Bookmark[] = [];
  
  // 递归函数提取书签
  const extractBookmarksRecursive = (node: any, index: number) => {
    if (node.type === 'url') {
      const now = Date.now();
      bookmarks.push({
        id: generateId('bm'),
        url: node.url,
        title: node.name || '未命名书签',
        description: '',
        favicon: '',
        createdAt: safeParseTimestamp(node.date_added),
        addedAt: now,
        tags: []
      });
    }
    
    if (node.children) {
      node.children.forEach((child: any, idx: number) => extractBookmarksRecursive(child, idx));
    }
  };
  
  // 处理所有根节点
  Object.values(roots).forEach((root: any, index: number) => extractBookmarksRecursive(root, index));
  
  return bookmarks;
};

/**
 * 从Firefox书签JSON中提取书签
 */
const extractFirefoxBookmarks = (root: any): Bookmark[] => {
  const bookmarks: Bookmark[] = [];
  
  // 递归函数提取书签
  const extractBookmarksRecursive = (node: any, index: number) => {
    if (node.type === 'bookmark') {
      const now = Date.now();
      bookmarks.push({
        id: generateId('bm'),
        url: node.uri,
        title: node.title || '未命名书签',
        description: '',
        favicon: node.iconuri || '',
        createdAt: safeParseTimestamp(node.dateAdded),
        addedAt: now,
        tags: []
      });
    }
    
    if (node.children) {
      node.children.forEach((child: any, idx: number) => extractBookmarksRecursive(child, idx));
    }
  };
  
  // 处理根节点
  extractBookmarksRecursive(root, 0);
  
  return bookmarks;
}; 