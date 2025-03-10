'use client';

import React from 'react';
import { MindMapData, MindMapNode, MindMapEdge } from '@/types/mindmap';

// 简单的脑图展示组件
export default function SimpleMindMap({ data }: { data: MindMapData }) {
  if (!data || !data.nodes || !data.edges) {
    return <div className="text-center text-gray-500">无脑图数据</div>;
  }

  // 获取中心节点
  const centerNode = data.nodes.find((node) => node.id === 'center');
  
  // 获取一级节点（直接连接到中心节点的节点）
  const firstLevelEdges = data.edges.filter((edge) => edge.source === 'center');
  const firstLevelNodeIds = firstLevelEdges.map((edge) => edge.target);
  const firstLevelNodes = data.nodes.filter((node) => 
    firstLevelNodeIds.includes(node.id)
  );
  
  // 获取二级节点（连接到一级节点的节点）
  const secondLevelEdges = data.edges.filter((edge) => 
    firstLevelNodeIds.includes(edge.source)
  );
  const secondLevelNodeIds = secondLevelEdges.map((edge) => edge.target);
  const secondLevelNodes = data.nodes.filter((node) => 
    secondLevelNodeIds.includes(node.id)
  );

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-[800px] h-[600px]">
        {/* 中心节点 */}
        {centerNode && (
          <div 
            className="absolute bg-blue-600 text-white rounded-full p-6 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: '50%', 
              top: '50%',
              width: '120px',
              height: '120px',
              zIndex: 10
            }}
          >
            <span className="text-lg font-medium">{centerNode.data.label}</span>
          </div>
        )}
        
        {/* 连接线 - 中心到一级节点 */}
        {firstLevelEdges.map((edge) => {
          const targetNode = data.nodes.find((node) => node.id === edge.target);
          if (!targetNode) return null;
          
          // 计算线的起点和终点
          const startX = '50%';
          const startY = '50%';
          const endX = `${(targetNode.position.x / 800 + 0.5) * 100}%`;
          const endY = `${(targetNode.position.y / 600 + 0.5) * 100}%`;
          
          return (
            <div 
              key={edge.id}
              className="absolute bg-gray-300"
              style={{
                left: startX,
                top: startY,
                width: '2px',
                height: '100px',
                transformOrigin: 'top',
                transform: `rotate(${Math.atan2(
                  (parseFloat(endY) - parseFloat(startY)) / 100 * 600, 
                  (parseFloat(endX) - parseFloat(startX)) / 100 * 800
                )}rad)`,
                zIndex: 1
              }}
            />
          );
        })}
        
        {/* 一级节点 */}
        {firstLevelNodes.map((node) => (
          <div 
            key={node.id}
            className="absolute bg-green-500 text-white rounded-lg p-3 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: `${(node.position.x / 800 + 0.5) * 100}%`, 
              top: `${(node.position.y / 600 + 0.5) * 100}%`,
              width: '100px',
              height: '60px',
              zIndex: 5
            }}
          >
            <span className="text-sm font-medium">{node.data.label}</span>
          </div>
        ))}
        
        {/* 连接线 - 一级到二级节点 */}
        {secondLevelEdges.map((edge) => {
          const sourceNode = data.nodes.find((node) => node.id === edge.source);
          const targetNode = data.nodes.find((node) => node.id === edge.target);
          if (!sourceNode || !targetNode) return null;
          
          // 计算线的起点和终点
          const startX = `${(sourceNode.position.x / 800 + 0.5) * 100}%`;
          const startY = `${(sourceNode.position.y / 600 + 0.5) * 100}%`;
          const endX = `${(targetNode.position.x / 800 + 0.5) * 100}%`;
          const endY = `${(targetNode.position.y / 600 + 0.5) * 100}%`;
          
          // 计算线的长度和角度
          const dx = (parseFloat(endX) - parseFloat(startX)) / 100 * 800;
          const dy = (parseFloat(endY) - parseFloat(startY)) / 100 * 600;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          
          return (
            <div 
              key={edge.id}
              className="absolute bg-gray-300"
              style={{
                left: startX,
                top: startY,
                width: `${length}px`,
                height: '1px',
                transformOrigin: 'left',
                transform: `rotate(${angle}deg)`,
                zIndex: 1
              }}
            />
          );
        })}
        
        {/* 二级节点 */}
        {secondLevelNodes.map((node) => (
          <div 
            key={node.id}
            className="absolute bg-orange-400 text-white rounded p-2 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: `${(node.position.x / 800 + 0.5) * 100}%`, 
              top: `${(node.position.y / 600 + 0.5) * 100}%`,
              width: '90px',
              height: '40px',
              zIndex: 5
            }}
          >
            <span className="text-xs font-medium">{node.data.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 