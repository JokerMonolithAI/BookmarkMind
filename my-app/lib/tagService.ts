'use client';

import { db } from '@/lib/firebase';
import { ref, get, set, remove, update } from 'firebase/database';

// 标签颜色预设
export const TAG_COLORS = {
  blue: { bg: '#1E88E5', text: '#ffffff' },
  green: { bg: '#43A047', text: '#ffffff' },
  orange: { bg: '#FB8C00', text: '#ffffff' },
  pink: { bg: '#EC407A', text: '#ffffff' },
  purple: { bg: '#7E57C2', text: '#ffffff' },
  brown: { bg: '#795548', text: '#ffffff' },
  cyan: { bg: '#00ACC1', text: '#ffffff' },
  yellow: { bg: '#FDD835', text: '#212121' },
  red: { bg: '#E53935', text: '#ffffff' },
  indigo: { bg: '#3949AB', text: '#ffffff' },
};

// 预设标签
export const PRESET_TAGS = [
  { name: '工作', color: 'blue' },
  { name: '学习', color: 'green' },
  { name: '生活', color: 'orange' },
  { name: '娱乐', color: 'pink' },
  { name: '技术', color: 'purple' },
  { name: '阅读', color: 'brown' },
  { name: '设计', color: 'cyan' },
  { name: '灵感', color: 'yellow' },
  { name: '重要', color: 'red' },
  { name: '收藏', color: 'indigo' },
];

// 标签类型
export interface Tag {
  id: string;
  name: string;
  userId: string;
  color: string;         // 标签颜色键名
  bgColor: string;       // 背景颜色 HEX 值
  textColor: string;     // 文字颜色 HEX 值
  count: number;         // 使用此标签的书签数量
  createdAt: number;
  updatedAt: number;
}

// 书签与标签关联类型
export interface BookmarkTag {
  bookmarkId: string;
  tagId: string;
  userId: string;
  addedAt: number;
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
      const tagData = tagsData[id];
      
      // 确保颜色值存在
      let bgColor = tagData.bgColor;
      let textColor = tagData.textColor;
      
      if (!bgColor && tagData.color && TAG_COLORS[tagData.color as keyof typeof TAG_COLORS]) {
        bgColor = TAG_COLORS[tagData.color as keyof typeof TAG_COLORS].bg;
        textColor = TAG_COLORS[tagData.color as keyof typeof TAG_COLORS].text;
      } else if (!bgColor) {
        // 默认颜色
        bgColor = '#1E88E5';
        textColor = '#ffffff';
      }
      
