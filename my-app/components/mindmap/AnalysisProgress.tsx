'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { TaskStatus } from '@/types/mindmap';

// 分析阶段描述
const stageDescriptions: Record<string, string> = {
  initializing: '正在初始化分析...',
  collecting: '正在收集书签数据...',
  analyzing: '正在分析内容关系...',
  generating: '正在生成脑图结构...',
  completed: '分析完成',
  failed: '分析失败'
};

// 分析进度组件
export default function AnalysisProgress({ 
  status 
}: { 
  status: TaskStatus
}) {
  const isCompleted = status.status === 'completed';
  const isFailed = status.status === 'failed';
  
  return (
    <div className="w-full max-w-md mx-auto text-center">
      {!isFailed ? (
        <>
          <div className="mb-4">
            {!isCompleted && (
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            )}
            {isCompleted && (
              <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          
          <h3 className="text-lg font-medium mb-2">
            {isCompleted ? '分析完成' : '正在分析书签数据'}
          </h3>
          
          <p className="text-gray-500 mb-4">
            {stageDescriptions[status.stage] || '处理中...'}
          </p>
          
          <div className="mb-2">
            <Progress value={status.progress} className="h-2" />
          </div>
          
          <p className="text-sm text-gray-400">
            {status.progress}% 完成
          </p>
        </>
      ) : (
        <div className="text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">分析失败</h3>
          <p className="text-gray-500 mb-4">{status.error || '发生未知错误'}</p>
        </div>
      )}
    </div>
  );
} 