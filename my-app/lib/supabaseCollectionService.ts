/**
 * Supabase 收藏集服务 - 处理收藏集的存储、获取和管理
 * 替代原 Firebase 实现的功能
 */

import { supabase } from './supabase';

// 收藏集类型
export interface Collection {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  bookmarkCount: number;
  isPublic?: boolean;
}

// 文件夹类型
export interface Folder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  collectionId: string;
}

// 收藏集-书签关联类型
export interface CollectionBookmark {
  collectionId: string;
  bookmarkId: string;
  addedAt: number;
}

// 数据库表名
const COLLECTIONS_TABLE = 'collections';
const COLLECTION_BOOKMARKS_TABLE = 'collection_bookmarks';
const BOOKMARKS_TABLE = 'bookmarks';

// 生成唯一ID的函数
function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 获取用户的所有收藏集
 */
export async function getUserCollections(userId: string): Promise<Collection[]> {
  try {
    if (!userId) {
      console.error('getUserCollections: 用户ID为空');
      return [];
    }
    
    const { data, error } = await supabase
      .from(COLLECTIONS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching collections:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // 将数据库结果转换为应用格式
    const collections: Collection[] = data.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      userId: item.user_id,
      createdAt: new Date(item.created_at).getTime(),
      updatedAt: new Date(item.updated_at).getTime(),
      bookmarkCount: item.bookmark_count || 0,
      isPublic: item.is_public || false
    }));
    
    return collections;
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

/**
 * 获取收藏集详情
 */
export async function getCollection(userId: string, collectionId: string): Promise<Collection | null> {
  try {
    const { data, error } = await supabase
      .from(COLLECTIONS_TABLE)
      .select('*')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // 未找到记录的错误码
        return null;
      }
      console.error('Error fetching collection:', error);
      throw error;
    }
    
    if (!data) {
      return null;
    }
    
    // 获取实际的书签数量
    const { count, error: countError } = await supabase
      .from(COLLECTION_BOOKMARKS_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', collectionId);
    
    if (countError) {
      console.error('Error counting bookmarks:', countError);
    }
    
    const actualBookmarkCount = count || 0;
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      userId: data.user_id,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
      bookmarkCount: actualBookmarkCount,
      isPublic: data.is_public || false
    };
  } catch (error) {
    console.error('Error fetching collection:', error);
    throw error;
  }
}

/**
 * 创建新收藏集
 */