      tags.push({
        id,
        ...tagData,
        bgColor,
        textColor
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
    
    // 确保颜色值存在
    let bgColor = tagData.bgColor;
    let textColor = tagData.textColor;
    
    if (!bgColor && tagData.color && TAG_COLORS[tagData.color as keyof typeof TAG_COLORS]) {
      bgColor = TAG_COLORS[tagData.color as keyof typeof TAG_COLORS].bg;
      textColor = TAG_COLORS[tagData.color as keyof typeof TAG_COLORS].text;
    } else if (!bgColor) {
      // 默认颜色
      bgColor = '#1E88E5';
      textColor = '#ffffff';
    }
    
    return {
      id: tagId,
      ...tagData,
      bgColor,
      textColor
    };
  } catch (error) {
    console.error('Error fetching tag:', error);
    throw error;
  }
}

// 创建新标签
export async function createTag(
  userId: string, 
  data: { 
    name: string; 
    color: string;
    bgColor?: string;
    textColor?: string;
  }
): Promise<Tag> {
  try {
    const now = Date.now();
    const newTagRef = ref(db, `users/${userId}/tags`);
    const snapshot = await get(newTagRef);
    
    // 检查是否已存在同名标签
    if (snapshot.exists()) {
      const tagsData = snapshot.val();
      const existingTag = Object.values(tagsData).find(
        (tag: any) => tag.name.toLowerCase() === data.name.toLowerCase()
      );
      
      if (existingTag) {
        throw new Error(`标签 "${data.name}" 已存在`);
      }
    }
    
    // 获取标签颜色
    let bgColor = data.bgColor || '';
    let textColor = data.textColor || '';
    
    if ((!bgColor || !textColor) && data.color && TAG_COLORS[data.color as keyof typeof TAG_COLORS]) {
      bgColor = TAG_COLORS[data.color as keyof typeof TAG_COLORS].bg;
      textColor = TAG_COLORS[data.color as keyof typeof TAG_COLORS].text;
    } else if (!bgColor || !textColor) {
      // 默认颜色
      bgColor = '#1E88E5';
      textColor = '#ffffff';
    }
    
    // 生成新标签ID
    const newTagId = `tag_${now}`;
    
    // 创建标签数据
    const tagData = {
      name: data.name,
      userId,
      color: data.color,
      bgColor,
      textColor,
      count: 0,
      createdAt: now,
      updatedAt: now
    };
    
    // 保存到数据库
    await set(ref(db, `users/${userId}/tags/${newTagId}`), tagData);
    
    return {
      id: newTagId,
      ...tagData
    };
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
}

// 更新标签
export async function updateTag(
  userId: string, 
  tagId: string, 
  data: { 
    name?: string; 
    color?: string;
    bgColor?: string;
    textColor?: string;
  }
): Promise<Tag> {
  try {
    // 获取当前标签数据
    const tagRef = ref(db, `users/${userId}/tags/${tagId}`);
    const snapshot = await get(tagRef);
    
    if (!snapshot.exists()) {
      throw new Error('标签不存在');
    }
    
    const currentTag = snapshot.val();
    
    // 准备更新数据
    const updateData: any = {
      updatedAt: Date.now()
    };
    
    // 更新名称（如果提供）
    if (data.name) {
      updateData.name = data.name;
    }
    
    // 更新颜色（如果提供）
    if (data.color) {
      updateData.color = data.color;
      
      // 如果是预设颜色，更新bgColor和textColor
      if (TAG_COLORS[data.color as keyof typeof TAG_COLORS]) {
        updateData.bgColor = TAG_COLORS[data.color as keyof typeof TAG_COLORS].bg;
        updateData.textColor = TAG_COLORS[data.color as keyof typeof TAG_COLORS].text;
      }
    }
    
    // 如果提供了自定义颜色，覆盖预设颜色
    if (data.bgColor) {
      updateData.bgColor = data.bgColor;
    }
    
    if (data.textColor) {
      updateData.textColor = data.textColor;
    }
    
    // 执行更新
    await update(tagRef, updateData);
    
    // 确保返回的对象有所有必需的属性
    const updatedTag = {
      id: tagId,
      ...currentTag,
      ...updateData
    };
    
    // 确保颜色值都存在
    if (!updatedTag.bgColor) {
      if (updatedTag.color && TAG_COLORS[updatedTag.color as keyof typeof TAG_COLORS]) {
        updatedTag.bgColor = TAG_COLORS[updatedTag.color as keyof typeof TAG_COLORS].bg;
      } else {
        updatedTag.bgColor = '#1E88E5';
      }
    }
    
    if (!updatedTag.textColor) {
      if (updatedTag.color && TAG_COLORS[updatedTag.color as keyof typeof TAG_COLORS]) {
        updatedTag.textColor = TAG_COLORS[updatedTag.color as keyof typeof TAG_COLORS].text;
      } else {
        updatedTag.textColor = '#ffffff';
      }
    }
    
    return updatedTag as Tag;
  } catch (error) {
    console.error('Error updating tag:', error);
    throw error;
  }
}

// 删除标签
export async function deleteTag(userId: string, tagId: string): Promise<void> {
  try {
    // 删除标签本身
    await remove(ref(db, `users/${userId}/tags/${tagId}`));
    
    // 删除标签与书签的关联
    await remove(ref(db, `users/${userId}/tag_bookmarks/${tagId}`));
    
    // 删除书签上的标签引用（可选，取决于你的数据结构）
    // 这里需要遍历所有书签并移除tagId，但可能会很耗时
    // 建议在数据结构设计时考虑这点，或者在用户访问书签时动态处理
  } catch (error) {
    console.error('Error deleting tag:', error);
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

// 为书签添加标签
export async function addTagToBookmark(userId: string, tagId: string, bookmarkId: string): Promise<void> {
  try {
    const now = Date.now();
    
    // 添加标签到书签关联
    await set(ref(db, `users/${userId}/tag_bookmarks/${tagId}/${bookmarkId}`), true);
    
    // 更新标签使用计数
    const tagRef = ref(db, `users/${userId}/tags/${tagId}`);
    const tagSnapshot = await get(tagRef);
    
    if (tagSnapshot.exists()) {
      const tagData = tagSnapshot.val();
      const count = (tagData.count || 0) + 1;
      
      await update(tagRef, {
        count,
        updatedAt: now
      });
    }
  } catch (error) {
    console.error('Error adding tag to bookmark:', error);
    throw error;
  }
}

// 从书签移除标签
export async function removeTagFromBookmark(userId: string, tagId: string, bookmarkId: string): Promise<void> {
  try {
    // 从关联表中移除
    await remove(ref(db, `users/${userId}/tag_bookmarks/${tagId}/${bookmarkId}`));
    
    // 更新标签使用计数
    const tagRef = ref(db, `users/${userId}/tags/${tagId}`);
    const tagSnapshot = await get(tagRef);
    
    if (tagSnapshot.exists()) {
      const tagData = tagSnapshot.val();
      const count = Math.max((tagData.count || 0) - 1, 0); // 确保不会小于0
      
      await update(tagRef, {
        count,
        updatedAt: Date.now()
      });
    }
  } catch (error) {
    console.error('Error removing tag from bookmark:', error);
    throw error;
  }
}

// 获取书签的所有标签
export async function getBookmarkTags(userId: string, bookmarkId: string): Promise<Tag[]> {
  try {
    const tags = await getUserTags(userId);
    const tagPromises = tags.map(async tag => {
      const bookmarksRef = ref(db, `users/${userId}/tag_bookmarks/${tag.id}/${bookmarkId}`);
      const snapshot = await get(bookmarksRef);
      return snapshot.exists() ? tag : null;
    });
    
    const tagResults = await Promise.all(tagPromises);
    return tagResults.filter(tag => tag !== null) as Tag[];
  } catch (error) {
    console.error('Error fetching bookmark tags:', error);
    throw error;
  }
}

// 批量为书签添加标签
export async function addTagToBookmarks(userId: string, tagId: string, bookmarkIds: string[]): Promise<void> {
  try {
    const promises = bookmarkIds.map(bookmarkId => 
      addTagToBookmark(userId, tagId, bookmarkId)
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error adding tag to multiple bookmarks:', error);
    throw error;
  }
}

// 批量从书签移除标签
export async function removeTagFromBookmarks(userId: string, tagId: string, bookmarkIds: string[]): Promise<void> {
  try {
    const promises = bookmarkIds.map(bookmarkId => 
      removeTagFromBookmark(userId, tagId, bookmarkId)
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error removing tag from multiple bookmarks:', error);
    throw error;
  }
} 