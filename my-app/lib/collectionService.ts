'use client';

import { db } from '@/lib/firebase';
import { ref, get, set, update, remove, push } from 'firebase/database';

// 收藏集类型
export interface Collection {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  bookmarkCount: number;
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

// 获取用户的所有收藏集
export async function getUserCollections(userId: string): Promise<Collection[]> {
  try {
    const collectionsRef = ref(db, `users/${userId}/collections`);
    const snapshot = await get(collectionsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const collectionsData = snapshot.val();
    const collections: Collection[] = [];
    
    for (const id in collectionsData) {
      collections.push({
        id,
        ...collectionsData[id]
      });
    }
    
    // 按更新时间排序，最新的在前面
    return collections.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
}

// 获取收藏集详情
export async function getCollection(userId: string, collectionId: string): Promise<Collection | null> {
  try {
    const collectionRef = ref(db, `users/${userId}/collections/${collectionId}`);
    const snapshot = await get(collectionRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const collectionData = snapshot.val();
    
    // 获取实际的书签数量
    const bookmarksRef = ref(db, `users/${userId}/collection_bookmarks/${collectionId}`);
    const bookmarksSnapshot = await get(bookmarksRef);
    const actualBookmarkCount = bookmarksSnapshot.exists() ? Object.keys(bookmarksSnapshot.val()).length : 0;
    
    return {
      id: collectionId,
      ...collectionData,
      bookmarkCount: actualBookmarkCount // 使用实际计算的书签数量
    };
  } catch (error) {
    console.error('Error fetching collection:', error);
    throw error;
  }
}

// 创建新收藏集
export async function createCollection(userId: string, data: { name: string; description?: string }): Promise<Collection> {
  try {
    const collectionsRef = ref(db, `users/${userId}/collections`);
    const newCollectionRef = push(collectionsRef);
    const collectionId = newCollectionRef.key as string;
    
    const timestamp = Date.now();
    const newCollection: Omit<Collection, 'id'> = {
      name: data.name,
      description: data.description || '',
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      bookmarkCount: 0
    };
    
    await set(newCollectionRef, newCollection);
    
    return {
      id: collectionId,
      ...newCollection
    };
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
}

// 更新收藏集
export async function updateCollection(
  userId: string, 
  collectionId: string, 
  data: { name?: string; description?: string }
): Promise<void> {
  try {
    const collectionRef = ref(db, `users/${userId}/collections/${collectionId}`);
    
    const updates = {
      ...data,
      updatedAt: Date.now()
    };
    
    await update(collectionRef, updates);
  } catch (error) {
    console.error('Error updating collection:', error);
    throw error;
  }
}

/**
 * 删除收藏集
 * @param userId 用户ID
 * @param collectionId 收藏集ID
 * @returns 删除结果
 */
export async function deleteCollection(userId: string, collectionId: string): Promise<void> {
  try {
    // 删除收藏集本身
    const collectionRef = ref(db, `users/${userId}/collections/${collectionId}`);
    await remove(collectionRef);
    
    // 删除收藏集中的所有书签关联
    const bookmarksRef = ref(db, `users/${userId}/collection_bookmarks/${collectionId}`);
    await remove(bookmarksRef);
    
    console.log(`Collection ${collectionId} deleted for user ${userId}`);
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
}

// 获取收藏集中的所有文件夹
export async function getCollectionFolders(userId: string, collectionId: string): Promise<Folder[]> {
  try {
    const foldersRef = ref(db, `users/${userId}/collection_folders/${collectionId}`);
    const snapshot = await get(foldersRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const foldersData = snapshot.val();
    const folders: Folder[] = [];
    
    for (const id in foldersData) {
      folders.push({
        id,
        ...foldersData[id]
      });
    }
    
    // 按路径排序
    return folders.sort((a, b) => a.path.localeCompare(b.path));
  } catch (error) {
    console.error('Error fetching collection folders:', error);
    throw error;
  }
}

// 创建文件夹
export async function createFolder(
  userId: string, 
  collectionId: string, 
  data: { name: string; parentId?: string }
): Promise<Folder> {
  try {
    const foldersRef = ref(db, `users/${userId}/collection_folders/${collectionId}`);
    const newFolderRef = push(foldersRef);
    const folderId = newFolderRef.key as string;
    
    // 如果有父文件夹，获取父文件夹的路径
    let path = data.name;
    if (data.parentId) {
      const parentFolderRef = ref(db, `users/${userId}/collection_folders/${collectionId}/${data.parentId}`);
      const parentSnapshot = await get(parentFolderRef);
      
      if (parentSnapshot.exists()) {
        const parentFolder = parentSnapshot.val();
        path = `${parentFolder.path}/${data.name}`;
      }
    }
    
    // 创建基本文件夹对象
    const newFolder: Omit<Folder, 'id'> = {
      name: data.name,
      path,
      collectionId
    };
    
    // 只有当parentId有值时才添加到对象中
    if (data.parentId) {
      newFolder.parentId = data.parentId;
    }
    
    await set(newFolderRef, newFolder);
    
    // 更新收藏集的更新时间
    const collectionRef = ref(db, `users/${userId}/collections/${collectionId}`);
    await update(collectionRef, { updatedAt: Date.now() });
    
    return {
      id: folderId,
      ...newFolder
    };
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
}

// 更新文件夹
export async function updateFolder(
  userId: string, 
  collectionId: string, 
  folderId: string, 
  data: { name: string }
): Promise<void> {
  try {
    const folderRef = ref(db, `users/${userId}/collection_folders/${collectionId}/${folderId}`);
    const folderSnapshot = await get(folderRef);
    
    if (!folderSnapshot.exists()) {
      throw new Error('Folder not found');
    }
    
    const folder = folderSnapshot.val();
    
    // 更新文件夹名称和路径
    const oldPathParts = folder.path.split('/');
    oldPathParts[oldPathParts.length - 1] = data.name;
    const newPath = oldPathParts.join('/');
    
    await update(folderRef, { 
      name: data.name,
      path: newPath
    });
    
    // 更新收藏集的更新时间
    const collectionRef = ref(db, `users/${userId}/collections/${collectionId}`);
    await update(collectionRef, { updatedAt: Date.now() });
  } catch (error) {
    console.error('Error updating folder:', error);
    throw error;
  }
}

// 删除文件夹
export async function deleteFolder(userId: string, collectionId: string, folderId: string): Promise<void> {
  try {
    // 获取要删除的文件夹
    const folderRef = ref(db, `users/${userId}/collection_folders/${collectionId}/${folderId}`);
    const folderSnapshot = await get(folderRef);
    
    if (!folderSnapshot.exists()) {
      throw new Error('Folder not found');
    }
    
    const folder = folderSnapshot.val();
    const folderPath = folder.path;
    
    // 获取所有文件夹，检查是否有子文件夹
    const foldersRef = ref(db, `users/${userId}/collection_folders/${collectionId}`);
    const foldersSnapshot = await get(foldersRef);
    
    if (foldersSnapshot.exists()) {
      const foldersData = foldersSnapshot.val();
      
      // 删除所有子文件夹
      for (const id in foldersData) {
        if (id !== folderId && foldersData[id].path.startsWith(`${folderPath}/`)) {
          await remove(ref(db, `users/${userId}/collection_folders/${collectionId}/${id}`));
        }
      }
    }
    
    // 删除文件夹
    await remove(folderRef);
    
    // 更新收藏集的更新时间
    const collectionRef = ref(db, `users/${userId}/collections/${collectionId}`);
    await update(collectionRef, { updatedAt: Date.now() });
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
}

// 修改添加书签到收藏集的函数
export async function addBookmarkToCollection(
  userId: string, 
  collectionId: string, 
  bookmarkData: { url: string; title: string; description?: string } | string
): Promise<void> {
  try {
    let bookmarkId: string;
    
    // 如果传入的是书签数据对象，先创建书签
    if (typeof bookmarkData === 'object') {
      // 这里应该调用创建书签的API
      // 例如: const response = await fetch('/api/bookmarks', { method: 'POST', body: JSON.stringify(bookmarkData) });
      // const result = await response.json();
      // bookmarkId = result.id;
      
      // 模拟创建书签并获取ID
      bookmarkId = `bookmark_${Date.now()}`;
      console.log('Created bookmark:', bookmarkId, bookmarkData);
    } else {
      // 如果传入的是书签ID，直接使用
      bookmarkId = bookmarkData;
    }
    
    // 添加书签到收藏集
    const collectionBookmarksRef = ref(db, `users/${userId}/collection_bookmarks/${collectionId}/${bookmarkId}`);
    const collectionBookmark: CollectionBookmark = {
      collectionId,
      bookmarkId,
      addedAt: Date.now()
    };
    
    await set(collectionBookmarksRef, collectionBookmark);
    
    // 更新收藏集的书签数量和更新时间
    const collectionRef = ref(db, `users/${userId}/collections/${collectionId}`);
    const collectionSnapshot = await get(collectionRef);
    
    if (collectionSnapshot.exists()) {
      const collection = collectionSnapshot.val();
      await update(collectionRef, {
        bookmarkCount: (collection.bookmarkCount || 0) + 1,
        updatedAt: Date.now()
      });
    }
  } catch (error) {
    console.error('Error adding bookmark to collection:', error);
    throw error;
  }
}

// 从收藏集中移除书签
export async function removeBookmarkFromCollection(
  userId: string, 
  collectionId: string, 
  bookmarkId: string
): Promise<void> {
  try {
    // 检查收藏集是否存在
    const collectionRef = ref(db, `users/${userId}/collections/${collectionId}`);
    const collectionSnapshot = await get(collectionRef);
    
    if (!collectionSnapshot.exists()) {
      throw new Error('Collection not found');
    }
    
    // 检查书签是否在收藏集中
    const bookmarkRef = ref(db, `users/${userId}/collection_bookmarks/${collectionId}/${bookmarkId}`);
    const bookmarkSnapshot = await get(bookmarkRef);
    
    if (!bookmarkSnapshot.exists()) {
      return; // 书签不在收藏集中，无需操作
    }
    
    // 删除书签关联
    await remove(bookmarkRef);
    
    // 更新收藏集的书签数量
    const collection = collectionSnapshot.val();
    await update(collectionRef, { 
      bookmarkCount: Math.max((collection.bookmarkCount || 0) - 1, 0),
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error removing bookmark from collection:', error);
    throw error;
  }
}

// 获取收藏集中的所有书签
export async function getCollectionBookmarks(userId: string, collectionId: string): Promise<string[]> {
  try {
    const bookmarksRef = ref(db, `users/${userId}/collection_bookmarks/${collectionId}`);
    const snapshot = await get(bookmarksRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const bookmarksData = snapshot.val();
    return Object.keys(bookmarksData);
  } catch (error) {
    console.error('Error fetching collection bookmarks:', error);
    throw error;
  }
}

// 获取书签所属的所有收藏集
export async function getBookmarkCollections(userId: string, bookmarkId: string): Promise<string[]> {
  try {
    const collectionsRef = ref(db, `users/${userId}/collections`);
    const collectionsSnapshot = await get(collectionsRef);
    
    if (!collectionsSnapshot.exists()) {
      return [];
    }
    
    const collections = collectionsSnapshot.val();
    const collectionIds: string[] = [];
    
    // 检查每个收藏集是否包含该书签
    for (const collectionId in collections) {
      const bookmarkRef = ref(db, `users/${userId}/collection_bookmarks/${collectionId}/${bookmarkId}`);
      const bookmarkSnapshot = await get(bookmarkRef);
      
      if (bookmarkSnapshot.exists()) {
        collectionIds.push(collectionId);
      }
    }
    
    return collectionIds;
  } catch (error) {
    console.error('Error fetching bookmark collections:', error);
    throw error;
  }
} 