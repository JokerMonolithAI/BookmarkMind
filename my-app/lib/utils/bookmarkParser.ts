import { Bookmark, BrowserType } from '@/types/bookmark'

export async function parseBookmarkFile(file: File, browserType: BrowserType): Promise<Bookmark[]> {
  const content = await file.text()

  switch (browserType) {
    case 'chrome':
      return parseChrome(content)
    case 'firefox':
      return parseFirefox(content)
    case 'edge':
      return parseEdge(content)
    case 'safari':
      return parseSafari(content)
    default:
      throw new Error('Unsupported browser type')
  }
}

// Chrome 书签解析
function parseChrome(content: string): Bookmark[] {
  const bookmarks: Bookmark[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  const links = doc.getElementsByTagName('a')

  for (const link of links) {
    bookmarks.push({
      title: link.textContent || '',
      url: link.getAttribute('href') || '',
      addedAt: new Date(Number(link.getAttribute('add_date')) * 1000),
    })
  }

  return bookmarks
}

// Firefox 书签解析
function parseFirefox(content: string): Bookmark[] {
  const bookmarks: Bookmark[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  const links = doc.getElementsByTagName('a')

  for (const link of links) {
    bookmarks.push({
      title: link.textContent || '',
      url: link.getAttribute('href') || '',
      addedAt: new Date(Number(link.getAttribute('add_date')) * 1000),
    })
  }

  return bookmarks
}

// Edge 书签解析 (基本与 Chrome 相同，因为都基于 Chromium)
function parseEdge(content: string): Bookmark[] {
  return parseChrome(content)
}

// Safari 书签解析
function parseSafari(content: string): Bookmark[] {
  const bookmarks: Bookmark[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  const links = doc.getElementsByTagName('a')

  for (const link of links) {
    bookmarks.push({
      title: link.textContent || '',
      url: link.getAttribute('href') || '',
      // Safari 可能使用不同的时间格式或没有时间信息
      addedAt: new Date(Number(link.getAttribute('add_date')) * 1000 || Date.now()),
    })
  }

  return bookmarks
} 