import { Bookmark } from '../types/bookmark';
import { normalizeUrl, isValidUrl } from './url-utils';

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
      return data.map(item => ({
        id: item.id || `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: item.url,
        title: item.title || item.name || '未命名书签',
        description: item.description || '',
        favicon: item.favicon || '',
        createdAt: item.createdAt || item.dateAdded || Date.now(),
        addedAt: Date.now(),
        tags: item.tags || []
      }));
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
      
      bookmarks.push({
        id: `bookmark_${Date.now()}_${index}`,
        url,
        title,
        favicon: icon,
        createdAt: addDate ? parseInt(addDate) * 1000 : Date.now(),
        addedAt: Date.now(),
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
  const extractBookmarksRecursive = (node: any) => {
    if (node.type === 'url') {
      bookmarks.push({
        id: `bookmark_${Date.now()}_${bookmarks.length}`,
        url: node.url,
        title: node.name || '未命名书签',
        description: '',
        favicon: '',
        createdAt: node.date_added ? parseInt(node.date_added) : Date.now(),
        addedAt: Date.now(),
        tags: []
      });
    }
    
    if (node.children) {
      node.children.forEach(extractBookmarksRecursive);
    }
  };
  
  // 处理所有根节点
  Object.values(roots).forEach(extractBookmarksRecursive);
  
  return bookmarks;
};

/**
 * 从Firefox书签JSON中提取书签
 */
const extractFirefoxBookmarks = (root: any): Bookmark[] => {
  const bookmarks: Bookmark[] = [];
  
  // 递归函数提取书签
  const extractBookmarksRecursive = (node: any) => {
    if (node.type === 'bookmark') {
      bookmarks.push({
        id: `bookmark_${Date.now()}_${bookmarks.length}`,
        url: node.uri,
        title: node.title || '未命名书签',
        description: '',
        favicon: node.iconuri || '',
        createdAt: node.dateAdded || Date.now(),
        addedAt: Date.now(),
        tags: []
      });
    }
    
    if (node.children) {
      node.children.forEach(extractBookmarksRecursive);
    }
  };
  
  // 处理根节点
  extractBookmarksRecursive(root);
  
  return bookmarks;
}; 