'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Markmap } from 'markmap-view';
import { transformer } from './transformer';
import { Toolbar } from 'markmap-toolbar';
import 'markmap-toolbar/dist/style.css';

// 定义MarkMap组件的属性类型
interface MarkMapProps {
  markdown?: string;
  className?: string;
}

/**
 * 渲染工具栏
 * @param mm Markmap实例
 * @param wrapper 工具栏容器
 */
function renderToolbar(mm: Markmap, wrapper: HTMLElement) {
  while (wrapper?.firstChild) wrapper.firstChild.remove();
  if (mm && wrapper) {
    const toolbar = new Toolbar();
    toolbar.attach(mm);
    // 注册自定义按钮
    toolbar.register({
      id: 'refresh',
      title: '刷新视图',
      content: '刷新',
      onClick: () => mm.fit(),
    });
    // 只使用指定的工具，排除recurse（跳转链接）和下载SVG按钮
    toolbar.setItems(['zoomIn', 'zoomOut', 'fit', 'refresh']);
    
    wrapper.append(toolbar.render());
  }
}

/**
 * MarkMap组件 - 使用markmap库将Markdown渲染为思维导图
 */
const MarkMap: React.FC<MarkMapProps> = ({
  markdown = '# 中心主题\n## 分支主题1\n### 子主题1\n### 子主题2\n## 分支主题2\n### 子主题3\n### 子主题4',
  className = 'w-full h-full min-h-[600px]',
}) => {
  // SVG元素的引用
  const svgRef = useRef<SVGSVGElement>(null);
  // Markmap实例的引用
  const markmapRef = useRef<Markmap | null>(null);
  // 工具栏容器的引用
  const toolbarRef = useRef<HTMLDivElement>(null);
  // 添加状态跟踪组件是否已挂载
  const [isMounted, setIsMounted] = useState(false);
  // 添加状态跟踪SVG是否已准备好
  const [isSvgReady, setIsSvgReady] = useState(false);
  // 添加状态跟踪当前markdown
  const [currentMarkdown, setCurrentMarkdown] = useState<string | null>(null);

  // 组件挂载状态
  useEffect(() => {
    setIsMounted(true);
    return () => {
      // 组件卸载时清理
      setIsMounted(false);
      markmapRef.current = null;
    };
  }, []);

  // 监听markdown变化
  useEffect(() => {
    if (markdown) {
      // 重置SVG准备状态
      setIsSvgReady(false);
      // 更新当前markdown
      setCurrentMarkdown(markdown);
    }
  }, [markdown]);

  // 初始化SVG元素
  useEffect(() => {
    if (!svgRef.current || !isMounted) return;
    
    // 确保SVG元素有合适的尺寸
    const svg = svgRef.current;
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    
    // 使用ResizeObserver监听SVG元素尺寸变化
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setIsSvgReady(true);
        }
      }
    });
    
    resizeObserver.observe(svg);
    
    // 添加自定义样式
    const styleId = 'markmap-custom-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .markmap-node {
          cursor: pointer;
        }
        .markmap-node-circle {
          fill: #fff;
          stroke-width: 2.5;
        }
        .markmap-node-text {
          fill: #000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          font-size: 1.15em;
          font-weight: 500;
        }
        .markmap-link {
          fill: none;
          stroke-width: 2.5;
        }
        /* 确保链接有明显的样式 */
        .markmap-node-text a {
          fill: #0066cc;
          text-decoration: underline;
          cursor: pointer;
        }
        .markmap-node-text a:hover {
          fill: #0044aa;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [svgRef.current, isMounted]);

  // 创建Markmap实例
  useEffect(() => {
    if (!svgRef.current || !isMounted || !isSvgReady || !currentMarkdown) return;
    
    // 清理之前的实例
    if (markmapRef.current) {
      try {
        // 尝试清理旧实例
        const svg = svgRef.current;
        while (svg.firstChild) {
          svg.removeChild(svg.firstChild);
        }
      } catch (e) {
        console.error('清理SVG元素失败:', e);
      }
      markmapRef.current = null;
    }
    
    try {
      // 创建Markmap实例
      const mm = Markmap.create(svgRef.current, {
        // 自定义配置
        nodeMinHeight: 20,
        spacingHorizontal: 120,
        spacingVertical: 40,
        autoFit: true,
        duration: 500,
        maxWidth: 500, // 限制节点最大宽度
        initialExpandLevel: -1, // 展开所有节点
        zoom: true,
        pan: true
      });
      
      markmapRef.current = mm;
      
      // 如果工具栏容器存在，则渲染工具栏
      if (toolbarRef.current) {
        renderToolbar(mm, toolbarRef.current);
      }
      
      // 添加事件监听器，确保所有链接在新标签页打开
      svgRef.current.addEventListener('click', (e) => {
        const target = e.target as Element;
        if (target.tagName === 'A' || target.closest('a')) {
          const link = target.tagName === 'A' ? target : target.closest('a');
          const href = link?.getAttribute('href');
          if (href) {
            e.preventDefault();
            window.open(href, '_blank', 'noopener,noreferrer');
          }
        }
      });
      
      // 转换Markdown为思维导图数据
      const { root } = transformer.transform(currentMarkdown);
      
      // 更新数据
      mm.setData(root);
      
      // 使用setTimeout确保DOM已更新
      setTimeout(() => {
        if (mm && isMounted) {
          mm.fit();
        }
      }, 300);
    } catch (error) {
      console.error('初始化Markmap失败:', error);
    }
  }, [isSvgReady, currentMarkdown, isMounted]);

  return (
    <div className={`relative ${className}`}>
      <svg 
        ref={svgRef} 
        className="w-full h-full" 
        width="100%" 
        height="100%" 
        style={{ minHeight: '600px' }}
      />
      <div className="absolute bottom-4 right-4" ref={toolbarRef}></div>
    </div>
  );
};

export default MarkMap;