import { auth } from './firebase';

// 定义分析选项接口
export interface AnalysisOptions {
  extractContent?: boolean;
  generateSummary?: boolean;
  extractKeywords?: boolean;
  extractTags?: boolean;
  maxSummaryLength?: number;
}

// 定义书签分析响应接口
export interface BookmarkAnalysisResponse {
  success: boolean;
  bookmarkId?: string;
  url?: string;
  analyzedAt?: number;
  content?: {
    text: string;
    html: string;
    textLength: number;
    language: string;
  };
  summary?: string;
  keywords?: string[];
  suggestedTags?: string[];
  metadata?: {
    title: string;
    description: string;
    author?: string;
    publishDate?: string;
    favicon?: string;
  };
  category?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

// 定义批量分析响应接口
export interface BatchAnalysisResponse {
  success: boolean;
  results: Record<string, BookmarkAnalysisResponse>;
  failedUrls?: Record<string, string>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

// 定义任务状态接口
export interface TaskStatus {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  error?: string;
}

// 定义脑图分析响应接口
export interface MindMapAnalysisResponse {
  success: boolean;
  taskId?: string;
  results?: any;
  markdown?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

class ApiService {
  private baseUrl: string;
  
  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api") {
    this.baseUrl = baseUrl;
  }
  
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("用户未登录");
    }
    
    const idToken = await user.getIdToken();
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    };
  }
  
  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.error?.message || `请求失败: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }
    
    if (data.success === false) {
      throw new Error(data.error?.message || "API调用失败");
    }
    
    return data as T;
  }
  
  async analyzeBookmark(
    url: string, 
    bookmarkId?: string,
    options?: AnalysisOptions
  ): Promise<BookmarkAnalysisResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("用户未登录");
      }
      
      const response = await fetch(`${this.baseUrl}/bookmark/analyze-bookmark`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          url,
          bookmarkId,
          userId: user.uid,
          options: {
            extractContent: true,
            generateSummary: true,
            extractKeywords: true,
            extractTags: true,
            maxSummaryLength: 300,
            ...options
          }
        })
      });
      
      return this.handleResponse<BookmarkAnalysisResponse>(response);
    } catch (error) {
      console.error("分析书签失败:", error);
      throw error;
    }
  }
  
  async analyzeBatchBookmarks(
    bookmarks: Array<{url: string, id: string}>,
    options?: AnalysisOptions
  ): Promise<BatchAnalysisResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("用户未登录");
      }
      
      const response = await fetch(`${this.baseUrl}/bookmark/analyze-bookmarks-batch`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          bookmarks,
          userId: user.uid,
          options: {
            extractContent: true,
            generateSummary: true,
            extractKeywords: true,
            extractTags: true,
            maxSummaryLength: 300,
            ...options
          }
        })
      });
      
      return this.handleResponse<BatchAnalysisResponse>(response);
    } catch (error) {
      console.error("批量分析书签失败:", error);
      throw error;
    }
  }

  async analyzeBookmarks(
    category: string,
    bookmarkId?: string
  ): Promise<MindMapAnalysisResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("用户未登录");
      }
      
      const response = await fetch(`${this.baseUrl}/bookmark/analyze-bookmarks`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: user.uid,
          category: category,
          id: bookmarkId || null
        })
      });
      
      return this.handleResponse<MindMapAnalysisResponse>(response);
    } catch (error) {
      console.error("分析书签失败:", error);
      throw error;
    }
  }
  
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/v1/task/${taskId}/status`, {
        method: "GET",
        headers
      });
      
      return this.handleResponse<TaskStatus>(response);
    } catch (error) {
      console.error("获取任务状态失败:", error);
      throw error;
    }
  }
  
  async getAnalysisResult(taskId: string): Promise<MindMapAnalysisResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/v1/task/${taskId}/result`, {
        method: "GET",
        headers
      });
      
      return this.handleResponse<MindMapAnalysisResponse>(response);
    } catch (error) {
      console.error("获取分析结果失败:", error);
      throw error;
    }
  }
}

export const apiService = new ApiService(); 