import { Bookmark, BrowserType } from '@/types/bookmark'

export async function parseBookmarkFile(file: File, browserType: BrowserType): Promise<Bookmark[]> {
  const content = await file.text()
  
  // 根据不同浏览器类型解析书签
  switch (browserType) {
    case 'chrome':
    case 'edge':
      return parseChromiumBookmarks(content)
    case 'firefox':
      return parseFirefoxBookmarks(content)
    default:
      throw new Error('Unsupported browser type')
  }
}

function parseChromiumBookmarks(content: string): Bookmark[] {
  try {
    const bookmarks: Bookmark[] = []
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const links = doc.getElementsByTagName('a')

    for (const link of links) {
      bookmarks.push({
        url: link.href,
        title: link.textContent || '',
        addedAt: new Date(Number(link.getAttribute('add_date')) * 1000),
        tags: link.getAttribute('tags')?.split(',') || []
      })
    }

    return bookmarks
  } catch (error) {
    console.error('Error parsing Chromium bookmarks:', error)
    throw new Error('Invalid bookmark file format')
  }
}

function parseFirefoxBookmarks(content: string): Bookmark[] {
  // Firefox书签解析逻辑类似，这里简化处理
  return parseChromiumBookmarks(content)
} 