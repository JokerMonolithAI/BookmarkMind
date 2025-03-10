import { mockMindMapData, mockTaskStatus } from './mockData';
import { TaskStatus, MindMapData } from '@/types/mindmap';

// 模拟API服务
export const mockApiService = {
  // 启动分析任务
  async startAnalyzeTask(userId: string, category: string): Promise<TaskStatus> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 返回初始任务状态
    return mockTaskStatus.initial as TaskStatus;
  },
  
  // 查询任务状态
  async getTaskStatus(taskId: string, pollCount: number): Promise<TaskStatus> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 根据轮询次数返回不同的状态
    if (pollCount === 1) {
      return mockTaskStatus.progress25 as TaskStatus;
    } else if (pollCount === 2) {
      return mockTaskStatus.progress50 as TaskStatus;
    } else if (pollCount === 3) {
      return mockTaskStatus.progress75 as TaskStatus;
    } else if (pollCount >= 4) {
      // 模拟成功完成
      return mockTaskStatus.completed as TaskStatus;
      
      // 如果要模拟失败，取消上面的注释，使用下面的代码
      // return mockTaskStatus.failed as TaskStatus;
    }
    
    return mockTaskStatus.initial as TaskStatus;
  },
  
  // 获取分析结果
  async getAnalysisResult(taskId: string, category: string): Promise<MindMapData> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // 根据分类返回对应的脑图数据
    return (mockMindMapData[category as keyof typeof mockMindMapData] || mockMindMapData.all) as MindMapData;
  }
}; 