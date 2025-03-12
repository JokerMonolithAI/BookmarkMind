// 任务状态类型
export interface TaskStatus {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  error?: string;
}

// 脑图节点类型
export interface MindMapNode {
  id: string;
  type: string;  // 'centerNode' | 'categoryNode' | 'branchNode' | 'bookmarkNode' | 'conceptNode' | 'topicNode' | 'detailNode'
  data: {
    label: string;
    url?: string;
    branchIndex?: number;
    title?: string;  // 详情节点的主题
    summary?: string;  // 详情节点的总结
    parentId?: string;  // 父节点ID，用于关联
    content?: string;  // 结构化节点的内容
    isStructured?: boolean;  // 是否为结构化节点
    structureType?: 'url' | 'title' | 'summary';  // 结构化节点类型
    file?: string;  // 文件名
  };
  position: {
    x: number;
    y: number;
  };
}

// 脑图连线类型
export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: {
    branchIndex?: number;
  };
}

// 脑图数据类型
export interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
} 