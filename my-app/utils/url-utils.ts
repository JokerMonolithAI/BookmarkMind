/**
 * 规范化URL以便进行比较
 * 移除协议、www前缀、末尾斜杠，并转为小写
 * @param url 原始URL
 * @returns 规范化后的URL
 */
export const normalizeUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    // 确保URL有效
    let normalizedUrl = url.trim();
    
    // 如果没有协议，添加一个临时协议以便解析
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'http://' + normalizedUrl;
    }
    
    const urlObj = new URL(normalizedUrl);
    
    // 移除www前缀
    let hostname = urlObj.hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    // 构建规范化的URL
    let path = urlObj.pathname;
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1);
    }
    
    // 包含查询参数但忽略片段标识符(#)
    const query = urlObj.search;
    
    return (hostname + path + query).toLowerCase();
  } catch (error) {
    console.error('URL规范化失败:', error);
    return url.toLowerCase(); // 如果解析失败，至少转为小写
  }
};

/**
 * 验证URL是否有效
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}; 