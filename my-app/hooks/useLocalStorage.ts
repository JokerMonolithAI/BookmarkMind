import { useState, useEffect } from 'react';

// localStorage 存储钩子
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // 创建状态
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // 初始化
  useEffect(() => {
    try {
      // 获取 localStorage 中的值
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        // 如果已经有值，解析并使用它
        if (item) {
          setStoredValue(JSON.parse(item));
        } else {
          // 否则使用初始值并存储
          window.localStorage.setItem(key, JSON.stringify(initialValue));
        }
      }
    } catch (error) {
      // 发生错误时使用初始值
      console.error('Error reading from localStorage:', error);
    }
  }, [key, initialValue]);

  // 设置值的函数
  const setValue = (value: T) => {
    try {
      // 更新 React 状态
      setStoredValue(value);
      // 同时更新 localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue];
} 