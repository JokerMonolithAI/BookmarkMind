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
  
  // 添加中心节点
  rfNodes.push({
    id: centerNode.id,
    type: 'centerNode',
    data: { 
      label: centerNode.data.label,
    },
    position: { x: 0, y: 0 }, // 中心位置
  });

  // 计算分支节点位置 - 放射状布局
  const branchCount = branchNodes.length;
  const radius = 300; // 分支节点到中心的距离
  
  // 定义每个分支的最佳角度 - 使布局更加美观
  const preferredAngles = {
    6: [0, Math.PI/3, 2*Math.PI/3, Math.PI, 4*Math.PI/3, 5*Math.PI/3], // 六个分支
    5: [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI], // 五个分支
    4: [Math.PI/4, 3*Math.PI/4, 5*Math.PI/4, 7*Math.PI/4], // 四个分支
    3: [0, 2*Math.PI/3, 4*Math.PI/3], // 三个分支
    2: [Math.PI/4, 7*Math.PI/4], // 两个分支
    1: [0] // 一个分支
  };
  
  // 获取适合当前分支数量的角度数组
  const angles = preferredAngles[Math.min(branchCount, 6) as keyof typeof preferredAngles] || 
    Array.from({length: branchCount}, (_, i) => (2 * Math.PI * i) / branchCount);
  
  branchNodes.forEach((node, index) => {
    // 使用预定义的角度
    const angle = angles[index % angles.length];
    
    // 计算位置
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
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
    
    // 计算分支节点相对于中心的角度
    const angle = Math.atan2(branchY, branchX);
    
    // 确定子主题的排列方向 - 根据分支节点位置
    const isRightSide = branchX >= 0;
    
    // 子主题到分支的距离
    const topicDistance = 150;
    
    // 子主题之间的间距
    const topicSpacing = 40;
    
    // 子主题的排列方向 - 垂直方向
    const perpendicularAngle = Math.PI / 2; // 垂直向下
    
    topics.forEach((topic, topicIndex) => {
      // 计算子主题在垂直方向上的偏移
      const offset = ((topicIndex - (topicCount - 1) / 2) * topicSpacing);
      
      // 计算子主题位置 - 在分支节点的左侧或右侧
      const x = isRightSide 
        ? branchX + topicDistance // 右侧分支的子主题在右侧
        : branchX - topicDistance; // 左侧分支的子主题在左侧
      
      const y = branchY + offset; // 垂直排列
      
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

      // 为每个详情节点计算位置并添加到 rfNodes
      relatedDetailNodes.forEach((detailNode, detailIndex) => {
        const detailX = isRightSide 
          ? x + 200  // 右侧分支的详情节点在右侧
          : x - 200; // 左侧分支的详情节点在左侧
        
        const detailY = y; // 与子主题节点在同一水平线上
        
        rfNodes.push({
          id: detailNode.id,
          type: 'detailNode',
          data: { 
            ...detailNode.data,
            branchIndex: (branchIndex % 6) + 1,
          },
          position: { x: detailX, y: detailY },
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
    
    // 判断分支节点相对于中心节点的位置
    const isLeftSide = rfBranchNode.position.x < 0;
    
    // 获取分支颜色
    const color = branchColors[branchIndex as keyof typeof branchColors];
    
    rfEdges.push({
      id: `e-center-${node.id}`,
      source: centerNode.id,
      target: node.id,
      type: 'branch',
      data: { branchIndex, color },
      // 根据位置关系指定连接点
      sourceHandle: isLeftSide ? 'left' : 'right',
      targetHandle: isLeftSide ? 'right-target' : 'left-target',
      style: { stroke: color, strokeWidth: 0.75 },
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
      
      // 判断目标节点相对于源节点的位置
      const isLeftSide = rfTargetNode.position.x < rfSourceNode.position.x;
      
      // 获取目标节点（子主题）的分支索引
      const branchIndex = rfTargetNode.data.branchIndex;
      
      // 获取分支颜色
      const color = branchColors[branchIndex as keyof typeof branchColors];
      
      console.log('创建子主题边:', {
        source: sourceNode.id,
        target: targetNode.id,
        branchIndex,
        color,
        targetNodeData: rfTargetNode.data
      });
      
      rfEdges.push({
        id: `e-${sourceNode.id}-${targetNode.id}`,
        source: sourceNode.id,
        target: targetNode.id,
        type: 'topic',
        data: { branchIndex, color },
        // 根据位置关系指定连接点
        sourceHandle: isLeftSide ? 'left-source' : 'right-source',
        targetHandle: isLeftSide ? 'right-target' : 'left-target',
        style: { stroke: color, strokeWidth: 0.5 },
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
      
      // 判断目标节点相对于源节点的位置
      const isLeftSide = rfTargetNode.position.x < rfSourceNode.position.x;
      
      // 获取目标节点的分支索引
      const branchIndex = rfTargetNode.data.branchIndex;
      
      // 获取分支颜色
      const color = branchColors[branchIndex as keyof typeof branchColors];
      
      console.log('创建详情边:', {
        source: sourceNode.id,
        target: targetNode.id,
        branchIndex,
        color,
        targetNodeData: rfTargetNode.data
      });
      
      rfEdges.push({
        id: `e-${sourceNode.id}-${targetNode.id}`,
        source: sourceNode.id,
        target: targetNode.id,
        type: 'detail',
        data: { branchIndex, color },
        // 根据位置关系指定连接点
        sourceHandle: 'right-source',
        targetHandle: 'left-target',
        style: { stroke: color, strokeWidth: 0.5, strokeDasharray: '3 2' },
      });
    }
  });

  return { nodes: rfNodes, edges: rfEdges };
} 