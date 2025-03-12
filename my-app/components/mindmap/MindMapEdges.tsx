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
  // 使用贝塞尔曲线，增加曲线的控制点距离，使曲线更加平滑
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.8, // 增加曲率
  });

  // 获取分支颜色
  const branchIndex = data?.branchIndex || 'default';
  const color = branchColors[branchIndex as keyof typeof branchColors] || branchColors.default;

  return (
    <path
      id={id}
      d={edgePath}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
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

// 连接分支主题到子主题的边
export function TopicEdge({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data }: EdgeProps) {
  // 使用贝塞尔曲线，增加曲线的控制点距离，使曲线更加平滑
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.7, // 增加曲率
  });

  // 获取分支颜色
  const branchIndex = data?.branchIndex || 'default';
  const color = branchColors[branchIndex as keyof typeof branchColors] || branchColors.default;

  return (
    <path
      id={id}
      d={edgePath}
      fill="none"
      stroke={color}
      strokeWidth={1}
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
  // 使用贝塞尔曲线，增加曲线的控制点距离，使曲线更加平滑
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.6, // 增加曲率
  });

  // 获取分支颜色
  const branchIndex = data?.branchIndex || 'default';
  const color = branchColors[branchIndex as keyof typeof branchColors] || branchColors.default;

  return (
    <path
      id={id}
      d={edgePath}
      fill="none"
      stroke={color}
      strokeWidth={0.8}
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