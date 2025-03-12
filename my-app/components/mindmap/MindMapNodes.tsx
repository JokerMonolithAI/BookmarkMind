'use client';

import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// 颜色主题
const colorSchemes = {
  center: { bg: '#ffffff', border: '#e0e0e0', text: '#333333', line: '#e0e0e0' },
  branch1: { bg: '#ffffff', border: '#ff7e67', text: '#333333', line: '#ff7e67' },
  branch2: { bg: '#ffffff', border: '#ffc764', text: '#333333', line: '#ffc764' },
  branch3: { bg: '#ffffff', border: '#6ecb63', text: '#333333', line: '#6ecb63' },
  branch4: { bg: '#ffffff', border: '#5fa8d3', text: '#333333', line: '#5fa8d3' },
  branch5: { bg: '#ffffff', border: '#8971d0', text: '#333333', line: '#8971d0' },
  branch6: { bg: '#ffffff', border: '#d371ac', text: '#333333', line: '#d371ac' },
};

// 中心节点
export function CenterNode({ data }: NodeProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // 同步外部传入的收缩状态
  useEffect(() => {
    if (data.isCollapsed !== undefined) {
      setIsCollapsed(data.isCollapsed);
    }
  }, [data.isCollapsed]);
  
  // 通知父组件收缩/展开状态变化
  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // 如果有onToggleCollapse回调，则调用它
    if (data.onToggleCollapse && data.id) {
      console.log('Calling center node onToggleCollapse with:', data.id, newCollapsedState);
      data.onToggleCollapse(data.id, newCollapsedState);
    } else {
      console.log('No onToggleCollapse callback found for center node or missing id:', data.id);
    }
  };
  
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
          maxWidth: '300px', // 增加最大宽度，防止文字过长导致节点过宽
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: '16px',
          padding: '8px 16px',
          cursor: 'pointer', // 添加指针样式，表示可点击
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative', // 确保连接点相对于节点定位
          zIndex: 1 // 确保节点在连线上方
        }}
        onClick={toggleCollapse}
      >
        <div 
          className="font-bold text-lg"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', // 文字过长时不换行，使用省略号
            flexGrow: 1, // 允许文字区域占据剩余空间
            textAlign: 'center' // 中心节点文字居中对齐
          }}
          title={data.label} // 添加title属性，鼠标悬停时显示完整文字
        >
          {data.label}
        </div>
        <span 
          style={{ 
            marginLeft: '8px', 
            fontSize: '14px',
            color: colorSchemes.center.border,
            fontWeight: 'bold',
            flexShrink: 0 // 防止折叠/展开图标被压缩
          }}
        >
          {isCollapsed ? '▶' : '▼'}
        </span>
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
          transform: 'translateY(-50%)',
          zIndex: 2 // 确保连接点在最上层
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
          transform: 'translateY(-50%)',
          zIndex: 2 // 确保连接点在最上层
        }} 
      />
    </>
  );
}

// 分支主题节点
export function BranchNode({ data }: NodeProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const colorKey = `branch${data.branchIndex || 1}` as keyof typeof colorSchemes;
  const colors = colorSchemes[colorKey] || colorSchemes.branch1;
  
  // 同步外部传入的收缩状态
  useEffect(() => {
    if (data.isCollapsed !== undefined) {
      setIsCollapsed(data.isCollapsed);
    }
  }, [data.isCollapsed]);
  
  // 通知父组件收缩/展开状态变化
  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // 如果有onToggleCollapse回调，则调用它
    if (data.onToggleCollapse && data.id) {
      console.log('Calling branch node onToggleCollapse with:', data.id, newCollapsedState);
      data.onToggleCollapse(data.id, newCollapsedState);
    } else {
      console.log('No onToggleCollapse callback found for branch node or missing id:', data.id);
    }
  };
  
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
          maxWidth: '250px', // 增加最大宽度，防止文字过长导致节点过宽
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          borderRadius: '14px',
          padding: '6px 12px',
          cursor: 'pointer', // 添加指针样式，表示可点击
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative', // 确保连接点相对于节点定位
          zIndex: 1 // 确保节点在连线上方
        }}
        onClick={toggleCollapse}
      >
        <div 
          className="font-medium"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', // 文字过长时不换行，使用省略号
            flexGrow: 1, // 允许文字区域占据剩余空间
            textAlign: 'left' // 文字左对齐
          }}
          title={data.label} // 添加title属性，鼠标悬停时显示完整文字
        >
          {data.label}
        </div>
        <span 
          style={{ 
            marginLeft: '8px', 
            fontSize: '12px',
            color: colors.border,
            fontWeight: 'bold',
            flexShrink: 0 // 防止折叠/展开图标被压缩
          }}
        >
          {isCollapsed ? '▶' : '▼'}
        </span>
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
          transform: 'translateY(-50%)',
          zIndex: 2 // 确保连接点在最上层
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
          transform: 'translateY(-50%)',
          zIndex: 2
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
          transform: 'translateY(-50%)',
          zIndex: 2
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
          transform: 'translateY(-50%)',
          zIndex: 2
        }} 
      />
    </>
  );
}

