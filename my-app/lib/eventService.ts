// 简单的事件服务，用于组件间通信
type EventCallback = (data?: any) => void;

class EventService {
  private events: Record<string, EventCallback[]> = {};

  // 订阅事件
  subscribe(eventName: string, callback: EventCallback): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  // 取消订阅事件
  unsubscribe(eventName: string, callback: EventCallback): void {
    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
  }

  // 发布事件
  publish(eventName: string, data?: any): void {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(callback => callback(data));
  }
}

// 创建单例实例
export const eventService = new EventService();

// 定义事件名称常量
export const EVENTS = {
  BOOKMARKS_IMPORTED: 'bookmarks_imported',
  BOOKMARK_DELETED: 'bookmark_deleted',
}; 