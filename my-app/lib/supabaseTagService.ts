/**
 * Supabase 标签服务 - 处理标签的存储、获取和管理
 * 替代原 Firebase 实现的功能
 */

import { supabase } from './supabase';

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

// 数据库表名
const TAGS_TABLE = 'tags';
const BOOKMARK_TAGS_TABLE = 'bookmark_tags';

/**
 * 获取用户的所有标签
 */
export async function getUserTags(userId: string): Promise<Tag[]> {
  try {
    if (!userId) {
      console.error('getUserTags: 用户ID为空');
      return [];
    }
    
    const { data, error } = await supabase
      .from(TAGS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('count', { ascending: false });
      
    if (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // 将数据库结果转换为应用格式
    const tags: Tag[] = data.map(item => {
      // 确保颜色值存在
      let bgColor = item.bg_color;
      let textColor = item.text_color;
      
      if (!bgColor && item.color && TAG_COLORS[item.color as keyof typeof TAG_COLORS]) {
        bgColor = TAG_COLORS[item.color as keyof typeof TAG_COLORS].bg;
        textColor = TAG_COLORS[item.color as keyof typeof TAG_COLORS].text;
      } else if (!bgColor) {
        // 默认颜色
        bgColor = '#1E88E5';
        textColor = '#ffffff';
      }
      
      return {
        id: item.id,
        name: item.name,
        userId: item.user_id,
        color: item.color || 'blue',
        bgColor,
        textColor,
        count: item.count || 0,
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime()
      };
    });
    
    return tags;
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * 获取标签详情
 */
export async function getTag(userId: string, tagId: string): Promise<Tag | null> {
  try {
    const { data, error } = await supabase
      .from(TAGS_TABLE)
      .select('*')
      .eq('id', tagId)
      .eq('user_id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // 未找到记录的错误码
        return null;
      }
      console.error('Error fetching tag:', error);
      throw error;
    }
    
    if (!data) {
      return null;
    }
    
    // 确保颜色值存在
    let bgColor = data.bg_color;
    let textColor = data.text_color;
    
    if (!bgColor && data.color && TAG_COLORS[data.color as keyof typeof TAG_COLORS]) {
      bgColor = TAG_COLORS[data.color as keyof typeof TAG_COLORS].bg;
      textColor = TAG_COLORS[data.color as keyof typeof TAG_COLORS].text;
    } else if (!bgColor) {
      // 默认颜色
      bgColor = '#1E88E5';
      textColor = '#ffffff';
    }
    
    return {
      id: data.id,
      name: data.name,
      userId: data.user_id,
      color: data.color || 'blue',
      bgColor,
      textColor,
      count: data.count || 0,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime()
    };
  } catch (error) {
    console.error('Error fetching tag:', error);
    throw error;
  }
}

/**
 * 创建新标签
 */
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
    // 检查是否已存在同名标签
    const { data: existingTag, error: checkError } = await supabase
      .from(TAGS_TABLE)
      .select('id')
      .eq('user_id', userId)
      .ilike('name', data.name)
      .limit(1);
      
    if (checkError) throw checkError;
    
    if (existingTag && existingTag.length > 0) {
      throw new Error(`标签 "${data.name}" 已存在`);
    }
    
    const now = new Date();
    const timestamp = now.toISOString();
    
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
    const tagId = `tag_${now.getTime()}`;
    
    // 创建标签数据
    const { data: insertedTag, error: insertError } = await supabase
      .from(TAGS_TABLE)
      .insert({
        id: tagId,
        name: data.name,
        user_id: userId,
        color: data.color,
        bg_color: bgColor,
        text_color: textColor,
        count: 0,
        created_at: timestamp,
        updated_at: timestamp
      })
      .select()
      .single();
      
    if (insertError) throw insertError;
    
    // 返回创建的标签
    return {
      id: tagId,
      name: data.name,
      userId: userId,
      color: data.color,
      bgColor: bgColor,
      textColor: textColor,
      count: 0,
      createdAt: now.getTime(),
      updatedAt: now.getTime()
    };
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
}

/**
 * 更新标签
 */
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
    const { data: currentTag, error: getError } = await supabase
      .from(TAGS_TABLE)
      .select('*')
      .eq('id', tagId)
      .eq('user_id', userId)
      .single();
      
    if (getError) throw getError;
    
    const updateData: any = {
      updated_at: new Date().toISOString()
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
        updateData.bg_color = TAG_COLORS[data.color as keyof typeof TAG_COLORS].bg;
        updateData.text_color = TAG_COLORS[data.color as keyof typeof TAG_COLORS].text;
      }
    }
    
    // 如果提供了自定义颜色，覆盖预设颜色
    if (data.bgColor) {
      updateData.bg_color = data.bgColor;
    }
    
    if (data.textColor) {
      updateData.text_color = data.textColor;
    }
    
    // 执行更新
    const { data: updatedTag, error: updateError } = await supabase
      .from(TAGS_TABLE)
      .update(updateData)
      .eq('id', tagId)
      .eq('user_id', userId)
      .select()
      .single();
      
    if (updateError) throw updateError;
    
    // 确保颜色值都存在
    let bgColor = updatedTag.bg_color;
    let textColor = updatedTag.text_color;
    
    if (!bgColor && updatedTag.color && TAG_COLORS[updatedTag.color as keyof typeof TAG_COLORS]) {
      bgColor = TAG_COLORS[updatedTag.color as keyof typeof TAG_COLORS].bg;
    } else if (!bgColor) {
      bgColor = '#1E88E5';
    }
    
    if (!textColor && updatedTag.color && TAG_COLORS[updatedTag.color as keyof typeof TAG_COLORS]) {
      textColor = TAG_COLORS[updatedTag.color as keyof typeof TAG_COLORS].text;
    } else if (!textColor) {
      textColor = '#ffffff';
    }
    
    // 返回更新后的标签
    return {
      id: updatedTag.id,
      name: updatedTag.name,
      userId: updatedTag.user_id,
      color: updatedTag.color || 'blue',
      bgColor: bgColor,
      textColor: textColor,
      count: updatedTag.count || 0,
      createdAt: new Date(updatedTag.created_at).getTime(),
      updatedAt: new Date(updatedTag.updated_at).getTime()
    };
  } catch (error) {
    console.error('Error updating tag:', error);
    throw error;
  }
}

