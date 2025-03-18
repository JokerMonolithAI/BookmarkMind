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

// 获取标签关联的所有书签ID
export async function getTagBookmarks(userId: string, tagId: string): Promise<string[]> {
  try {
    // 查找所有与该标签关联的书签关系
    const bookmarkTagsRef = ref(db, `users/${userId}/bookmarkTags`);
    const snapshot = await get(bookmarkTagsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const bookmarkTags = snapshot.val();
    const bookmarkIds: string[] = [];
    
    // 遍历所有bookmarkTag关系，查找包含该tagId的记录
    for (const key in bookmarkTags) {
      if (key.endsWith(`_${tagId}`)) {
        const bookmarkTag = bookmarkTags[key];
        bookmarkIds.push(bookmarkTag.bookmarkId);
      }
    }
    
    return bookmarkIds;
  } catch (error) {
    console.error('Error fetching tag bookmarks:', error);
    throw error;
  }
}

// 为单个书签添加标签
export async function addTagToBookmark(userId: string, tagId: string, bookmarkId: string): Promise<void> {
  try {
    // 检查标签是否存在
    const tagRef = ref(db, `users/${userId}/tags/${tagId}`);
    const tagSnapshot = await get(tagRef);
    
    if (!tagSnapshot.exists()) {
      throw new Error('标签不存在');
    }
    
    const now = Date.now();
    
    // 检查书签和标签的关联是否已存在
    const bookmarkTagRef = ref(db, `users/${userId}/bookmarkTags/${bookmarkId}_${tagId}`);
    const bookmarkTagSnapshot = await get(bookmarkTagRef);
    
    // 如果关联已存在，则不需要再次添加
    if (bookmarkTagSnapshot.exists()) {
      return;
    }
    
    // 创建书签和标签的关联
    const bookmarkTagData: BookmarkTag = {
      bookmarkId,
      tagId,
      userId,
      addedAt: now
    };
    
    // 增加标签的使用计数
    const tagData = tagSnapshot.val();
    const currentCount = tagData.count || 0;
    
    // 更新数据库
    const updates: { [key: string]: any } = {};
    updates[`users/${userId}/bookmarkTags/${bookmarkId}_${tagId}`] = bookmarkTagData;
    updates[`users/${userId}/tags/${tagId}/count`] = currentCount + 1;
    updates[`users/${userId}/tags/${tagId}/updatedAt`] = now;
    
    await update(ref(db), updates);
  } catch (error) {
    console.error('Error adding tag to bookmark:', error);
    throw error;
  }
}

// 从书签中移除标签
export async function removeTagFromBookmark(userId: string, tagId: string, bookmarkId: string): Promise<void> {
  try {
    // 检查标签是否存在
    const tagRef = ref(db, `users/${userId}/tags/${tagId}`);
    const tagSnapshot = await get(tagRef);
    
    if (!tagSnapshot.exists()) {
      throw new Error('标签不存在');
    }
    
    // 检查关联是否存在
    const bookmarkTagRef = ref(db, `users/${userId}/bookmarkTags/${bookmarkId}_${tagId}`);
    const bookmarkTagSnapshot = await get(bookmarkTagRef);
    
    // 如果关联不存在，则不需要执行删除操作
    if (!bookmarkTagSnapshot.exists()) {
      return;
    }
    
    const now = Date.now();
    
    // 减少标签的使用计数
    const tagData = tagSnapshot.val();
    const currentCount = tagData.count || 0;
    const newCount = Math.max(0, currentCount - 1); // 确保count不会小于0
    
    // 更新数据库
    const updates: { [key: string]: any } = {};
    updates[`users/${userId}/bookmarkTags/${bookmarkId}_${tagId}`] = null; // 删除关联
    updates[`users/${userId}/tags/${tagId}/count`] = newCount;
    updates[`users/${userId}/tags/${tagId}/updatedAt`] = now;
    
    await update(ref(db), updates);
  } catch (error) {
    console.error('Error removing tag from bookmark:', error);
    throw error;
  }
}

// 获取书签的所有标签
export async function getBookmarkTags(userId: string, bookmarkId: string): Promise<Tag[]> {
  try {
    // 获取所有书签标签关联
    const bookmarkTagsRef = ref(db, `users/${userId}/bookmarkTags`);
    const snapshot = await get(bookmarkTagsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const bookmarkTags = snapshot.val();
    const tagIds: string[] = [];
    
    // 查找与当前书签关联的所有标签
    for (const key in bookmarkTags) {
      if (key.startsWith(`${bookmarkId}_`)) {
        const bookmarkTag = bookmarkTags[key];
        tagIds.push(bookmarkTag.tagId);
      }
    }
    
    // 如果没有关联的标签，直接返回空数组
    if (tagIds.length === 0) {
      return [];
    }
    
    // 获取所有标签的详细信息
    const tags: Tag[] = [];
    const tagsRef = ref(db, `users/${userId}/tags`);
    const tagsSnapshot = await get(tagsRef);
    
    if (tagsSnapshot.exists()) {
      const tagsData = tagsSnapshot.val();
      
      for (const tagId of tagIds) {
        if (tagsData[tagId]) {
          const tagData = tagsData[tagId];
          
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
            id: tagId,
            ...tagData,
            bgColor,
            textColor
          });
        }
      }
    }
    
    // 按照使用数量排序
    return tags.sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching bookmark tags:', error);
    throw error;
  }
}

