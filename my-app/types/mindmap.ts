// 任务状态类型
export interface TaskStatus {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  error?: string;
} 