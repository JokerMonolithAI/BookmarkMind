import { Node, Edge } from 'reactflow';
import { MindMapData, MindMapNode } from '@/types/mindmap';

// 直接定义颜色映射
const branchColors = {
  1: '#ff7e67', // 红色
  2: '#ffc764', // 黄色
  3: '#6ecb63', // 绿色
  4: '#5fa8d3', // 蓝色
  5: '#8971d0', // 紫色
  6: '#d371ac', // 粉色
  default: '#e0e0e0', // 默认灰色
};

// 将MindMapData转换为ReactFlow格式的节点和边
export function transformToReactFlowFormat(data: MindMapData): { nodes: Node[], edges: Edge[] } {
  // 首先找到中心节点
  const centerNode = data.nodes.find(node => node.type === 'centerNode');
  if (!centerNode) {
    return { nodes: [], edges: [] };
  }

  // 分类节点 - 按照分支索引分组
  const branchNodes = data.nodes.filter(node => 
    node.type === 'branchNode'
  );

  // 子主题节点
  const topicNodes = data.nodes.filter(node => 
    node.type === 'topicNode'
  );

  // 详情节点
  const detailNodes = data.nodes.filter(node => 
    node.type === 'detailNode'
  );

  // 创建ReactFlow节点
  const rfNodes: Node[] = [];
  
  // 创建一个临时数组来存储文件节点的边
  const tempFileEdges: Edge[] = [];
  
  // 添加中心节点
  rfNodes.push({
    id: centerNode.id,
    type: 'centerNode',
    data: { 
      label: centerNode.data.label,
    },
    position: { x: 0, y: 0 }, // 中心位置
  });

  // 计算分支节点位置 - 所有分支节点在中心节点右侧
  const branchCount = branchNodes.length;
  const branchDistance = 200; // 分支节点到中心的水平距离
  
  // 计算分支节点的垂直分布
  const branchVerticalSpacing = 100; // 分支节点之间的垂直间距
  const totalBranchHeight = (branchCount - 1) * branchVerticalSpacing;
  const startY = -totalBranchHeight / 2; // 第一个分支节点的Y坐标
  
  branchNodes.forEach((node, index) => {
    // 计算位置 - 所有分支节点在中心节点右侧，垂直排列
    const x = branchDistance;
    const y = startY + index * branchVerticalSpacing;
    
    // 确定分支索引 (1-6)
    const branchIndex = (index % 6) + 1;
    
    // 添加分支节点
    rfNodes.push({
      id: node.id,
      type: 'branchNode',
      data: { 
        label: node.data.label,
        branchIndex,
      },
      position: { x, y },
    });
  });

  // 处理子主题节点
  const topicsByBranch = new Map<string, MindMapNode[]>();
  
  // 根据连接关系，将子主题分配给对应的分支
  data.edges.forEach(edge => {
    const sourceNode = data.nodes.find(n => n.id === edge.source);
    const targetNode = data.nodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode && 
        sourceNode.type === 'branchNode' && 
        targetNode.type === 'topicNode') {
      if (!topicsByBranch.has(sourceNode.id)) {
        topicsByBranch.set(sourceNode.id, []);
      }
      topicsByBranch.get(sourceNode.id)?.push(targetNode);
    }
  });

  // 为每个分支添加子主题节点
  branchNodes.forEach((branchNode, branchIndex) => {
    const topics = topicsByBranch.get(branchNode.id) || [];
    const topicCount = topics.length;
    
    // 找到分支节点在rfNodes中的位置
    const rfBranchNode = rfNodes.find(n => n.id === branchNode.id);
    if (!rfBranchNode) return;
    
    const branchX = rfBranchNode.position.x;
    const branchY = rfBranchNode.position.y;
    
    // 根据分支节点文本长度动态调整子主题到分支的距离
    // 估算文本宽度 (每个字符约10px，最小宽度为150px)
    const branchLabelLength = branchNode.data.label?.length || 0;
    const estimatedBranchWidth = Math.max(150, branchLabelLength * 10 + 40); // 加40px作为padding和折叠图标的空间
    
    // 子主题到分支的距离 - 根据分支节点文本长度动态调整
    const topicDistance = Math.max(150, estimatedBranchWidth / 2 + 50); // 确保至少有50px的间距
    
    // 子主题之间的间距 - 根据子主题数量动态调整
    const topicSpacing = Math.max(40, Math.min(50, 200 / Math.max(1, topicCount))); // 动态调整间距
    
    // 计算子主题的垂直分布
    const totalTopicHeight = (topicCount - 1) * topicSpacing;
    const topicStartY = branchY - totalTopicHeight / 2; // 第一个子主题节点的Y坐标
    
    topics.forEach((topic, topicIndex) => {
      // 计算子主题位置 - 所有子主题在分支节点右侧，垂直排列
      const x = branchX + topicDistance;
      const y = topicStartY + topicIndex * topicSpacing;
      
      // 添加子主题节点
      rfNodes.push({
        id: topic.id,
        type: 'topicNode',
        data: { 
          label: topic.data.label,
          url: topic.data.url,
          branchIndex: (branchIndex % 6) + 1,
        },
        position: { x, y },
      });

      // 查找与此子主题相关的详情节点
      const relatedDetailNodes = detailNodes.filter(
        detailNode => detailNode.data.parentId === topic.id
      );

      // 查找与此子主题相关的文件节点
      const relatedFileNodes = data.nodes.filter(
        node => node.type === 'fileNode' && node.data.parentId === topic.id
      );

      // 根据主题节点文本长度动态调整详情节点到主题的距离
      const topicLabelLength = topic.data.label?.length || 0;
      const estimatedTopicWidth = Math.max(120, topicLabelLength * 8 + 40); // 加40px作为padding和折叠图标的空间
      
      // 详情节点的基础位置 - 所有详情节点在子主题节点右侧
      const detailBaseX = x + Math.max(180, estimatedTopicWidth / 2 + 50); // 确保至少有50px的间距
      
      // 详情节点的垂直间距
      const detailVerticalSpacing = 60; // 详情节点之间的垂直间距
      
      // 为每个详情节点计算位置并添加到 rfNodes
      relatedDetailNodes.forEach((detailNode) => {
        // 根据结构化节点类型设置垂直偏移
        let verticalOffset = 0;
        if (detailNode.data.isStructured) {
          switch (detailNode.data.structureType) {
            case 'url':
              verticalOffset = -detailVerticalSpacing; // URL节点在上方
              break;
            case 'title':
              verticalOffset = 0; // 标题节点在中间
              break;
            case 'summary':
              verticalOffset = detailVerticalSpacing; // 摘要节点在下方
              break;
            default:
              verticalOffset = 0; // 其他类型的节点在中间
          }
        }
        
        const detailY = y + verticalOffset; // 添加垂直偏移
        
        rfNodes.push({
          id: detailNode.id,
          type: 'detailNode',
          data: { 
            ...detailNode.data,
            branchIndex: (branchIndex % 6) + 1,
          },
          position: { x: detailBaseX, y: detailY },
        });
      });

      // 为每个文件节点计算位置并添加到 rfNodes
      relatedFileNodes.forEach((fileNode) => {
        // 文件节点显示在摘要节点下方
        const fileY = y + detailVerticalSpacing * 1.5; // 调整文件节点位置，使其更接近摘要节点
        
        rfNodes.push({
          id: fileNode.id,
          type: 'fileNode',
          data: { 
            ...fileNode.data,
            branchIndex: (branchIndex % 6) + 1,
          },
          position: { x: detailBaseX, y: fileY },
        });

        // 创建从子主题到文件节点的边
        const color = branchColors[(branchIndex % 6) + 1 as keyof typeof branchColors];
        
        // 将边添加到临时数组中
        tempFileEdges.push({
          id: `e-${topic.id}-${fileNode.id}`,
          source: topic.id,
          target: fileNode.id,
          type: 'detail',
          data: { branchIndex: (branchIndex % 6) + 1, color },
          // 根据位置关系指定连接点
          sourceHandle: 'right-source',
          targetHandle: 'left-target',
          style: { stroke: color, strokeWidth: 0.8, strokeDasharray: '3 2' },
        });
      });
    });
  });

  // 创建边
  const rfEdges: Edge[] = [];
  
  // 中心到分支的边
  branchNodes.forEach((node, index) => {
    const branchIndex = (index % 6) + 1;
    
    // 找到分支节点在rfNodes中的位置
    const rfBranchNode = rfNodes.find(n => n.id === node.id);
    if (!rfBranchNode) return;
    
    // 获取分支颜色
    const color = branchColors[branchIndex as keyof typeof branchColors];
    
    rfEdges.push({
      id: `e-center-${node.id}`,
      source: centerNode.id,
      target: node.id,
      type: 'branch',
      data: { branchIndex, color },
      // 所有边都从中心节点的右侧连接到分支节点的左侧
      sourceHandle: 'right',
      targetHandle: 'left-target',
      style: { stroke: color, strokeWidth: 1.5 },
    });
  });
  
  // 分支到子主题的边
  data.edges.forEach(edge => {
    const sourceNode = data.nodes.find(n => n.id === edge.source);
    const targetNode = data.nodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode && 
        sourceNode.type === 'branchNode' && 
        targetNode.type === 'topicNode') {
      
      // 找到源节点和目标节点在rfNodes中的位置
      const rfSourceNode = rfNodes.find(n => n.id === sourceNode.id);
      const rfTargetNode = rfNodes.find(n => n.id === targetNode.id);
      if (!rfSourceNode || !rfTargetNode) return;
      
      // 获取目标节点（子主题）的分支索引
      const branchIndex = rfTargetNode.data.branchIndex;
      
      // 获取分支颜色
      const color = branchColors[branchIndex as keyof typeof branchColors];
      
      rfEdges.push({
        id: `e-${sourceNode.id}-${targetNode.id}`,
        source: sourceNode.id,
        target: targetNode.id,
        type: 'topic',
        data: { branchIndex, color },
        // 所有边都从分支节点的右侧连接到子主题节点的左侧
        sourceHandle: 'right-source',
        targetHandle: 'left-target',
        style: { stroke: color, strokeWidth: 1 },
      });
    }
  });

  // 子主题到详情节点的边
  data.edges.forEach(edge => {
    const sourceNode = data.nodes.find(n => n.id === edge.source);
    const targetNode = data.nodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode && 
        sourceNode.type === 'topicNode' && 
        targetNode.type === 'detailNode') {
      
      // 找到源节点和目标节点在rfNodes中的位置
      const rfSourceNode = rfNodes.find(n => n.id === sourceNode.id);
      const rfTargetNode = rfNodes.find(n => n.id === targetNode.id);
      if (!rfSourceNode || !rfTargetNode) return;
      
      // 获取目标节点的分支索引
      const branchIndex = rfTargetNode.data.branchIndex;
      
      // 获取分支颜色
      const color = branchColors[branchIndex as keyof typeof branchColors];
      
      rfEdges.push({
        id: `e-${sourceNode.id}-${targetNode.id}`,
        source: sourceNode.id,
        target: targetNode.id,
        type: 'detail',
        data: { branchIndex, color },
        // 所有边都从子主题节点的右侧连接到详情节点的左侧
        sourceHandle: 'right-source',
        targetHandle: 'left-target',
        style: { stroke: color, strokeWidth: 0.8, strokeDasharray: '3 2' },
      });
    }
  });

  // 添加文件节点的边
  rfEdges.push(...tempFileEdges);

  return { nodes: rfNodes, edges: rfEdges };
} 