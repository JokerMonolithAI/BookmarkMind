'use client';

import React, { useEffect, useRef } from 'react';
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

  // 初始化Markmap实例
  useEffect(() => {
    if (!svgRef.current) return;
    
    // 如果已经存在Markmap实例，则不重新创建
    if (markmapRef.current) return;
    
    // 添加自定义样式
    const style = document.createElement('style');
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
  }, [svgRef.current]);

  // 更新Markmap数据
  useEffect(() => {
    if (!markmapRef.current || !markdown) return;
    
    // 转换Markdown为思维导图数据
    const { root } = transformer.transform(markdown);
    
    // 更新数据并适应视图
    markmapRef.current.setData(root).then(() => {
      markmapRef.current?.fit();
      
      // 确保所有链接在新标签页打开
      if (svgRef.current) {
        const links = svgRef.current.querySelectorAll('a');
        links.forEach(link => {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        });
      }
    });
  }, [markdown, markmapRef.current]);

  return (
    <div className={`relative ${className}`}>
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute bottom-4 right-4" ref={toolbarRef}></div>
    </div>
  );
};

export default MarkMap; 