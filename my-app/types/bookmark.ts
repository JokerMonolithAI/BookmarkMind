export interface Bookmark {
  id?: string
  url: string
  title: string
  description?: string
  favicon?: string
  addedAt: Date
  folderId?: string
  tags?: string[]
}

export interface BookmarkFolder {
  id: string
  name: string
  parentId?: string
}

export type BrowserType = 'chrome' | 'firefox' | 'edge' | 'safari' 