// 子主题节点 - 可收缩/展开
export function TopicNode({ data }: NodeProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const colorKey = `branch${data.branchIndex || 1}` as keyof typeof colorSchemes;
  const colors = colorSchemes[colorKey] || colorSchemes.branch1;
  
  // 同步外部传入的收缩状态
  useEffect(() => {
    if (data.isCollapsed !== undefined) {
      setIsCollapsed(data.isCollapsed);
    }
  }, [data.isCollapsed]);
  
  // 通知父组件收缩/展开状态变化
  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // 如果有onToggleCollapse回调，则调用它
    if (data.onToggleCollapse && data.id) {
      console.log('Calling topic node onToggleCollapse with:', data.id, newCollapsedState);
      data.onToggleCollapse(data.id, newCollapsedState);
    } else {
      console.log('No onToggleCollapse callback found for topic node or missing id:', data.id);
    }
  };
  
  return (
    <>
      <div
        className="topic-node"
        style={{
          color: colors.text,
          minWidth: '120px',
          maxWidth: '200px', // 增加最大宽度，防止文字过长导致节点过宽
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: colors.border,
          borderRadius: '20px',
          fontSize: '12px',
          backgroundColor: colors.bg,
          padding: '8px 12px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative', // 确保连接点相对于节点定位
          zIndex: 1 // 确保节点在连线上方
        }}
        onClick={toggleCollapse}
      >
        <span 
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', // 文字过长时不换行，使用省略号
            flexGrow: 1, // 允许文字区域占据剩余空间
            textAlign: 'left' // 文字左对齐
          }}
          title={data.label} // 添加title属性，鼠标悬停时显示完整文字
        >
          {data.label}
        </span>
        <span 
          style={{ 
            marginLeft: '8px', 
            fontSize: '12px',
            color: colors.border,
            fontWeight: 'bold',
            flexShrink: 0 // 防止折叠/展开图标被压缩
          }}
        >
          {isCollapsed ? '▶' : '▼'}
        </span>
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
          transform: 'translateY(-50%)',
          zIndex: 2 // 确保连接点在最上层
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
          transform: 'translateY(-50%)',
          zIndex: 2 // 确保连接点在最上层
        }} 
      />
    </>
  );
}

// 辅助函数：截断URL显示
function truncateUrl(url: string, maxLength: number = 35): string {
  if (!url || url.length <= maxLength) return url;
  
  try {
    const urlObj = new URL(url);
    // 保留域名和路径的一部分
    const domain = urlObj.hostname;
    
    // 如果域名已经很长，只显示域名的一部分
    if (domain.length >= maxLength - 5) {
      return domain.substring(0, maxLength - 5) + '...';
    }
    
    // 计算路径可以显示的长度
    const pathMaxLength = maxLength - domain.length - 5;
    let path = urlObj.pathname;
    
    // 如果路径太长，截断它
    if (path.length > pathMaxLength) {
      path = path.substring(0, pathMaxLength) + '...';
    }
    
    // 如果有查询参数，添加一个指示
    if (urlObj.search) {
      path += '?...';
    }
    
    return domain + path;
  } catch (e) {
    // 如果URL解析失败，简单截断
    return url.substring(0, maxLength - 3) + '...';
  }
}

