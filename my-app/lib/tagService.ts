'use client';

import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

// 标签类型
export interface Tag {
  id: string;
  name: string;
  userId: string;
  count: number;  // 使用此标签的书签数量
  createdAt: number;
  updatedAt: number;
}

// 获取用户的所有标签
export async function getUserTags(userId: string): Promise<Tag[]> {
  try {
    const tagsRef = ref(db, `users/${userId}/tags`);
    const snapshot = await get(tagsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const tagsData = snapshot.val();
    const tags: Tag[] = [];
    
    for (const id in tagsData) {
      tags.push({
        id,
        ...tagsData[id]
      });
    }
    
    // 按照使用书签数量排序，最多的在前面
    return tags.sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
}

// 获取标签详情
export async function getTag(userId: string, tagId: string): Promise<Tag | null> {
  try {
    const tagRef = ref(db, `users/${userId}/tags/${tagId}`);
    const snapshot = await get(tagRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const tagData = snapshot.val();
    
    return {
      id: tagId,
      ...tagData
    };
  } catch (error) {
    console.error('Error fetching tag:', error);
    throw error;
  }
}

// 获取标签相关的书签ID列表
export async function getTagBookmarks(userId: string, tagId: string): Promise<string[]> {
  try {
    const bookmarksRef = ref(db, `users/${userId}/tag_bookmarks/${tagId}`);
    const snapshot = await get(bookmarksRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    // 标签关联的书签存储结构应该是 { bookmarkId: true }
    return Object.keys(snapshot.val());
  } catch (error) {
    console.error('Error fetching tag bookmarks:', error);
    throw error;
  }
} 