export async function createCollection(userId: string, data: { name: string; description?: string }): Promise<Collection> {
  try {
    const timestamp = new Date().toISOString();
    const collectionId = generateId('col_'); // 生成唯一ID，以col_为前缀
    
    // 创建新收藏集记录
    const { data: insertedData, error } = await supabase
      .from(COLLECTIONS_TABLE)
      .insert({
        id: collectionId, // 提供ID字段的值
        name: data.name,
        description: data.description || '',
        user_id: userId,
        created_at: timestamp,
        updated_at: timestamp,
        bookmark_count: 0,
        is_public: false
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
    
    return {
      id: insertedData.id,
      name: insertedData.name,
      description: insertedData.description || '',
      userId: insertedData.user_id,
      createdAt: new Date(insertedData.created_at).getTime(),
      updatedAt: new Date(insertedData.updated_at).getTime(),
      bookmarkCount: 0,
      isPublic: insertedData.is_public || false
    };
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
}

/**
 * 更新收藏集
 */
export async function updateCollection(
  userId: string, 
  collectionId: string, 
  data: { name?: string; description?: string }
): Promise<void> {
  try {
    const { error } = await supabase
      .from(COLLECTIONS_TABLE)
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', collectionId)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating collection:', error);
    throw error;
  }
}

/**
 * 删除收藏集
 */
export async function deleteCollection(userId: string, collectionId: string): Promise<void> {
  try {
    // 删除收藏集（关联的书签关联会通过级联删除自动移除）
    const { error } = await supabase
      .from(COLLECTIONS_TABLE)
      .delete()
      .eq('id', collectionId)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
}

/**
 * 添加书签到收藏集
 */
export async function addBookmarkToCollection(
  userId: string, 
  collectionId: string, 
  bookmarkData: { url: string; title: string; description?: string } | string
): Promise<void> {
  try {
    let bookmarkId: string;
    
    // 如果传入的是书签数据对象，查找或创建书签
    if (typeof bookmarkData === 'object') {
      // 先查找是否已存在相同URL的书签
      const { data: existingBookmarks } = await supabase
        .from(BOOKMARKS_TABLE)
        .select('id')
        .eq('user_id', userId)
        .eq('url', bookmarkData.url)
        .limit(1);
      
      if (existingBookmarks && existingBookmarks.length > 0) {
        // 使用现有书签
        bookmarkId = existingBookmarks[0].id;
      } else {
        // 创建新书签
        // 注意: 这里应该调用 supabaseBookmarkService 中的创建书签函数
        // 简化起见，这里只做演示
        const timestamp = new Date().toISOString();
        const { data: newBookmark, error } = await supabase
          .from(BOOKMARKS_TABLE)
          .insert({
            url: bookmarkData.url,
            title: bookmarkData.title,
            description: bookmarkData.description || '',
            user_id: userId,
            created_at: timestamp,
            added_at: timestamp,
            updated_at: timestamp
          })
          .select('id')
          .single();
        
        if (error) throw error;
        bookmarkId = newBookmark.id;
      }
    } else {
      // 如果传入的是书签ID，直接使用
      bookmarkId = bookmarkData;
    }
    
    // 添加书签到收藏集
    const { error: insertError } = await supabase
      .from(COLLECTION_BOOKMARKS_TABLE)
      .insert({
        collection_id: collectionId,
        bookmark_id: bookmarkId,
        added_at: new Date().toISOString()
      });
    
    if (insertError) {
      // 如果是唯一性约束错误，说明书签已在收藏集中
      if (insertError.code === '23505') {
        console.log('Bookmark already in collection');
        return;
      }
      throw insertError;
    }
    
    // 更新收藏集的书签数量
    const { data: currentCollection, error: getError } = await supabase
      .from(COLLECTIONS_TABLE)
      .select('bookmark_count')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .single();

    if (getError) throw getError;

    // 更新书签数量
    const { error: updateError } = await supabase
      .from(COLLECTIONS_TABLE)
      .update({
        bookmark_count: (currentCollection?.bookmark_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', collectionId)
      .eq('user_id', userId);
    
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error adding bookmark to collection:', error);
    throw error;
  }
}

/**
 * 从收藏集中移除书签
 */
export async function removeBookmarkFromCollection(
  userId: string, 
  collectionId: string, 
  bookmarkId: string
): Promise<void> {
  try {
    // 检查收藏集是否属于该用户
    const { data: collection, error: collectionError } = await supabase
      .from(COLLECTIONS_TABLE)
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .single();
      
    if (collectionError) throw collectionError;
    
    // 删除书签关联
    const { error: deleteError } = await supabase
      .from(COLLECTION_BOOKMARKS_TABLE)
      .delete()
      .eq('collection_id', collectionId)
      .eq('bookmark_id', bookmarkId);
      
    if (deleteError) throw deleteError;
    
    // 更新收藏集的书签数量
    const { data: currentCollection, error: getError } = await supabase
      .from(COLLECTIONS_TABLE)
      .select('bookmark_count')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .single();

    if (getError) throw getError;

    // 更新书签数量
    const { error: updateError } = await supabase
      .from(COLLECTIONS_TABLE)
      .update({
        bookmark_count: Math.max((currentCollection?.bookmark_count || 0) - 1, 0),
        updated_at: new Date().toISOString()
      })
      .eq('id', collectionId)
      .eq('user_id', userId);
      
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error removing bookmark from collection:', error);
    throw error;
  }
}

/**
 * 获取收藏集中的所有书签ID
 */
export async function getCollectionBookmarks(userId: string, collectionId: string): Promise<string[]> {
  try {
    // 先验证用户对收藏集的访问权限
    const { data: collection, error: collectionError } = await supabase
      .from(COLLECTIONS_TABLE)
      .select('id, is_public, user_id')
      .eq('id', collectionId)
      .maybeSingle();
      
    if (collectionError) throw collectionError;
    
    // 如果收藏集不存在，或者不是公开的且不属于当前用户，则拒绝访问
    if (!collection || (!collection.is_public && collection.user_id !== userId)) {
      throw new Error('Permission denied');
    }
    
    // 获取收藏集中的书签
    const { data, error } = await supabase
      .from(COLLECTION_BOOKMARKS_TABLE)
      .select('bookmark_id')
      .eq('collection_id', collectionId);
      
    if (error) throw error;
    
    return data ? data.map(item => item.bookmark_id) : [];
  } catch (error) {
    console.error('Error fetching collection bookmarks:', error);
    return [];
  }
}

/**
 * 获取书签所属的所有收藏集
 */
export async function getBookmarkCollections(userId: string, bookmarkId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from(COLLECTION_BOOKMARKS_TABLE)
      .select(`
        collection_id,
        collections!inner(*)
      `)
      .eq('bookmark_id', bookmarkId)
      .eq('collections.user_id', userId);
      
    if (error) throw error;
    
    return data ? data.map(item => item.collection_id) : [];
  } catch (error) {
    console.error('Error fetching bookmark collections:', error);
    return [];
  }
}

/**
 * 批量添加书签到收藏集
 */
export async function addBookmarksToCollection(
  userId: string, 
  collectionId: string, 
  bookmarkIds: string[]
): Promise<void> {
  try {
    if (!bookmarkIds.length) return;
    
    // 检查收藏集是否属于该用户
    const { data: collection, error: collectionError } = await supabase
      .from(COLLECTIONS_TABLE)
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', userId)
      .single();
      
    if (collectionError) throw collectionError;
    
    // 准备要插入的数据
    const now = new Date().toISOString();
    const bulkData = bookmarkIds.map(bookmarkId => ({
      collection_id: collectionId,
      bookmark_id: bookmarkId,
      added_at: now
    }));
    
    // 批量插入书签关联
    const { error: insertError } = await supabase
      .from(COLLECTION_BOOKMARKS_TABLE)
      .upsert(bulkData);
      
    if (insertError) throw insertError;
    
    // 获取实际添加的书签数量
    const { count, error: countError } = await supabase
      .from(COLLECTION_BOOKMARKS_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', collectionId);
      
    if (countError) throw countError;
    
    // 更新收藏集的书签数量
    const { error: updateError } = await supabase
      .from(COLLECTIONS_TABLE)
      .update({
        bookmark_count: count || 0,
        updated_at: now
      })
      .eq('id', collectionId)
      .eq('user_id', userId);
      
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error adding bookmarks to collection:', error);
    throw error;
  }
}

/**
 * 根据ID列表获取收藏集信息
 */
export async function getCollectionsByIds(userId: string, collectionIds: string[]): Promise<Collection[]> {
  try {
    if (!userId || !collectionIds.length) {
      return [];
    }
    
    const { data, error } = await supabase
      .from(COLLECTIONS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .in('id', collectionIds);
      
    if (error) {
      console.error('Error fetching collections by IDs:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // 将数据库结果转换为应用格式
    const collections: Collection[] = data.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      userId: item.user_id,
      createdAt: new Date(item.created_at).getTime(),
      updatedAt: new Date(item.updated_at).getTime(),
      bookmarkCount: item.bookmark_count || 0,
      isPublic: item.is_public || false
    }));
    
    return collections;
  } catch (error) {
    console.error('Error fetching collections by IDs:', error);
    return [];
  }
} 