// 详情节点 - 显示 URL、主题和总结，简化样式
export function DetailNode({ data }: NodeProps) {
  const colorKey = `branch${data.branchIndex || 1}` as keyof typeof colorSchemes;
  const colors = colorSchemes[colorKey] || colorSchemes.branch1;
  
  // 处理URL点击
  const handleUrlClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('URL点击事件触发:', url);
    
    // 使用更直接的方式打开URL
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  // 结构化节点 - URL、标题、摘要分开显示
  if (data.isStructured) {
    // 获取内容
    const content = data.content || '';
    
    // 根据结构类型渲染不同内容
    return (
      <>
        {/* 单一元素，无嵌套 */}
        {data.structureType === 'url' ? (
          <a 
            href={data.content} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: colors.border, 
              textDecoration: 'underline',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
              width: '220px',
              padding: '4px 8px',
              marginBottom: '3px',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease',
              position: 'relative',
              zIndex: 10,
              fontWeight: '500', // 使URL更加明显
            }}
            title={data.content}
            onClick={(e) => handleUrlClick(e, data.content)}
          >
            {truncateUrl(content)}
          </a>
        ) : (
          <p
            style={{ 
              color: colors.text,
              width: '220px',
              fontSize: '11px',
              backgroundColor: 'transparent',
              padding: '4px 8px',
              transition: 'all 0.2s ease',
              marginBottom: '3px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxHeight: data.structureType === 'summary' ? '80px' : '36px',
              overflowY: data.structureType === 'summary' ? 'auto' : 'hidden',
              lineHeight: '1.4',
              margin: 0,
            }}
            title={content}
          >
            {content}
          </p>
        )}
        
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
            transform: 'translateY(-50%)',
            zIndex: 2 // 确保连接点在最上层
          }} 
        />
      </>
    );
  }
  
  // 原始详情节点样式 - 单个节点显示所有信息
  // 使用CSS Grid布局，避免嵌套
  const gridTemplateRows = [
    data.url ? 'auto' : '0', 
    data.title ? 'auto' : '0', 
    data.summary ? 'auto' : '0'
  ].join(' ');
  
  return (
    <>
      <div
        className="detail-node"
        style={{
          color: colors.text,
          width: '250px',
          backgroundColor: 'transparent',
          padding: '4px 8px',
          transition: 'all 0.2s ease',
          marginBottom: '3px',
          position: 'relative',
          display: 'grid',
          gridTemplateRows,
          rowGap: '4px',
          zIndex: 1 // 确保节点在连线上方
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 直接渲染内容，不使用额外的包装div */}
        {data.url && (
          <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: colors.border, 
              textDecoration: 'underline',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
              cursor: 'pointer',
              padding: '2px 0',
              gridRow: '1',
              zIndex: 10,
              position: 'relative',
              fontWeight: '500', // 使URL更加明显
            }}
            title={data.url}
            onClick={(e) => handleUrlClick(e, data.url)}
          >
            {truncateUrl(data.url)}
          </a>
        )}
        
        {data.title && (
          <p
            style={{ 
              margin: 0,
              padding: 0,
              fontWeight: '500', 
              fontSize: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxHeight: '36px',
              lineHeight: '1.2',
              gridRow: '2',
            }}
            title={data.title}
          >
            {data.title}
          </p>
        )}
        
        {data.summary && (
          <p
            style={{ 
              margin: 0,
              padding: 0,
              fontSize: '11px', 
              lineHeight: '1.4',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxHeight: '60px',
              gridRow: '3',
            }}
            title={data.summary}
          >
            {data.summary}
          </p>
        )}
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
          transform: 'translateY(-50%)',
          zIndex: 2 // 确保连接点在最上层
        }} 
      />
    </>
  );
}

// 文件节点 - 隐藏内容
export function FileNode({ data }: NodeProps) {
  const colorKey = `branch${data.branchIndex || 1}` as keyof typeof colorSchemes;
  const colors = colorSchemes[colorKey] || colorSchemes.branch1;
  
  return (
    <>
      <div
        className="file-node"
        style={{
          color: colors.text,
          minWidth: '180px',
          maxWidth: '250px',
          fontSize: '11px',
          backgroundColor: 'transparent',
          padding: '4px 8px',
          transition: 'all 0.2s ease',
          display: 'none', // 隐藏文件内容
          position: 'relative',
          zIndex: 1 // 确保节点在连线上方
        }}
      >
        <div style={{ 
          fontSize: '11px', 
          lineHeight: '1.4',
          whiteSpace: 'nowrap', // 使用单行显示
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
        title={data.content} // 鼠标悬停时显示完整内容
        >
          {data.content}
        </div>
      </div>
      
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
          transform: 'translateY(-50%)',
          zIndex: 2 // 确保连接点在最上层
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
  fileNode: FileNode,
}; 