import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并类名工具函数
 * 结合clsx和tailwind-merge，用于合并多个类名，并解决tailwind类名冲突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 生成随机ID
 * 使用时间戳+随机字符串的方式生成，确保唯一性
 * @param prefix 可选前缀
 * @returns 随机生成的唯一ID字符串
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString();
  const randomPart = Math.random().toString(36).substring(2, 10); // 使用更短的随机部分
  
  // 组合时间戳和随机部分，如有前缀则添加
  return `${prefix ? `${prefix}_` : ''}${timestamp}_${randomPart}`;
}

/**
 * 格式化日期
 * @param date 日期对象或日期字符串
 * @param format 格式化模式，默认为'yyyy-MM-dd'
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string, format: string = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  return format
    .replace('yyyy', year.toString())
    .replace('MM', pad(month))
    .replace('dd', pad(day))
    .replace('HH', pad(hours))
    .replace('mm', pad(minutes))
    .replace('ss', pad(seconds));
}

/**
 * 截断文本
 * @param text 要截断的文本
 * @param maxLength 最大长度
 * @returns 截断后的文本，如果超过最大长度，会添加省略号
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * 从URL中提取域名
 * @param url URL字符串
 * @returns 提取的域名
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
}

/**
 * 防抖函数
 * @param func 要执行的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param func 要执行的函数
 * @param limit 限制时间（毫秒）
 * @returns 节流处理后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
} 