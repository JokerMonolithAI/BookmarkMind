'use client';

import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  ConnectionLineType,
  Panel,
  useNodesState,
  useEdgesState,
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
  background: '#ffffff',
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

  // 打印节点和边的信息，帮助调试
  useMemo(() => {
    console.log('Nodes:', nodes);
    console.log('Edges:', edges);
  }, [nodes, edges]);

  return (
    <div style={flowStyles}>
      <ReactFlow
        nodes={nodes}
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
        elementsSelectable={false}
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