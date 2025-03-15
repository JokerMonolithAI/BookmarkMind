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
 * 检查值是否为有效数字
 * @param value 要检查的值
 * @returns 如果是有效数字则返回true，否则返回false
 */
function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
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
  // 容器元素的引用
  const containerRef = useRef<HTMLDivElement>(null);
  // Markmap实例的引用
  const markmapRef = useRef<Markmap | null>(null);
  // 工具栏容器的引用
  const toolbarRef = useRef<HTMLDivElement>(null);
  // 添加状态跟踪组件是否已挂载
  const [isMounted, setIsMounted] = useState(false);
  // 添加状态跟踪当前markdown
  const [currentMarkdown, setCurrentMarkdown] = useState<string | null>(null);
  // 添加状态跟踪SVG是否已准备好
  const [isSvgReady, setIsSvgReady] = useState(false);

  // 组件挂载状态
  useEffect(() => {
    setIsMounted(true);
    return () => {
      // 组件卸载时清理
      setIsMounted(false);
      if (markmapRef.current) {
        try {
          // 尝试清理旧实例
          markmapRef.current = null;
        } catch (e) {
          console.error('清理Markmap实例失败:', e);
        }
      }
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

  // 添加自定义样式
  useEffect(() => {
    if (!isMounted) return;
    
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
  }, [isMounted]);

  // 初始化SVG元素
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !isMounted) return;
    
    const svg = svgRef.current;
    const container = containerRef.current;
    
    // 确保SVG元素有明确的尺寸
    const updateSvgSize = () => {
      const containerRect = container.getBoundingClientRect();
      
      // 确保尺寸是有效的正数
      const width = Math.max(containerRect.width, 100);
      const height = Math.max(containerRect.height, 100);
      
      // 设置SVG的viewBox和尺寸
      svg.setAttribute('width', `${width}px`);
      svg.setAttribute('height', `${height}px`);
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    };
    
    // 初始更新尺寸
    updateSvgSize();
    
    // 使用ResizeObserver监听容器尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      updateSvgSize();
      // 标记SVG已准备好
      setIsSvgReady(true);
    });
    
    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [svgRef.current, containerRef.current, isMounted]);

  // 创建和更新Markmap实例
  useEffect(() => {
    if (!svgRef.current || !isMounted || !currentMarkdown || !containerRef.current || !isSvgReady) return;
    
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
      const svg = svgRef.current;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // 确保尺寸是有效的正数
      const width = Math.max(containerRect.width, 100);
      const height = Math.max(containerRect.height, 100);
      
      // 创建Markmap实例
      const mm = Markmap.create(svg, {
        // 自定义配置
        nodeMinHeight: 20,
        spacingHorizontal: 120,
        spacingVertical: 40,
        autoFit: true,
        duration: 500,
        maxWidth: 500, // 限制节点最大宽度
        initialExpandLevel: -1, // 展开所有节点
        zoom: true,
        pan: true,
      });
      
      // 手动设置d3-zoom的extent，解决SVGLength错误
      if (mm.zoom && typeof mm.zoom.extent === 'function') {
        mm.zoom.extent([[0, 0], [width, height]]);
      }
      
      // 修补d3-zoom的transform函数，防止NaN值
      if (mm.zoom && mm.zoom.transform) {
        const originalTransform = mm.zoom.transform;
        mm.zoom.transform = function(selection, transform) {
          // 检查transform对象的x、y和k值是否有效
          if (transform && 
              // 使用类型守卫检查transform是否为对象且具有x、y、k属性
              typeof transform === 'object' && 
              'x' in transform && isValidNumber(transform.x) && 
              'y' in transform && isValidNumber(transform.y) && 
              'k' in transform && isValidNumber(transform.k)) {
            return originalTransform.call(this, selection, transform);
          } else {
            console.warn('跳过无效的transform:', transform);
            return selection;
          }
        };
      }
      
      markmapRef.current = mm;
      
      // 如果工具栏容器存在，则渲染工具栏
      if (toolbarRef.current) {
        renderToolbar(mm, toolbarRef.current);
      }
      
      // 添加事件监听器，确保所有链接在新标签页打开
      svg.addEventListener('click', (e) => {
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
      
      // 使用requestAnimationFrame确保DOM已更新
      requestAnimationFrame(() => {
        if (mm && isMounted) {
          try {
            mm.fit();
          } catch (e) {
            console.error('适应视图失败:', e);
          }
        }
      });
    } catch (error) {
      console.error('初始化Markmap失败:', error);
    }
  }, [currentMarkdown, isMounted, isSvgReady]);

  // 监听窗口大小变化
  useEffect(() => {
    if (!isMounted || !containerRef.current) return;
    
    const handleResize = () => {
      if (markmapRef.current && containerRef.current && svgRef.current) {
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        
        // 确保尺寸是有效的正数
        const width = Math.max(containerRect.width, 100);
        const height = Math.max(containerRect.height, 100);
        
        // 更新SVG尺寸
        const svg = svgRef.current;
        svg.setAttribute('width', `${width}px`);
        svg.setAttribute('height', `${height}px`);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        // 更新extent
        try {
          // 访问内部zoom属性并设置extent
          const mm = markmapRef.current;
          if (mm.zoom && typeof mm.zoom.extent === 'function') {
            mm.zoom.extent([[0, 0], [width, height]]);
          }
          
          // 适应视图
          mm.fit();
        } catch (e) {
          console.error('更新Markmap尺寸失败:', e);
        }
      }
    };
    
    // 使用防抖函数包装handleResize
    let resizeTimeout: NodeJS.Timeout | null = null;
    const debouncedResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [isMounted]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <svg 
        ref={svgRef} 
        className="w-full h-full" 
        style={{ minHeight: '600px' }}
      />
      <div className="absolute bottom-4 right-4" ref={toolbarRef}></div>
    </div>
  );
};

export default MarkMap;