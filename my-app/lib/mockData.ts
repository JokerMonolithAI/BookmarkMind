import { TaskStatus, MindMapData } from '@/types/mindmap';

// 模拟脑图数据
export const mockMindMapData: Record<string, MindMapData> = {
  // 全局脑图数据 - 当选择"我的脑图"时使用
  all: {
    nodes: [
      {
        id: 'center',
        type: 'centerNode',
        data: { label: '我的书签' },
        position: { x: 0, y: 0 }
      },
      // 分支节点 - 左侧
      {
        id: 'cat1',
        type: 'branchNode',
        data: { label: '技术文档', branchIndex: 1 },
        position: { x: -300, y: -150 }
      },
      {
        id: 'cat3',
        type: 'branchNode',
        data: { label: '工作相关', branchIndex: 3 },
        position: { x: -300, y: 150 }
      },
      {
        id: 'cat5',
        type: 'branchNode',
        data: { label: '生活服务', branchIndex: 5 },
        position: { x: -300, y: 0 }
      },
      // 分支节点 - 右侧
      {
        id: 'cat2',
        type: 'branchNode',
        data: { label: '学习资源', branchIndex: 2 },
        position: { x: 300, y: -150 }
      },
      {
        id: 'cat4',
        type: 'branchNode',
        data: { label: '娱乐休闲', branchIndex: 4 },
        position: { x: 300, y: 150 }
      },
      {
        id: 'cat6',
        type: 'branchNode',
        data: { label: '社交媒体', branchIndex: 6 },
        position: { x: 300, y: 0 }
      },
      // 子主题节点 - 技术文档下的书签
      {
        id: 'topic1-1',
        type: 'topicNode',
        data: { label: 'MDN Web 文档', parentId: 'cat1', url: 'https://developer.mozilla.org/' },
        position: { x: -500, y: -190 }
      },
      {
        id: 'topic1-2',
        type: 'topicNode',
        data: { label: 'React 官方文档', parentId: 'cat1', url: 'https://reactjs.org/' },
        position: { x: -500, y: -150 }
      },
      {
        id: 'topic1-3',
        type: 'topicNode',
        data: { label: 'Next.js 文档', parentId: 'cat1', url: 'https://nextjs.org/docs' },
        position: { x: -500, y: -110 }
      },
      // 学习资源下的书签
      {
        id: 'topic2-1',
        type: 'topicNode',
        data: { label: 'Coursera', parentId: 'cat2', url: 'https://www.coursera.org/' },
        position: { x: 500, y: -190 }
      },
      {
        id: 'topic2-2',
        type: 'topicNode',
        data: { label: 'edX', parentId: 'cat2', url: 'https://www.edx.org/' },
        position: { x: 500, y: -150 }
      },
      {
        id: 'topic2-3',
        type: 'topicNode',
        data: { label: 'Khan Academy', parentId: 'cat2', url: 'https://www.khanacademy.org/' },
        position: { x: 500, y: -110 }
      },
      // 工作相关下的书签
      {
        id: 'topic3-1',
        type: 'topicNode',
        data: { label: 'LinkedIn', parentId: 'cat3', url: 'https://www.linkedin.com/' },
        position: { x: -500, y: 110 }
      },
      {
        id: 'topic3-2',
        type: 'topicNode',
        data: { label: 'Notion', parentId: 'cat3', url: 'https://www.notion.so/' },
        position: { x: -500, y: 150 }
      },
      {
        id: 'topic3-3',
        type: 'topicNode',
        data: { label: 'Trello', parentId: 'cat3', url: 'https://trello.com/' },
        position: { x: -500, y: 190 }
      },
      // 娱乐休闲下的书签
      {
        id: 'topic4-1',
        type: 'topicNode',
        data: { label: 'YouTube', parentId: 'cat4', url: 'https://www.youtube.com/' },
        position: { x: 500, y: 110 }
      },
      {
        id: 'topic4-2',
        type: 'topicNode',
        data: { label: 'Netflix', parentId: 'cat4', url: 'https://www.netflix.com/' },
        position: { x: 500, y: 150 }
      },
      {
        id: 'topic4-3',
        type: 'topicNode',
        data: { label: 'Spotify', parentId: 'cat4', url: 'https://www.spotify.com/' },
        position: { x: 500, y: 190 }
      },
      // 生活服务下的书签
      {
        id: 'topic5-1',
        type: 'topicNode',
        data: { label: '美团', parentId: 'cat5', url: 'https://www.meituan.com/' },
        position: { x: -500, y: -40 }
      },
      {
        id: 'topic5-2',
        type: 'topicNode',
        data: { label: '饿了么', parentId: 'cat5', url: 'https://www.ele.me/' },
        position: { x: -500, y: 0 }
      },
      {
        id: 'topic5-3',
        type: 'topicNode',
        data: { label: '12306', parentId: 'cat5', url: 'https://www.12306.cn/' },
        position: { x: -500, y: 40 }
      },
      // 社交媒体下的书签
      {
        id: 'topic6-1',
        type: 'topicNode',
        data: { label: '微博', parentId: 'cat6', url: 'https://weibo.com/' },
        position: { x: 500, y: -40 }
      },
      {
        id: 'topic6-2',
        type: 'topicNode',
        data: { label: '知乎', parentId: 'cat6', url: 'https://www.zhihu.com/' },
        position: { x: 500, y: 0 }
      },
      {
        id: 'topic6-3',
        type: 'topicNode',
        data: { label: 'Twitter', parentId: 'cat6', url: 'https://twitter.com/' },
        position: { x: 500, y: 40 }
      },
      
      // 详情节点 - 为部分子主题添加详情
      {
        id: 'detail-topic1-1',
        type: 'detailNode',
        data: { 
          label: 'MDN Web 文档详情',
          parentId: 'topic1-1',
          url: 'https://developer.mozilla.org/',
          title: 'Web 开发技术文档',
          summary: 'MDN Web 文档是一个提供 Web 技术和促进 Web 标准的学习平台。包含 HTML、CSS、JavaScript 等详细教程和参考资料。'
        },
        position: { x: -700, y: -190 }
      },
      {
        id: 'detail-topic2-1',
        type: 'detailNode',
        data: { 
          label: 'Coursera 详情',
          parentId: 'topic2-1',
          url: 'https://www.coursera.org/',
          title: '在线学习平台',
          summary: 'Coursera 提供来自世界顶尖大学和公司的在线课程，涵盖计算机科学、商业、数据科学等多个领域。'
        },
        position: { x: 700, y: -190 }
      },
      {
        id: 'detail-topic6-1',
        type: 'detailNode',
        data: { 
          label: '微博详情',
          parentId: 'topic6-1',
          url: 'https://weibo.com/',
          title: '中国社交媒体平台',
          summary: '微博是中国流行的社交媒体平台，用户可以发布短文、图片和视频，关注感兴趣的人和话题。'
        },
        position: { x: 700, y: -40 }
      }
    ],
    edges: [
      // 中心到分类的连接
      { id: 'e-center-cat1', source: 'center', target: 'cat1', type: 'branchEdge', data: { branchIndex: 1 } },
      { id: 'e-center-cat2', source: 'center', target: 'cat2', type: 'branchEdge', data: { branchIndex: 2 } },
      { id: 'e-center-cat3', source: 'center', target: 'cat3', type: 'branchEdge', data: { branchIndex: 3 } },
      { id: 'e-center-cat4', source: 'center', target: 'cat4', type: 'branchEdge', data: { branchIndex: 4 } },
      { id: 'e-center-cat5', source: 'center', target: 'cat5', type: 'branchEdge', data: { branchIndex: 5 } },
      { id: 'e-center-cat6', source: 'center', target: 'cat6', type: 'branchEdge', data: { branchIndex: 6 } },
      // 分类到书签的连接
      { id: 'e-cat1-topic1-1', source: 'cat1', target: 'topic1-1', type: 'topicEdge', data: { branchIndex: 1 } },
      { id: 'e-cat1-topic1-2', source: 'cat1', target: 'topic1-2', type: 'topicEdge', data: { branchIndex: 1 } },
      { id: 'e-cat1-topic1-3', source: 'cat1', target: 'topic1-3', type: 'topicEdge', data: { branchIndex: 1 } },
      { id: 'e-cat2-topic2-1', source: 'cat2', target: 'topic2-1', type: 'topicEdge', data: { branchIndex: 2 } },
      { id: 'e-cat2-topic2-2', source: 'cat2', target: 'topic2-2', type: 'topicEdge', data: { branchIndex: 2 } },
      { id: 'e-cat2-topic2-3', source: 'cat2', target: 'topic2-3', type: 'topicEdge', data: { branchIndex: 2 } },
      { id: 'e-cat3-topic3-1', source: 'cat3', target: 'topic3-1', type: 'topicEdge', data: { branchIndex: 3 } },
      { id: 'e-cat3-topic3-2', source: 'cat3', target: 'topic3-2', type: 'topicEdge', data: { branchIndex: 3 } },
      { id: 'e-cat3-topic3-3', source: 'cat3', target: 'topic3-3', type: 'topicEdge', data: { branchIndex: 3 } },
      { id: 'e-cat4-topic4-1', source: 'cat4', target: 'topic4-1', type: 'topicEdge', data: { branchIndex: 4 } },
      { id: 'e-cat4-topic4-2', source: 'cat4', target: 'topic4-2', type: 'topicEdge', data: { branchIndex: 4 } },
      { id: 'e-cat4-topic4-3', source: 'cat4', target: 'topic4-3', type: 'topicEdge', data: { branchIndex: 4 } },
      { id: 'e-cat5-topic5-1', source: 'cat5', target: 'topic5-1', type: 'topicEdge', data: { branchIndex: 5 } },
      { id: 'e-cat5-topic5-2', source: 'cat5', target: 'topic5-2', type: 'topicEdge', data: { branchIndex: 5 } },
      { id: 'e-cat5-topic5-3', source: 'cat5', target: 'topic5-3', type: 'topicEdge', data: { branchIndex: 5 } },
      { id: 'e-cat6-topic6-1', source: 'cat6', target: 'topic6-1', type: 'topicEdge', data: { branchIndex: 6 } },
      { id: 'e-cat6-topic6-2', source: 'cat6', target: 'topic6-2', type: 'topicEdge', data: { branchIndex: 6 } },
      { id: 'e-cat6-topic6-3', source: 'cat6', target: 'topic6-3', type: 'topicEdge', data: { branchIndex: 6 } },
      
      // 子主题到详情节点的连接
      { id: 'e-topic1-1-detail', source: 'topic1-1', target: 'detail-topic1-1', type: 'detail', data: { branchIndex: 1 } },
      { id: 'e-topic2-1-detail', source: 'topic2-1', target: 'detail-topic2-1', type: 'detail', data: { branchIndex: 2 } },
      { id: 'e-topic6-1-detail', source: 'topic6-1', target: 'detail-topic6-1', type: 'detail', data: { branchIndex: 6 } }
    ]
  },
  
  // 分类1的脑图数据
  cat1: {
    nodes: [
      {
        id: 'center',
        type: 'centerNode',
        data: { label: '技术文档' },
        position: { x: 0, y: 0 }
      },
      {
        id: 'topic1-1',
        type: 'topicNode',
        data: { label: 'MDN Web 文档', parentId: 'cat1', url: 'https://developer.mozilla.org/' },
        position: { x: -500, y: -190 }
      },
      {
        id: 'topic1-2',
        type: 'topicNode',
        data: { label: 'React 官方文档', parentId: 'cat1', url: 'https://reactjs.org/' },
        position: { x: -500, y: -150 }
      },
      {
        id: 'topic1-3',
        type: 'topicNode',
        data: { label: 'Next.js 文档', parentId: 'cat1', url: 'https://nextjs.org/docs' },
        position: { x: -500, y: -110 }
      },
      {
        id: 'bookmark3',
        type: 'bookmarkNode',
        data: { label: 'TypeScript手册', url: 'https://www.typescriptlang.org/docs/' },
        position: { x: -200, y: 100 }
      },
      {
        id: 'bookmark4',
        type: 'bookmarkNode',
        data: { label: 'Tailwind CSS文档', url: 'https://tailwindcss.com/docs' },
        position: { x: 200, y: 100 }
      },
      // 三级节点示例 - 关键概念
      {
        id: 'concept1',
        type: 'conceptNode',
        data: { label: 'App Router' },
        position: { x: -300, y: -150 }
      },
      {
        id: 'concept2',
        type: 'conceptNode',
        data: { label: 'Server Components' },
        position: { x: -300, y: -50 }
      },
      {
        id: 'concept3',
        type: 'conceptNode',
        data: { label: 'Hooks API' },
        position: { x: 300, y: -150 }
      },
      {
        id: 'concept4',
        type: 'conceptNode',
        data: { label: 'Context API' },
        position: { x: 300, y: -50 }
      }
    ],
    edges: [
      { id: 'e-center-topic1-1', source: 'center', target: 'topic1-1', type: 'topicEdge', data: { branchIndex: 1 } },
      { id: 'e-center-topic1-2', source: 'center', target: 'topic1-2', type: 'topicEdge', data: { branchIndex: 1 } },
      { id: 'e-center-topic1-3', source: 'center', target: 'topic1-3', type: 'topicEdge', data: { branchIndex: 1 } },
      { id: 'e-center-bookmark3', source: 'center', target: 'bookmark3', type: 'branchEdge', data: { branchIndex: 1 } },
      { id: 'e-center-bookmark4', source: 'center', target: 'bookmark4', type: 'branchEdge', data: { branchIndex: 1 } },
      { id: 'e-topic1-1-concept1', source: 'topic1-1', target: 'concept1', type: 'topicEdge', data: { branchIndex: 1 } },
      { id: 'e-topic1-2-concept2', source: 'topic1-2', target: 'concept2', type: 'topicEdge', data: { branchIndex: 1 } },
      { id: 'e-topic1-3-concept3', source: 'topic1-3', target: 'concept3', type: 'topicEdge', data: { branchIndex: 1 } },
      { id: 'e-bookmark3-concept4', source: 'bookmark3', target: 'concept4', type: 'topicEdge', data: { branchIndex: 1 } }
    ]
  },
  
  // 分类2的脑图数据
  cat2: {
    nodes: [
      {
        id: 'center',
        type: 'centerNode',
        data: { label: '学习资源' },
        position: { x: 0, y: 0 }
      },
      {
        id: 'topic2-1',
        type: 'topicNode',
        data: { label: 'Coursera', parentId: 'cat2', url: 'https://www.coursera.org/' },
        position: { x: 500, y: -190 }
      },
      {
        id: 'topic2-2',
        type: 'topicNode',
        data: { label: 'edX', parentId: 'cat2', url: 'https://www.edx.org/' },
        position: { x: 500, y: -150 }
      },
      {
        id: 'bookmark3',
        type: 'bookmarkNode',
        data: { label: 'Udemy', url: 'https://www.udemy.com/' },
        position: { x: -200, y: 100 }
      },
      {
        id: 'bookmark4',
        type: 'bookmarkNode',
        data: { label: 'Khan Academy', url: 'https://www.khanacademy.org/' },
        position: { x: 200, y: 100 }
      },
      // 子主题
      {
        id: 'topic1',
        type: 'topicNode',
        data: { label: '机器学习' },
        position: { x: -300, y: -150 }
      },
      {
        id: 'topic2',
        type: 'topicNode',
        data: { label: '数据科学' },
        position: { x: -300, y: -50 }
      },
      {
        id: 'topic3',
        type: 'topicNode',
        data: { label: '计算机科学' },
        position: { x: 300, y: -150 }
      }
    ],
    edges: [
      { id: 'e-center-topic2-1', source: 'center', target: 'topic2-1', type: 'topicEdge', data: { branchIndex: 2 } },
      { id: 'e-center-topic2-2', source: 'center', target: 'topic2-2', type: 'topicEdge', data: { branchIndex: 2 } },
      { id: 'e-center-bookmark3', source: 'center', target: 'bookmark3', type: 'branchEdge', data: { branchIndex: 2 } },
      { id: 'e-center-bookmark4', source: 'center', target: 'bookmark4', type: 'branchEdge', data: { branchIndex: 2 } },
      { id: 'e-topic2-1-topic1', source: 'topic2-1', target: 'topic1', type: 'topicEdge', data: { branchIndex: 2 } },
      { id: 'e-topic2-2-topic2', source: 'topic2-2', target: 'topic2', type: 'topicEdge', data: { branchIndex: 2 } },
      { id: 'e-bookmark3-topic3', source: 'bookmark3', target: 'topic3', type: 'topicEdge', data: { branchIndex: 2 } }
    ]
  },
  
  // 分类3的脑图数据
  cat3: {
    nodes: [
      {
        id: 'center',
        type: 'centerNode',
        data: { label: '工作相关' },
        position: { x: 0, y: 0 }
      },
      {
        id: 'topic3-1',
        type: 'topicNode',
        data: { label: 'LinkedIn', parentId: 'cat3', url: 'https://www.linkedin.com/' },
        position: { x: -500, y: 110 }
      },
      {
        id: 'topic3-2',
        type: 'topicNode',
        data: { label: 'Notion', parentId: 'cat3', url: 'https://www.notion.so/' },
        position: { x: -500, y: 150 }
      },
      {
        id: 'topic3-3',
        type: 'topicNode',
        data: { label: 'Trello', parentId: 'cat3', url: 'https://trello.com/' },
        position: { x: -500, y: 190 }
      },
      {
        id: 'bookmark3',
        type: 'bookmarkNode',
        data: { label: 'Slack', url: 'https://slack.com/' },
        position: { x: -200, y: 100 }
      },
      {
        id: 'bookmark4',
        type: 'bookmarkNode',
        data: { label: 'Microsoft Teams', url: 'https://www.microsoft.com/microsoft-teams/' },
        position: { x: 200, y: 100 }
      },
      // 子主题
      {
        id: 'topic1',
        type: 'topicNode',
        data: { label: '项目管理' },
        position: { x: -300, y: -150 }
      },
      {
        id: 'topic2',
        type: 'topicNode',
        data: { label: '知识管理' },
        position: { x: 300, y: -150 }
      },
      {
        id: 'topic3',
        type: 'topicNode',
        data: { label: '团队协作' },
        position: { x: -300, y: 150 }
      }
    ],
    edges: [
      { id: 'e-center-topic3-1', source: 'center', target: 'topic3-1', type: 'topicEdge', data: { branchIndex: 3 } },
      { id: 'e-center-topic3-2', source: 'center', target: 'topic3-2', type: 'topicEdge', data: { branchIndex: 3 } },
      { id: 'e-center-topic3-3', source: 'center', target: 'topic3-3', type: 'topicEdge', data: { branchIndex: 3 } },
      { id: 'e-center-bookmark3', source: 'center', target: 'bookmark3', type: 'branchEdge', data: { branchIndex: 3 } },
      { id: 'e-center-bookmark4', source: 'center', target: 'bookmark4', type: 'branchEdge', data: { branchIndex: 3 } },
      { id: 'e-topic3-1-topic1', source: 'topic3-1', target: 'topic1', type: 'topicEdge', data: { branchIndex: 3 } },
      { id: 'e-topic3-2-topic2', source: 'topic3-2', target: 'topic2', type: 'topicEdge', data: { branchIndex: 3 } },
      { id: 'e-topic3-3-topic3', source: 'topic3-3', target: 'topic3', type: 'topicEdge', data: { branchIndex: 3 } },
      { id: 'e-bookmark3-topic1', source: 'bookmark3', target: 'topic1', type: 'topicEdge', data: { branchIndex: 3 } },
      { id: 'e-bookmark4-topic2', source: 'bookmark4', target: 'topic2', type: 'topicEdge', data: { branchIndex: 3 } }
    ]
  }
};

// 模拟任务状态数据
export const mockTaskStatus: Record<string, TaskStatus> = {
  initial: {
    taskId: 'task-123',
    status: 'processing',
    progress: 0,
    stage: 'initializing'
  },
  progress25: {
    taskId: 'task-123',
    status: 'processing',
    progress: 25,
    stage: 'collecting'
  },
  progress50: {
    taskId: 'task-123',
    status: 'processing',
    progress: 50,
    stage: 'analyzing'
  },
  progress75: {
    taskId: 'task-123',
    status: 'processing',
    progress: 75,
    stage: 'generating'
  },
  completed: {
    taskId: 'task-123',
    status: 'completed',
    progress: 100,
    stage: 'completed'
  },
  failed: {
    taskId: 'task-123',
    status: 'failed',
    progress: 30,
    stage: 'analyzing',
    error: '分析过程中出现错误'
  }
}; 