// 批量为多个书签添加标签
export async function addTagToBookmarks(userId: string, tagId: string, bookmarkIds: string[]): Promise<void> {
  try {
    // 首先检查标签是否存在
    const tagRef = ref(db, `users/${userId}/tags/${tagId}`);
    const tagSnapshot = await get(tagRef);
    
    if (!tagSnapshot.exists()) {
      throw new Error('标签不存在');
    }
    
    const now = Date.now();
    const tagData = tagSnapshot.val();
    const currentCount = tagData.count || 0;
    
    // 检查哪些书签尚未关联此标签
    const bookmarkTagPromises = bookmarkIds.map(bookmarkId => 
      get(ref(db, `users/${userId}/bookmarkTags/${bookmarkId}_${tagId}`))
    );
    
    const bookmarkTagSnapshots = await Promise.all(bookmarkTagPromises);
    const newBookmarkIds = bookmarkIds.filter((_, index) => !bookmarkTagSnapshots[index].exists());
    
    // 如果没有新的书签需要添加标签，直接返回
    if (newBookmarkIds.length === 0) {
      return;
    }
    
    // 创建批量更新对象
    const updates: { [key: string]: any } = {};
    
    // 为每个新书签创建标签关联
    newBookmarkIds.forEach(bookmarkId => {
      updates[`users/${userId}/bookmarkTags/${bookmarkId}_${tagId}`] = {
        bookmarkId,
        tagId,
        userId,
        addedAt: now
      };
    });
    
    // 增加标签的使用计数 - 一次性加上所有新书签的数量
    updates[`users/${userId}/tags/${tagId}/count`] = currentCount + newBookmarkIds.length;
    updates[`users/${userId}/tags/${tagId}/updatedAt`] = now;
    
    // 批量更新数据库
    await update(ref(db), updates);
  } catch (error) {
    console.error('Error adding tag to multiple bookmarks:', error);
    throw error;
  }
}

// 批量从书签移除标签
export async function removeTagFromBookmarks(userId: string, tagId: string, bookmarkIds: string[]): Promise<void> {
  try {
    // 检查标签是否存在
    const tagRef = ref(db, `users/${userId}/tags/${tagId}`);
    const tagSnapshot = await get(tagRef);
    
    if (!tagSnapshot.exists()) {
      throw new Error('标签不存在');
    }
    
    // 检查哪些书签已经关联了此标签
    const bookmarkTagPromises = bookmarkIds.map(bookmarkId => 
      get(ref(db, `users/${userId}/bookmarkTags/${bookmarkId}_${tagId}`))
    );
    
    const bookmarkTagSnapshots = await Promise.all(bookmarkTagPromises);
    const existingBookmarkIds = bookmarkIds.filter((_, index) => bookmarkTagSnapshots[index].exists());
    
    // 如果没有书签和此标签关联，直接返回
    if (existingBookmarkIds.length === 0) {
      return;
    }
    
    const now = Date.now();
    
    // 减少标签的使用计数
    const tagData = tagSnapshot.val();
    const currentCount = tagData.count || 0;
    const newCount = Math.max(0, currentCount - existingBookmarkIds.length); // 确保count不会小于0
    
    // 创建批量更新对象
    const updates: { [key: string]: any } = {};
    
    // 移除每个书签的标签关联
    existingBookmarkIds.forEach(bookmarkId => {
      updates[`users/${userId}/bookmarkTags/${bookmarkId}_${tagId}`] = null;
    });
    
    // 更新标签的count
    updates[`users/${userId}/tags/${tagId}/count`] = newCount;
    updates[`users/${userId}/tags/${tagId}/updatedAt`] = now;
    
    // 批量更新数据库
    await update(ref(db), updates);
  } catch (error) {
    console.error('Error removing tag from multiple bookmarks:', error);
    throw error;
  }
} 