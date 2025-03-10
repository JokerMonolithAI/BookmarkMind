'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// 颜色主题
const colorSchemes = {
  center: { bg: '#f8f8f8', border: '#e0e0e0', text: '#333333', line: '#e0e0e0' },
  branch1: { bg: '#ffffff', border: '#ff7e67', text: '#333333', line: '#ff7e67' },
  branch2: { bg: '#ffffff', border: '#ffc764', text: '#333333', line: '#ffc764' },
  branch3: { bg: '#ffffff', border: '#6ecb63', text: '#333333', line: '#6ecb63' },
  branch4: { bg: '#ffffff', border: '#5fa8d3', text: '#333333', line: '#5fa8d3' },
  branch5: { bg: '#ffffff', border: '#8971d0', text: '#333333', line: '#8971d0' },
  branch6: { bg: '#ffffff', border: '#d371ac', text: '#333333', line: '#d371ac' },
};

// 中心节点
export function CenterNode({ data }: NodeProps) {
  return (
    <>
      <div
        className="px-6 py-3 rounded-lg shadow-md text-center"
        style={{
          backgroundColor: colorSchemes.center.bg,
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: colorSchemes.center.border,
          color: colorSchemes.center.text,
          minWidth: '120px',
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: '16px',
          padding: '8px 16px',
        }}
      >
        <div className="font-bold text-lg">{data.label}</div>
      </div>
      
      {/* 只保留左右两侧的连接点 */}
      <Handle 
        type="source" 
        position={Position.Left} 
        id="left" 
        style={{ 
          opacity: 0,
          width: '10px',
          height: '10px',
          top: '50%',
          left: 0,
          transform: 'translateY(-50%)'
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right" 
        style={{ 
          opacity: 0,
          width: '10px',
          height: '10px',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)'
        }} 
      />
    </>
  );
}

// 分支主题节点
export function BranchNode({ data }: NodeProps) {
  const colorKey = `branch${data.branchIndex || 1}` as keyof typeof colorSchemes;
  const colors = colorSchemes[colorKey] || colorSchemes.branch1;
  
  return (
    <>
      <div
        className="px-4 py-2 rounded-md shadow-sm text-center"
        style={{
          backgroundColor: colors.bg,
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: colors.border,
          color: colors.text,
          minWidth: '100px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          borderRadius: '14px',
          padding: '6px 12px',
        }}
      >
        <div className="font-medium">{data.label}</div>
      </div>
      
      {/* 只保留左右两侧的连接点 */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left-target" 
        style={{ 
          opacity: 0,
          width: '10px',
          height: '10px',
          top: '50%',
          left: 0,
          transform: 'translateY(-50%)'
        }} 
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        id="right-target" 
        style={{ 
          opacity: 0,
          width: '10px',
          height: '10px',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)'
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        id="left-source" 
        style={{ 
          opacity: 0,
          width: '10px',
          height: '10px',
          top: '50%',
          left: 0,
          transform: 'translateY(-50%)'
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right-source" 
        style={{ 
          opacity: 0,
          width: '10px',
          height: '10px',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)'
        }} 
      />
    </>
  );
}

// 子主题节点 - 简化为文本
export function TopicNode({ data }: NodeProps) {
  const colorKey = `branch${data.branchIndex || 1}` as keyof typeof colorSchemes;
  const colors = colorSchemes[colorKey] || colorSchemes.branch1;
  
  return (
    <>
      <div
        className="py-1 text-sm"
        style={{
          color: colors.text,
          minWidth: '80px',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: colors.border,
          borderRadius: '12px',
          fontSize: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '4px 10px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
        }}
      >
        <div>{data.label}</div>
      </div>
      
      {/* 连接点 */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left-target" 
        style={{ 
          opacity: 0,
          width: '10px',
          height: '10px',
          top: '50%',
          left: 0,
          transform: 'translateY(-50%)'
        }} 
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        id="right-target" 
        style={{ 
          opacity: 0,
          width: '10px',
          height: '10px',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)'
        }} 
      />
      {/* 添加源连接点，用于连接到详情节点 */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right-source" 
        style={{ 
          opacity: 0,
          width: '10px',
          height: '10px',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)'
        }} 
      />
    </>
  );
}

// 详情节点 - 显示 URL、主题和总结
export function DetailNode({ data }: NodeProps) {
  const colorKey = `branch${data.branchIndex || 1}` as keyof typeof colorSchemes;
  const colors = colorSchemes[colorKey] || colorSchemes.branch1;
  
  return (
    <>
      <div
        className="detail-node"
        style={{
          color: colors.text,
          minWidth: '200px',
          maxWidth: '250px',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: colors.border,
          borderRadius: '8px',
          fontSize: '11px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '8px 12px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
        }}
      >
        {data.url && (
          <div className="url-section" style={{ marginBottom: '6px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#666', marginBottom: '2px' }}>URL</div>
            <a 
              href={data.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: colors.border, 
                textDecoration: 'none',
                fontSize: '11px',
                wordBreak: 'break-all',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {data.url}
            </a>
          </div>
        )}
        
        {data.title && (
          <div className="title-section" style={{ marginBottom: '6px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#666', marginBottom: '2px' }}>主题</div>
            <div style={{ fontWeight: '500', fontSize: '12px' }}>{data.title}</div>
          </div>
        )}
        
        {data.summary && (
          <div className="summary-section">
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#666', marginBottom: '2px' }}>总结</div>
            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>{data.summary}</div>
          </div>
        )}
      </div>
      
      {/* 只保留左侧的连接点 */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left-target" 
        style={{ 
          opacity: 0,
          width: '10px',
          height: '10px',
          top: '50%',
          left: 0,
          transform: 'translateY(-50%)'
        }} 
      />
    </>
  );
}

// 导出节点类型映射
export const nodeTypes = {
  centerNode: CenterNode,
  branchNode: BranchNode,
  topicNode: TopicNode,
  detailNode: DetailNode,
}; 