/**
 * 删除标签
 */
export async function deleteTag(userId: string, tagId: string): Promise<void> {
  try {
    // 验证标签属于该用户
    const { data: tag, error: checkError } = await supabase
      .from(TAGS_TABLE)
      .select('id')
      .eq('id', tagId)
      .eq('user_id', userId)
      .single();
      
    if (checkError) throw checkError;
    
    // 删除标签（通过级联删除关系，会自动删除相关的bookmark_tags记录）
    const { error: deleteError } = await supabase
      .from(TAGS_TABLE)
      .delete()
      .eq('id', tagId)
      .eq('user_id', userId);
      
    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
}

/**
 * 获取标签关联的所有书签ID
 */
export async function getTagBookmarks(userId: string, tagId: string): Promise<string[]> {
  try {
    // 验证标签属于该用户
    const { data: tag, error: checkError } = await supabase
      .from(TAGS_TABLE)
      .select('id')
      .eq('id', tagId)
      .eq('user_id', userId)
      .single();
      
    if (checkError) throw checkError;
    
    // 获取关联的书签
    const { data, error } = await supabase
      .from(BOOKMARK_TAGS_TABLE)
      .select('bookmark_id')
      .eq('tag_id', tagId)
      .eq('user_id', userId);
      
    if (error) throw error;
    
    return data ? data.map(item => item.bookmark_id) : [];
  } catch (error) {
    console.error('Error fetching tag bookmarks:', error);
    return [];
  }
}

/**
 * 为单个书签添加标签
 */
export async function addTagToBookmark(userId: string, tagId: string, bookmarkId: string): Promise<void> {
  try {
    // 检查标签是否存在
    const { data: tag, error: tagError } = await supabase
      .from(TAGS_TABLE)
      .select('id, count')
      .eq('id', tagId)
      .eq('user_id', userId)
      .single();
      
    if (tagError) throw tagError;
    
    // 检查关联是否已存在
    const { data: existing, error: checkError } = await supabase
      .from(BOOKMARK_TAGS_TABLE)
      .select('*')
      .eq('tag_id', tagId)
      .eq('bookmark_id', bookmarkId)
      .eq('user_id', userId)
      .limit(1);
      
    if (checkError) throw checkError;
    
    // 如果关联已存在，则不需要添加
    if (existing && existing.length > 0) {
      return;
    }
    
    // 创建关联
    const { error: insertError } = await supabase
      .from(BOOKMARK_TAGS_TABLE)
      .insert({
        tag_id: tagId,
        bookmark_id: bookmarkId,
        user_id: userId,
        added_at: new Date().toISOString()
      });
      
    if (insertError) throw insertError;
    
    // 更新标签计数
    const { error: updateError } = await supabase
      .rpc('increment_counter', {
        table_name: TAGS_TABLE,
        column_name: 'count',
        row_id: tagId,
        increment_by: 1
      });
      
    if (updateError) {
      console.error('Error incrementing tag count:', updateError);
      // 尝试直接更新
      await supabase
        .from(TAGS_TABLE)
        .update({ 
          count: (tag.count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', tagId)
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Error adding tag to bookmark:', error);
    throw error;
  }
}

/**
 * 从书签中移除标签
 */
export async function removeTagFromBookmark(userId: string, tagId: string, bookmarkId: string): Promise<void> {
  try {
    // 检查标签是否存在
    const { data: tag, error: tagError } = await supabase
      .from(TAGS_TABLE)
      .select('id, count')
      .eq('id', tagId)
      .eq('user_id', userId)
      .single();
      
    if (tagError) throw tagError;
    
    // 删除关联
    const { error: deleteError } = await supabase
      .from(BOOKMARK_TAGS_TABLE)
      .delete()
      .eq('tag_id', tagId)
      .eq('bookmark_id', bookmarkId)
      .eq('user_id', userId);
      
    if (deleteError) throw deleteError;
    
    // 更新标签计数
    const { error: updateError } = await supabase
      .rpc('decrement_counter', {
        table_name: TAGS_TABLE,
        column_name: 'count',
        row_id: tagId,
        decrement_by: 1
      });
      
    if (updateError) {
      console.error('Error decrementing tag count:', updateError);
      // 尝试直接更新
      await supabase
        .from(TAGS_TABLE)
        .update({ 
          count: Math.max((tag.count || 0) - 1, 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', tagId)
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Error removing tag from bookmark:', error);
    throw error;
  }
}

/**
 * 获取书签的所有标签
 */
export async function getBookmarkTags(userId: string, bookmarkId: string): Promise<Tag[]> {
  try {
    // 获取书签关联的标签ID
    const { data: bookmarkTagsData, error: relationError } = await supabase
      .from(BOOKMARK_TAGS_TABLE)
      .select('tag_id')
      .eq('bookmark_id', bookmarkId)
      .eq('user_id', userId);
      
    if (relationError) throw relationError;
    
    if (!bookmarkTagsData || bookmarkTagsData.length === 0) {
      return [];
    }
    
    const tagIds = bookmarkTagsData.map(item => item.tag_id);
    
    // 获取标签详情
    const { data: tagsData, error: tagsError } = await supabase
      .from(TAGS_TABLE)
      .select('*')
      .in('id', tagIds)
      .eq('user_id', userId);
      
    if (tagsError) throw tagsError;
    
    if (!tagsData || tagsData.length === 0) {
      return [];
    }
    
    // 转换为应用格式
    const tags: Tag[] = tagsData.map(item => {
      // 确保颜色值存在
      let bgColor = item.bg_color;
      let textColor = item.text_color;
      
      if (!bgColor && item.color && TAG_COLORS[item.color as keyof typeof TAG_COLORS]) {
        bgColor = TAG_COLORS[item.color as keyof typeof TAG_COLORS].bg;
        textColor = TAG_COLORS[item.color as keyof typeof TAG_COLORS].text;
      } else if (!bgColor) {
        // 默认颜色
        bgColor = '#1E88E5';
        textColor = '#ffffff';
      }
      
      return {
        id: item.id,
        name: item.name,
        userId: item.user_id,
        color: item.color || 'blue',
        bgColor,
        textColor,
        count: item.count || 0,
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime()
      };
    });
    
    // 按照使用数量排序
    return tags.sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching bookmark tags:', error);
    return [];
  }
}

/**
 * 批量为多个书签添加标签
 */
export async function addTagToBookmarks(userId: string, tagId: string, bookmarkIds: string[]): Promise<void> {
  try {
    if (!bookmarkIds.length) return;
    
    // 检查标签是否存在
    const { data: tag, error: tagError } = await supabase
      .from(TAGS_TABLE)
      .select('id, count')
      .eq('id', tagId)
      .eq('user_id', userId)
      .single();
      
    if (tagError) throw tagError;
    
    // 检查哪些书签已有此标签
    const { data: existingRelations, error: checkError } = await supabase
      .from(BOOKMARK_TAGS_TABLE)
      .select('bookmark_id')
      .eq('tag_id', tagId)
      .eq('user_id', userId)
      .in('bookmark_id', bookmarkIds);
      
    if (checkError) throw checkError;
    
    // 过滤出需要添加标签的书签
    const existingBookmarkIds = existingRelations 
      ? existingRelations.map(item => item.bookmark_id) 
      : [];
    
    const newBookmarkIds = bookmarkIds.filter(id => !existingBookmarkIds.includes(id));
    
    if (!newBookmarkIds.length) return;
    
    // 批量创建关联
    const now = new Date().toISOString();
    const newRelations = newBookmarkIds.map(bookmarkId => ({
      tag_id: tagId,
      bookmark_id: bookmarkId,
      user_id: userId,
      added_at: now
    }));
    
    const { error: insertError } = await supabase
      .from(BOOKMARK_TAGS_TABLE)
      .insert(newRelations);
      
    if (insertError) throw insertError;
    
    // 更新标签计数
    const { error: updateError } = await supabase
      .from(TAGS_TABLE)
      .update({ 
        count: (tag.count || 0) + newBookmarkIds.length,
        updated_at: now
      })
      .eq('id', tagId)
      .eq('user_id', userId);
      
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error adding tag to multiple bookmarks:', error);
    throw error;
  }
}

/**
 * 批量从书签移除标签
 */
export async function removeTagFromBookmarks(userId: string, tagId: string, bookmarkIds: string[]): Promise<void> {
  try {
    if (!bookmarkIds.length) return;
    
    // 检查标签是否存在
    const { data: tag, error: tagError } = await supabase
      .from(TAGS_TABLE)
      .select('id, count')
      .eq('id', tagId)
      .eq('user_id', userId)
      .single();
      
    if (tagError) throw tagError;
    
    // 删除关联
    const { data: deleted, error: deleteError } = await supabase
      .from(BOOKMARK_TAGS_TABLE)
      .delete()
      .eq('tag_id', tagId)
      .eq('user_id', userId)
      .in('bookmark_id', bookmarkIds)
      .select('bookmark_id');
      
    if (deleteError) throw deleteError;
    
    const deletedCount = deleted ? deleted.length : 0;
    
    if (deletedCount === 0) return;
    
    // 更新标签计数
    const { error: updateError } = await supabase
      .from(TAGS_TABLE)
      .update({ 
        count: Math.max((tag.count || 0) - deletedCount, 0),
        updated_at: new Date().toISOString()
      })
      .eq('id', tagId)
      .eq('user_id', userId);
      
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error removing tag from multiple bookmarks:', error);
    throw error;
  }
} 