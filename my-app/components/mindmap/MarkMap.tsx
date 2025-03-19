'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Toolbar } from 'markmap-toolbar';
import 'markmap-toolbar/dist/style.css';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Minimize, Maximize, ZoomIn, ZoomOut, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';

// 默认Markdown内容结构
const DEFAULT_MARKDOWN = `
# 我的脑图
## 知识分类 1
### 子分类 1-1
### 子分类 1-2
## 知识分类 2
### 子分类 2-1
### 子分类 2-2
`;

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
function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

// 添加防抖函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * MarkMap组件 - 使用markmap库将Markdown渲染为思维导图
 */
const MarkMap: React.FC<MarkMapProps> = ({
  markdown = DEFAULT_MARKDOWN,
  className = 'w-full h-full min-h-[600px]',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const markmapRef = useRef<Markmap | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [currentMarkdown, setCurrentMarkdown] = useState(markdown);
  const [isSvgReady, setIsSvgReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layout, setLayout] = useState<'right' | 'left'>('right');

  // 创建并更新Markmap实例
  const createMarkmap = () => {
    if (!containerRef.current || !svgRef.current) return;
    
    try {
      // 清除之前的SVG内容
      if (svgRef.current) {
        while (svgRef.current.firstChild) {
          svgRef.current.removeChild(svgRef.current.firstChild);
        }
        
        // 确保SVG元素有明确的固定像素值的宽度和高度，避免使用相对长度
        const containerWidth = containerRef.current.clientWidth || 800;
        const containerHeight = containerRef.current.clientHeight || 600;
        
        // 使用固定像素值，不使用相对单位
        svgRef.current.setAttribute('width', String(containerWidth));
        svgRef.current.setAttribute('height', String(containerHeight));
        svgRef.current.setAttribute('viewBox', `0 0 ${containerWidth} ${containerHeight}`);
      }
      
      // 使用Transformer解析Markdown
      const transformer = new Transformer();
      const { root } = transformer.transform(currentMarkdown);
      
      // 创建Markmap实例
      markmapRef.current = Markmap.create(svgRef.current, {
        autoFit: true,
        color: (node: any) => {
          // 根据节点深度生成颜色
          const colors = [
            '#2563eb', // 蓝色 - 根节点
            '#8b5cf6', // 紫色 - 一级节点
            '#ec4899', // 粉色 - 二级节点
            '#f97316', // 橙色 - 三级节点
            '#14b8a6', // 青色 - 四级节点
            '#84cc16', // 绿色 - 更深层节点
          ];
          const depth = node.state?.depth || 0;
          return colors[Math.min(depth, colors.length - 1)];
        },
        duration: 500, // 动画持续时间
        nodeMinHeight: 16,
        spacingHorizontal: 80,
        spacingVertical: 15,
        paddingX: 10,
        initialExpandLevel: 3, // 初始展开到第3级
      }, root);
      
      // 监听节点点击事件，处理URL跳转
      svgRef.current.addEventListener('click', (e) => {
        const target = e.target as SVGElement;
        const textElement = target.closest('text');
        if (textElement) {
          const content = textElement.textContent || '';
          const urlMatch = content.match(/URL: (https?:\/\/[^\s]+)/);
          if (urlMatch && urlMatch[1]) {
            window.open(urlMatch[1], '_blank');
          }
        }
      });
      
      // 更新工具栏
      if (markmapRef.current && toolbarRef.current) {
        if (toolbarRef.current.firstChild) {
          toolbarRef.current.removeChild(toolbarRef.current.firstChild);
        }
        
        const toolbar = new Toolbar();
        toolbar.attach(markmapRef.current);
        const toolbarElement = toolbar.render();
        toolbarElement.style.display = 'none'; // 隐藏原始工具栏，使用自定义控件
        toolbarRef.current.appendChild(toolbarElement);
      }
      
      setIsSvgReady(true);
    } catch (error) {
      console.error('创建脑图失败：', error);
      toast({
        title: '创建脑图失败',
        description: '渲染脑图时出现错误，请重试',
        variant: 'destructive',
      });
    }
  };

  // 初始化Markmap
  useEffect(() => {
    setIsMounted(true);
    setCurrentMarkdown(markdown);
  }, [markdown]);
  
  // 在组件挂载和markdown更新时创建Markmap
  useEffect(() => {
    if (isMounted) {
      createMarkmap();
    }
  }, [isMounted, currentMarkdown]);
  
  // 监听窗口大小变化，调整SVG大小
  useEffect(() => {
    const handleResize = () => {
      if (markmapRef.current && containerRef.current && svgRef.current) {
        // 重新设置 SVG 尺寸
        const containerWidth = containerRef.current.clientWidth || 800;
        const containerHeight = containerRef.current.clientHeight || 600;
        
        // 明确设置为数值，不带单位
        svgRef.current.setAttribute('width', String(containerWidth));
        svgRef.current.setAttribute('height', String(containerHeight));
        svgRef.current.setAttribute('viewBox', `0 0 ${containerWidth} ${containerHeight}`);
        
        // 使用 setTimeout 确保 DOM 更新后再执行 fit
        setTimeout(() => {
          markmapRef.current?.fit();
        }, 100);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // 处理全屏切换
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!isFullscreen) {
        // 进入全屏
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        // 退出全屏
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
      
      // 调整SVG大小
      setTimeout(() => {
        if (markmapRef.current) {
          markmapRef.current.fit();
        }
      }, 100);
    } catch (error) {
      console.error('全屏切换失败:', error);
    }
  };
  
  // 处理缩放
  const handleZoom = debounce((scale: number) => {
    if (!markmapRef.current || !svgRef.current) return;
    
    try {
      // 获取当前变换状态
      const gElement = svgRef.current.querySelector('g');
      if (!gElement) return;

      const transform = gElement.getAttribute('transform');
      if (!transform) return;

      // 解析当前的缩放值
      const scaleMatch = transform.match(/scale\(([\d.]+)\)/);
      const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
      
      // 计算新的缩放值
      const newScale = scale > 1 ? currentScale * 1.2 : currentScale * 0.8;
      
      // 确保缩放值在合理范围内
      if (isNaN(newScale) || newScale < 0.1 || newScale > 10) {
        console.warn('缩放值超出范围，重置为默认值');
        markmapRef.current.fit();
        return;
      }

      // 使用安全的缩放方法
      markmapRef.current.rescale(newScale);
      
      // 添加防错处理
      setTimeout(() => {
        if (markmapRef.current && containerRef.current && svgRef.current) {
          // 检查 SVG 元素是否有效
          const gElement = svgRef.current.querySelector('g');
          if (gElement) {
            const transform = gElement.getAttribute('transform');
            if (transform && transform.includes('NaN')) {
              // 如果发现无效的变换，重置视图
              markmapRef.current.fit();
            }
          }
          
          // 检查并修复 SVG 属性
          if (!svgRef.current.getAttribute('width') || 
              !svgRef.current.getAttribute('height') || 
              !svgRef.current.getAttribute('viewBox')) {
            const containerWidth = containerRef.current.clientWidth || 800;
            const containerHeight = containerRef.current.clientHeight || 600;
            svgRef.current.setAttribute('width', String(containerWidth));
            svgRef.current.setAttribute('height', String(containerHeight));
            svgRef.current.setAttribute('viewBox', `0 0 ${containerWidth} ${containerHeight}`);
          }
        }
      }, 200);
    } catch (error) {
      console.error('缩放失败:', error);
      // 如果缩放失败，尝试重置视图
      try {
        markmapRef.current?.fit();
      } catch (e) {
        console.error('重置视图也失败:', e);
      }
    }
  }, 100); // 100ms 的防抖延迟
  
  // 重置视图
  const handleReset = () => {
    if (!markmapRef.current) return;
    markmapRef.current.fit();
  };
  
  // 切换布局方向
  const toggleLayout = () => {
    if (!markmapRef.current) return;
    
    const newLayout = layout === 'right' ? 'left' : 'right';
    setLayout(newLayout);
    
    try {
      // 重新渲染脑图
      setCurrentMarkdown(prev => prev + ' '); // 通过轻微修改Markdown触发重新渲染
      
      // 通知用户
      toast({
        title: `布局已更改`,
        description: `脑图现在从中心向${newLayout === 'right' ? '右侧' : '左侧'}展开`,
      });
    } catch (error) {
      console.error('切换布局失败:', error);
    }
  };
  
  // 计算控制栏样式，根据全屏状态调整
  const controlsStyle = {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    display: 'flex',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(4px)',
    padding: '8px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    zIndex: 100,
  } as React.CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ minHeight: '300px' }}
    >
      {/* 控制栏 */}
      <div style={controlsStyle} className="dark:bg-gray-800/80 dark:text-gray-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleZoom(1.2)}
          title="放大"
          className="h-8 w-8"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleZoom(0.8)}
          title="缩小"
          className="h-8 w-8"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          title="重置视图"
          className="h-8 w-8"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLayout}
          title={`切换为${layout === 'right' ? '左侧' : '右侧'}展开`}
          className="h-8 w-8"
        >
          {layout === 'right' ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <ArrowLeft className="h-4 w-4" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          title={isFullscreen ? '退出全屏' : '全屏模式'}
          className="h-8 w-8"
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* SVG容器 - 修复width和height设置 */}
      <svg 
        ref={svgRef} 
        className="w-full h-full"
        width="800"
        height="600"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
        style={{
          cursor: 'grab',
          background: 'transparent',
        }}
      />
      
      {/* 隐藏的工具栏容器 - 用于保存Toolbar实例 */}
      <div className="hidden" ref={toolbarRef}></div>
      
      {/* 加载状态 */}
      {!isSvgReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50">
          <span className="text-gray-500 dark:text-gray-400">加载脑图中...</span>
        </div>
      )}
    </div>
  );
};

export default MarkMap;