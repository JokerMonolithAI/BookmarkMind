'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  ConnectionLineType,
  Panel,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { nodeTypes as nodeTypesMap } from './MindMapNodes';
import { edgeTypes as edgeTypesMap } from './MindMapEdges';
import { transformToReactFlowFormat } from '@/lib/mindmapLayout';
import { MindMapData } from '@/types/mindmap';

// 自定义样式
const flowStyles = {
  width: '100%',
  height: '100%',
  background: '#ffffff', // 恢复为白色背景
};

// 自定义边配置
const defaultEdgeOptions = {
  animated: false,
  style: {
    strokeWidth: 0.5,
  },
  zIndex: 5,
};

// 视图配置
const fitViewOptions = {
  padding: 0.3,
  minZoom: 0.5,
  maxZoom: 1.5,
};

// 将节点类型和边类型定义在组件外部，避免不必要的重新渲染
const nodeTypes = nodeTypesMap;
const edgeTypes = edgeTypesMap;

interface EnhancedMindMapProps {
  data: MindMapData;
}

function EnhancedMindMap({ data }: EnhancedMindMapProps) {
  // 转换数据格式以适应 ReactFlow
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    console.log('Transforming data to ReactFlow format:', data);
    return transformToReactFlowFormat(data);
  }, [data]);

  // 使用 useNodesState 和 useEdgesState 来管理节点和边的状态
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // 存储收缩状态的映射
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  
  // 存储节点的原始位置，用于在收起/展开时恢复
  const [originalPositions, setOriginalPositions] = useState<Record<string, { x: number, y: number }>>({});
  
  // 初始化原始位置
  useEffect(() => {
    const positions: Record<string, { x: number, y: number }> = {};
    initialNodes.forEach(node => {
      positions[node.id] = { ...node.position };
    });
    setOriginalPositions(positions);
  }, [initialNodes]);

  // 处理节点收缩/展开
  const handleNodeToggle = useCallback((nodeId: string, isCollapsed: boolean) => {
    console.log('Toggle node:', nodeId, 'isCollapsed:', isCollapsed);
    
    // 更新收缩状态映射
    setCollapsedNodes(prev => ({
      ...prev,
      [nodeId]: isCollapsed
    }));
    
    // 找到被收缩/展开的节点
    const toggledNode = nodes.find(node => node.id === nodeId);
    if (!toggledNode) {
      console.error('找不到被切换的节点:', nodeId);
      return;
    }
    
    console.log('切换节点类型:', toggledNode.type, '标签:', toggledNode.data.label);
    
    // 找到所有与该节点相关的直接子节点
    const directChildNodeIds = edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);
    
    console.log('直接子节点数量:', directChildNodeIds.length, '节点ID:', directChildNodeIds);
    
    // 所有节点类型都只处理直接子节点
    // 更新节点可见性
    setNodes(prevNodes => 
      prevNodes.map(node => {
        // 如果是直接子节点，则根据父节点的收缩状态设置可见性
        if (directChildNodeIds.includes(node.id)) {
          return {
            ...node,
            hidden: isCollapsed
          };
        }
        return node;
      })
    );
    
    // 更新边的可见性
    setEdges(prevEdges => 
      prevEdges.map(edge => {
        // 如果边的源节点是被收缩/展开的节点，且目标节点是直接子节点，则设置可见性
        if (edge.source === nodeId && directChildNodeIds.includes(edge.target)) {
          return {
            ...edge,
            hidden: isCollapsed
          };
        }
        return edge;
      })
    );
    
    // 如果是展开操作，确保所有子节点的折叠状态保持不变
    if (!isCollapsed) {
      // 对于每个直接子节点，根据其在collapsedNodes中的状态决定其子节点的可见性
      directChildNodeIds.forEach(childId => {
        const childIsCollapsed = collapsedNodes[childId] || false;
        
        // 如果子节点是折叠状态，确保其子节点保持隐藏
        if (childIsCollapsed) {
          const grandChildIds = edges
            .filter(edge => edge.source === childId)
            .map(edge => edge.target);
          
          if (grandChildIds.length > 0) {
            // 更新孙子节点的可见性
            setNodes(prevNodes => 
              prevNodes.map(node => {
                if (grandChildIds.includes(node.id)) {
                  return {
                    ...node,
                    hidden: true
                  };
                }
                return node;
              })
            );
            
            // 更新相关边的可见性
            setEdges(prevEdges => 
              prevEdges.map(edge => {
                if (edge.source === childId && grandChildIds.includes(edge.target)) {
                  return {
                    ...edge,
                    hidden: true
                  };
                }
                return edge;
              })
            );
          }
        }
      });
    }
  }, [nodes, edges, setNodes, setEdges, collapsedNodes]);

  // 当收缩状态变化时，重新计算节点位置
  useEffect(() => {
    // 如果没有节点或原始位置数据，则跳过
    if (nodes.length === 0 || Object.keys(originalPositions).length === 0) return;
    
    console.log('Recalculating node positions based on collapsed state');
    
    // 添加一个标志，防止无限循环
    let hasChanges = false;
    
    // 获取所有主题节点
    const topicNodes = nodes.filter(node => node.type === 'topicNode');
    
    // 创建一个新的节点数组，用于更新位置
    const updatedNodes = [...nodes];
    
    // 遍历每个主题节点，调整其相关的详情节点位置
    topicNodes.forEach(topicNode => {
      // 检查该主题节点是否被收起
      const isCollapsed = collapsedNodes[topicNode.id] || false;
      
      // 如果主题节点被收起，则跳过（因为其子节点已经被隐藏）
      if (isCollapsed) return;
      
      // 找到与该主题节点相关的所有详情节点
      const relatedDetailNodeIds = edges
        .filter(edge => edge.source === topicNode.id && !edge.hidden)
        .map(edge => edge.target);
      
      // 获取可见的详情节点
      const visibleDetailNodes = updatedNodes
        .filter(node => relatedDetailNodeIds.includes(node.id) && !node.hidden)
        .sort((a, b) => {
          // 根据节点类型排序：url -> title -> summary -> file
          const getTypeOrder = (node: Node) => {
            if (node.data.isStructured) {
              switch (node.data.structureType) {
                case 'url': return 1;
                case 'title': return 2;
                case 'summary': return 3;
                default: return 4;
              }
            } else if (node.type === 'fileNode') {
              return 5;
            } else {
              return 6;
            }
          };
          return getTypeOrder(a) - getTypeOrder(b);
        });
      
      // 如果没有可见的详情节点，则跳过
      if (visibleDetailNodes.length === 0) return;
      
      // 获取主题节点的位置
      const topicX = topicNode.position.x;
      const topicY = topicNode.position.y;
      
      // 根据主题节点文本长度动态调整详情节点到主题的距离
      const topicLabelLength = topicNode.data.label?.length || 0;
      const estimatedTopicWidth = Math.max(120, topicLabelLength * 8 + 40); // 加40px作为padding和折叠图标的空间
      
      // 详情节点的基础位置 - 所有详情节点在子主题节点右侧
      const detailBaseX = topicX + Math.max(180, estimatedTopicWidth / 2 + 50); // 确保至少有50px的间距
      
      // 详情节点的垂直间距
      const detailVerticalSpacing = 60;
      
      // 获取与该主题节点相关的所有可见详情节点数量
      const visibleDetailCount = visibleDetailNodes.length;
      
      // 计算详情节点的垂直分布
      const totalDetailHeight = (visibleDetailCount - 1) * detailVerticalSpacing;
      const detailStartY = topicY - totalDetailHeight / 2; // 第一个详情节点的Y坐标
      
      // 重新计算每个可见详情节点的位置
      visibleDetailNodes.forEach((detailNode, index) => {
        // 计算垂直偏移 - 根据节点类型
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
        
        // 计算新位置
        const newX = detailBaseX;
        const newY = topicY + verticalOffset;
        
        // 检查位置是否有变化
        const nodeIndex = updatedNodes.findIndex(n => n.id === detailNode.id);
        if (nodeIndex !== -1) {
          const currentNode = updatedNodes[nodeIndex];
          // 只有当位置有明显变化时才更新
          if (Math.abs(currentNode.position.x - newX) > 1 || Math.abs(currentNode.position.y - newY) > 1) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: { x: newX, y: newY }
            };
            hasChanges = true;
          }
        }
      });
    });
    
    // 只有当有变化时才更新节点
    if (hasChanges) {
      setNodes(updatedNodes);
    }
    
  // 减少依赖项，只在collapsedNodes变化时重新计算
  }, [collapsedNodes, edges, originalPositions, setNodes]);

  // 为节点添加收缩/展开回调
  const nodesWithCallbacks = useMemo(() => {
    return nodes.map(node => {
      // 为中心节点、分支节点和主题节点添加收缩/展开回调
      if (node.type === 'centerNode' || node.type === 'branchNode' || node.type === 'topicNode') {
        return {
          ...node,
          data: {
            ...node.data,
            onToggleCollapse: handleNodeToggle,
            isCollapsed: collapsedNodes[node.id] || false,
            id: node.id // 确保节点ID被正确传递
          }
        };
      }
      return node;
    });
  }, [nodes, handleNodeToggle, collapsedNodes]);

  // 打印节点和边的信息，帮助调试
  useMemo(() => {
    console.log('Nodes:', nodesWithCallbacks);
    console.log('Edges:', edges);
  }, [nodesWithCallbacks, edges]);

  return (
    <div style={flowStyles}>
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.Bezier}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.2}
        maxZoom={2}
        fitView
        fitViewOptions={fitViewOptions}
        defaultEdgeOptions={defaultEdgeOptions}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        onNodeClick={(event, node) => {
          if (node.type !== 'topicNode') {
            event.stopPropagation();
          }
        }}
        zoomOnScroll={true}
        panOnScroll={false}
        panOnDrag={true}
        snapToGrid={false}
        snapGrid={[15, 15]}
      >
        <Background color="#f0f0f0" gap={20} size={1} />
        <Controls 
          showInteractive={false}
          position="bottom-right"
        />
        <Panel position="top-left" className="debug-panel">
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div>节点数: {nodes.length}</div>
            <div>连线数: {edges.length}</div>
            <div>节点类型: {nodes.map(n => n.type).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</div>
            <div>边类型: {edges.map(e => e.type).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

// 导出带有 Provider 的组件
export default function EnhancedMindMapWithProvider(props: EnhancedMindMapProps) {
  return (
    <ReactFlowProvider>
      <EnhancedMindMap {...props} />
    </ReactFlowProvider>
  );
} 