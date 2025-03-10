'use client';

import React, { useCallback } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

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

// 连接中心到分支主题的边
export function BranchEdge({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data }: EdgeProps) {
  // 使用贝塞尔曲线
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // 获取分支颜色
  const branchIndex = data?.branchIndex || 'default';
  const color = branchColors[branchIndex as keyof typeof branchColors] || branchColors.default;
  
  console.log('BranchEdge branchIndex:', branchIndex, 'color:', color, 'style:', style);

  return (
    <>
      {/* 发光效果 */}
      <path
        id={`${id}-glow`}
        className="edge-glow"
        d={edgePath}
        fill="none"
        stroke={color}
        strokeOpacity={0.2}
        strokeWidth={2.5}
        filter="blur(5px)"
      />
      {/* 主线 */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={0.75}
        strokeLinecap="round"
        style={{
          ...style,
          stroke: color, // 强制设置颜色
          transition: 'stroke-width 0.3s ease, opacity 0.3s ease',
        }}
        className="react-flow__edge-path"
      />
    </>
  );
}

// 连接分支主题到子主题的边
export function TopicEdge({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data }: EdgeProps) {
  // 使用贝塞尔曲线
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // 获取分支颜色
  const branchIndex = data?.branchIndex || 'default';
  const color = branchColors[branchIndex as keyof typeof branchColors] || branchColors.default;
  
  console.log('TopicEdge branchIndex:', branchIndex, 'color:', color, 'style:', style);

  return (
    <path
      id={id}
      d={edgePath}
      fill="none"
      stroke={color}
      strokeWidth={0.5}
      strokeLinecap="round"
      style={{
        ...style,
        stroke: color, // 强制设置颜色
        transition: 'stroke-width 0.3s ease, opacity 0.3s ease',
      }}
      className="react-flow__edge-path"
    />
  );
}

// 连接子主题到详情节点的边
export function DetailEdge({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data }: EdgeProps) {
  // 使用贝塞尔曲线
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // 获取分支颜色
  const branchIndex = data?.branchIndex || 'default';
  const color = branchColors[branchIndex as keyof typeof branchColors] || branchColors.default;
  
  console.log('DetailEdge branchIndex:', branchIndex, 'color:', color, 'style:', style);

  return (
    <path
      id={id}
      d={edgePath}
      fill="none"
      stroke={color}
      strokeWidth={0.5}
      strokeDasharray="3 2"
      strokeLinecap="round"
      style={{
        ...style,
        stroke: color, // 强制设置颜色
        transition: 'stroke-width 0.3s ease, opacity 0.3s ease',
      }}
      className="react-flow__edge-path"
    />
  );
}

// 导出边类型 - 使用 React.memo 来避免不必要的重新渲染
export const edgeTypes = {
  branch: React.memo(BranchEdge),
  topic: React.memo(TopicEdge),
  detail: React.memo(DetailEdge),
}; 