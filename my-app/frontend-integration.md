# 前端集成指南

本文档介绍如何将 Next.js 前端与 BookmarkMindWeave API 集成，特别是如何使用 Firebase Authentication 进行用户认证。

## 认证流程

BookmarkMindWeave API 使用 Firebase Authentication 进行用户认证。前端需要获取用户的 Firebase ID 令牌，并在 API 请求中包含该令牌。

### 步骤 1: 在前端初始化 Firebase

```javascript
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDFeK2DOjq-wi5FFFreKRPHf7kIAKGN8w",
  authDomain: "bookmarkmind.firebaseapp.com",
  databaseURL: "https://bookmarkmind-default-rtdb.firebaseio.com",
  projectId: "bookmarkmind",
  storageBucket: "bookmarkmind.firebasestorage.app",
  messagingSenderId: "87172640765",
  appId: "1:87172640765:web:4cf00fefcb8aaf30c2b394",
  measurementId: "G-8L56290KFZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
```

#### TypeScript 版本

```typescript
// firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";

// Firebase 配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 初始化 Firebase
let app: FirebaseApp;
let auth: Auth;
let database: Database;

// 避免在服务器端渲染时初始化 Firebase
if (typeof window !== "undefined") {
  // 检查是否已经初始化
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  auth = getAuth(app);
  database = getDatabase(app);
}

export { app, auth, database };
```

### 步骤 2: 实现用户登录

```javascript
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    return user;
  } catch (error) {
    console.error("登录失败:", error);
    throw error;
  }
}
```

#### 使用 React Hooks 管理认证状态

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setAuthState({ user, loading: false, error: null });
      },
      (error) => {
        setAuthState({ user: null, loading: false, error: error.message });
      }
    );

    // 清理函数
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setAuthState({ user: userCredential.user, loading: false, error: null });
      return userCredential.user;
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      setAuthState({ user: userCredential.user, loading: false, error: null });
      return userCredential.user;
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setAuthState({ user: userCredential.user, loading: false, error: null });
      return userCredential.user;
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signOut(auth);
      setAuthState({ user: null, loading: false, error: null });
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  // 获取 ID 令牌的函数
  const getIdToken = async (): Promise<string | null> => {
    if (!authState.user) return null;
    try {
      return await authState.user.getIdToken();
    } catch (error) {
      console.error("获取ID令牌失败:", error);
      return null;
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    login,
    loginWithGoogle,
    register,
    logout,
    getIdToken
  };
}
```

### 步骤 3: 获取 ID 令牌并调用 API

```javascript
import { auth } from "../firebase";

async function callBookmarkAPI(url) {
  try {
    // 获取当前用户
    const user = auth.currentUser;
    if (!user) {
      throw new Error("用户未登录");
    }
    
    // 获取ID令牌
    const idToken = await user.getIdToken();
    
    // 调用API
    const response = await fetch("http://localhost:8000/api/v1/bookmark/analyze-bookmark", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({
        url: url,
        userId: user.uid,
        options: {
          extractContent: true,
          generateSummary: true,
          extractKeywords: true,
          extractTags: true
        }
      })
    });
    
    // 解析响应
    const data = await response.json();
    
    // 检查响应是否成功
    if (!data.success) {
      throw new Error(data.error?.message || "API调用失败");
    }
    
    return data;
  } catch (error) {
    console.error("API调用失败:", error);
    throw error;
  }
}
```

### 步骤 4: 创建 API 服务

为了更好地组织代码，你可以创建一个 API 服务类：

```javascript
// services/api.js
import { auth } from "../firebase";

class ApiService {
  constructor(baseUrl = "http://localhost:8000/api/v1") {
    this.baseUrl = baseUrl;
  }
  
  async getAuthHeaders() {
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
  
  async analyzeBookmark(url, options = {}) {
    const headers = await this.getAuthHeaders();
    const user = auth.currentUser;
    
    const response = await fetch(`${this.baseUrl}/bookmark/analyze-bookmark`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        url,
        userId: user.uid,
        options: {
          extractContent: true,
          generateSummary: true,
          extractKeywords: true,
          extractTags: true,
          ...options
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "API调用失败");
    }
    
    return response.json();
  }
  
  // 添加其他API方法...
}

export const apiService = new ApiService();
```

#### TypeScript 版本

```typescript
// services/api.ts
import { auth } from "../firebase";

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

class ApiService {
  private baseUrl: string;
  
  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1") {
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
  
  async analyzeBookmark(url: string, options?: AnalysisOptions): Promise<BookmarkAnalysisResponse> {
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
          userId: user.uid,
          options: {
            extractContent: true,
            generateSummary: true,
            extractKeywords: true,
            extractTags: true,
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
  
  async getBookmark(bookmarkId: string): Promise<BookmarkAnalysisResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("用户未登录");
      }
      
      const response = await fetch(`${this.baseUrl}/bookmark/${bookmarkId}?user_id=${user.uid}`, {
        method: "GET",
        headers
      });
      
      return this.handleResponse<BookmarkAnalysisResponse>(response);
    } catch (error) {
      console.error("获取书签失败:", error);
      throw error;
    }
  }
  
  async deleteBookmark(bookmarkId: string): Promise<{ success: boolean; message: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("用户未登录");
      }
      
      const response = await fetch(`${this.baseUrl}/bookmark/${bookmarkId}?user_id=${user.uid}`, {
        method: "DELETE",
        headers
      });
      
      return this.handleResponse<{ success: boolean; message: string }>(response);
    } catch (error) {
      console.error("删除书签失败:", error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
```

### 步骤 5: 在组件中使用 API 服务

```javascript
// components/BookmarkAnalyzer.js
import { useState } from "react";
import { apiService } from "../services/api";

export default function BookmarkAnalyzer() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleAnalyze = async () => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.analyzeBookmark(url);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2>分析书签</h2>
      <div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="输入URL"
        />
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? "分析中..." : "分析"}
        </button>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      {result && (
        <div className="result">
          <h3>{result.metadata.title}</h3>
          <p><strong>摘要:</strong> {result.summary}</p>
          <div>
            <strong>关键词:</strong>
            {result.keywords.map(keyword => (
              <span key={keyword} className="keyword">{keyword}</span>
            ))}
          </div>
          <div>
            <strong>建议标签:</strong>
            {result.suggestedTags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### TypeScript 版本与 React Hooks

```tsx
// components/BookmarkAnalyzer.tsx
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiService, BookmarkAnalysisResponse, AnalysisOptions } from "../services/api";

export default function BookmarkAnalyzer() {
  const { user, loading: authLoading } = useAuth();
  const [url, setUrl] = useState<string>("");
  const [result, setResult] = useState<BookmarkAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 分析选项
  const [options, setOptions] = useState<AnalysisOptions>({
    extractContent: true,
    generateSummary: true,
    extractKeywords: true,
    extractTags: true,
    maxSummaryLength: 300
  });
  
  const handleOptionChange = (option: keyof AnalysisOptions) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };
  
  const handleAnalyze = async () => {
    if (!url) {
      setError("请输入URL");
      return;
    }
    
    if (!user) {
      setError("请先登录");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.analyzeBookmark(url, options);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "分析失败");
    } finally {
      setLoading(false);
    }
  };
  
  if (authLoading) {
    return <div>加载中...</div>;
  }
  
  if (!user) {
    return <div>请先登录以使用此功能</div>;
  }
  
  return (
    <div className="bookmark-analyzer">
      <h2>分析书签</h2>
      
      <div className="url-input">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="输入URL"
          disabled={loading}
          className="url-input-field"
        />
        <button 
          onClick={handleAnalyze} 
          disabled={loading || !url}
          className="analyze-button"
        >
          {loading ? "分析中..." : "分析"}
        </button>
      </div>
      
      <div className="options">
        <h3>分析选项</h3>
        <label>
          <input
            type="checkbox"
            checked={options.extractContent}
            onChange={() => handleOptionChange("extractContent")}
            disabled={loading}
          />
          提取内容
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.generateSummary}
            onChange={() => handleOptionChange("generateSummary")}
            disabled={loading}
          />
          生成摘要
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.extractKeywords}
            onChange={() => handleOptionChange("extractKeywords")}
            disabled={loading}
          />
          提取关键词
        </label>
        <label>
          <input
            type="checkbox"
            checked={options.extractTags}
            onChange={() => handleOptionChange("extractTags")}
            disabled={loading}
          />
          生成标签
        </label>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>正在分析网页内容，这可能需要几秒钟...</p>
        </div>
      )}
      
      {result && !loading && (
        <div className="result-container">
          <h3 className="result-title">{result.metadata?.title || "分析结果"}</h3>
          
          {result.metadata?.favicon && (
            <img 
              src={result.metadata.favicon} 
              alt="网站图标" 
              className="favicon"
            />
          )}
          
          {result.summary && (
            <div className="summary-section">
              <h4>摘要</h4>
              <p>{result.summary}</p>
            </div>
          )}
          
          {result.keywords && result.keywords.length > 0 && (
            <div className="keywords-section">
              <h4>关键词</h4>
              <div className="tags-container">
                {result.keywords.map(keyword => (
                  <span key={keyword} className="keyword-tag">{keyword}</span>
                ))}
              </div>
            </div>
          )}
          
          {result.suggestedTags && result.suggestedTags.length > 0 && (
            <div className="tags-section">
              <h4>建议标签</h4>
              <div className="tags-container">
                {result.suggestedTags.map(tag => (
                  <span key={tag} className="suggested-tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
          
          {result.category && (
            <div className="category-section">
              <h4>分类</h4>
              <span className="category-tag">{result.category}</span>
            </div>
          )}
          
          <div className="actions">
            <button 
              onClick={() => setResult(null)}
              className="clear-button"
            >
              清除结果
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 步骤 6: 创建认证上下文提供者

为了在整个应用中共享认证状态，可以创建一个认证上下文提供者：

```tsx
// contexts/AuthContext.tsx
import React, { createContext, useContext, ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

// 创建认证上下文类型
interface AuthContextType {
  user: any;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  register: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// 使用认证的自定义Hook
export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  
  return context;
}
```

在 `_app.tsx` 中使用认证提供者：

```tsx
// pages/_app.tsx
import type { AppProps } from "next/app";
import { AuthProvider } from "../contexts/AuthContext";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
```

## 注意事项

1. **令牌刷新**: Firebase 会自动处理令牌刷新，你不需要手动实现这个功能。

2. **错误处理**: 确保适当处理 API 错误，特别是认证错误（401）。

3. **安全性**: 永远不要在客户端存储敏感信息，如 API 密钥。

4. **CORS**: 确保后端 API 配置了正确的 CORS 设置，允许你的前端域名访问。

5. **环境变量**: 在生产环境中，使用环境变量存储 Firebase 配置，而不是硬编码在代码中。

   ```
   # .env.local
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDDFeK2DOjq-wi5FFFreKRPHf7kIAKGN8w
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bookmarkmind.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://bookmarkmind-default-rtdb.firebaseio.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=bookmarkmind
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bookmarkmind.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=87172640765
   NEXT_PUBLIC_FIREBASE_APP_ID=1:87172640765:web:4cf00fefcb8aaf30c2b394
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-8L56290KFZ
   
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
   ```

6. **响应式设计**: 确保你的 UI 组件在不同设备上都能正常显示。

7. **加载状态**: 在 API 调用期间显示加载状态，提升用户体验。

8. **错误边界**: 使用 React 错误边界捕获组件树中的 JavaScript 错误。

## 调试提示

如果遇到认证问题，可以尝试以下步骤：

1. 检查控制台错误消息
2. 确认用户已登录（`auth.currentUser` 不为 null）
3. 验证 ID 令牌是否正确获取
4. 检查 API 请求中的 Authorization 头是否正确设置
5. 查看后端日志，了解服务器端的错误信息

### 常见错误及解决方案

#### 1. "用户未登录"

确保在调用 API 前用户已经登录，可以使用 `onAuthStateChanged` 监听认证状态变化。

#### 2. "无效的令牌"

可能是 ID 令牌已过期或格式不正确，尝试重新获取令牌。

#### 3. "CORS 错误"

确保后端 API 配置了正确的 CORS 设置，允许你的前端域名访问。

#### 4. "网络错误"

检查 API 服务器是否正常运行，以及网络连接是否正常。

## 智能分析接口集成

BookmarkMindWeave API 提供了一个智能分析接口，可以调用 Gemini API 分析文件内容并生成脑图。以下是如何在前端集成这个接口的说明。

### 步骤 1: 在 API 服务中添加智能分析方法

```javascript
// services/api.js
import { auth } from "../firebase";

class ApiService {
  constructor(baseUrl = "http://localhost:8000/api/v1") {
    this.baseUrl = baseUrl;
  }
  
  // ... 其他方法 ...
  
  async analyzeBookmarks(category, bookmarkId = null) {
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
        id: bookmarkId
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "API调用失败");
    }
    
    return response.json();
  }
}

export const apiService = new ApiService();
```

#### TypeScript 版本

```typescript
// services/api.ts
import { auth } from "../firebase";

// ... 其他接口定义 ...

// 定义智能分析请求接口
export interface BookmarkAnalyzeRequest {
  userId: string;
  category: string;
  id?: string;
}

// 定义智能分析响应接口
export interface BookmarkAnalyzeResponse {
  success: boolean;
  results?: any;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

class ApiService {
  private baseUrl: string;
  
  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1") {
    this.baseUrl = baseUrl;
  }
  
  // ... 其他方法 ...
  
  async analyzeBookmarks(category: string, bookmarkId?: string): Promise<BookmarkAnalyzeResponse> {
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
      
      return this.handleResponse<BookmarkAnalyzeResponse>(response);
    } catch (error) {
      console.error("智能分析失败:", error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
```

### 步骤 2: 创建智能分析组件

```javascript
// components/BookmarkMindMap.js
import { useState, useEffect } from "react";
import { apiService } from "../services/api";

export default function BookmarkMindMap() {
  const [category, setCategory] = useState("我的脑图");
  const [bookmarkId, setBookmarkId] = useState("");
  const [mindMapData, setMindMapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.analyzeBookmarks(category, bookmarkId || null);
      setMindMapData(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mind-map-container">
      <h2>智能分析</h2>
      
      <div className="controls">
        <div className="form-group">
          <label>分类:</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
          >
            <option value="我的脑图">我的脑图</option>
            <option value="技术文档">技术文档</option>
            <option value="学习资源">学习资源</option>
            <option value="工作相关">工作相关</option>
            <option value="娱乐">娱乐</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>书签ID (可选):</label>
          <input 
            type="text" 
            value={bookmarkId} 
            onChange={(e) => setBookmarkId(e.target.value)}
            placeholder="留空分析所有书签"
            disabled={loading}
          />
        </div>
        
        <button 
          onClick={handleAnalyze} 
          disabled={loading}
          className="analyze-button"
        >
          {loading ? "分析中..." : "开始分析"}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>正在分析内容，这可能需要一些时间...</p>
        </div>
      )}
      
      {mindMapData && !loading && (
        <div className="mind-map-result">
          <h3>分析结果</h3>
          {/* 这里可以使用可视化库展示脑图数据，如 react-d3-tree 或 react-flow */}
          <pre>{JSON.stringify(mindMapData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### 步骤 3: 使用可视化库展示脑图数据

为了更好地展示脑图数据，你可以使用可视化库，如 [react-d3-tree](https://github.com/bkrem/react-d3-tree) 或 [react-flow](https://reactflow.dev/)。

#### 安装依赖

```bash
npm install react-d3-tree
# 或
npm install reactflow
```

#### 使用 react-d3-tree 展示脑图

```jsx
// components/MindMapVisualization.jsx
import { useEffect, useState } from "react";
import Tree from "react-d3-tree";

export default function MindMapVisualization({ data }) {
  const [treeData, setTreeData] = useState(null);
  
  useEffect(() => {
    if (data) {
      // 将API返回的数据转换为react-d3-tree所需的格式
      const transformedData = transformDataForTree(data);
      setTreeData(transformedData);
    }
  }, [data]);
  
  // 将API返回的数据转换为react-d3-tree所需的格式
  const transformDataForTree = (data) => {
    // 这里需要根据实际数据结构进行转换
    // 示例转换逻辑
    const rootNode = {
      name: "脑图",
      children: []
    };
    
    // 处理第一层分类
    Object.keys(data).forEach(categoryKey => {
      const categoryNode = {
        name: categoryKey,
        children: []
      };
      
      // 处理第二层分类
      data[categoryKey].forEach(item => {
        Object.keys(item).forEach(subCategoryKey => {
          const subCategoryNode = {
            name: subCategoryKey,
            children: []
          };
          
          // 处理主题
          item[subCategoryKey].forEach(topicItem => {
            Object.keys(topicItem).forEach(topicKey => {
              const topicData = topicItem[topicKey];
              const topicNode = {
                name: topicKey,
                attributes: {
                  url: topicData.url,
                  title: topicData.title,
                  summary: topicData.summary
                }
              };
              
              subCategoryNode.children.push(topicNode);
            });
          });
          
          categoryNode.children.push(subCategoryNode);
        });
      });
      
      rootNode.children.push(categoryNode);
    });
    
    return rootNode;
  };
  
  if (!treeData) {
    return <div>加载中...</div>;
  }
  
  return (
    <div className="tree-container" style={{ width: "100%", height: "600px" }}>
      <Tree 
        data={treeData}
        orientation="vertical"
        pathFunc="step"
        translate={{ x: 300, y: 50 }}
        separation={{ siblings: 2, nonSiblings: 2 }}
        nodeSize={{ x: 200, y: 100 }}
        renderCustomNodeElement={(rd3tProps) => (
          <g>
            <circle r={15} fill="#69b3a2" />
            <text
              fill="white"
              strokeWidth="0.5"
              x={20}
              y={5}
              style={{ fontSize: "14px" }}
            >
              {rd3tProps.nodeDatum.name}
            </text>
            {rd3tProps.nodeDatum.attributes && (
              <foreignObject width={200} height={100} x={20} y={20}>
                <div style={{ 
                  backgroundColor: "#f0f0f0", 
                  padding: "5px", 
                  borderRadius: "5px",
                  fontSize: "12px",
                  overflow: "hidden"
                }}>
                  {rd3tProps.nodeDatum.attributes.title && (
                    <div><strong>标题:</strong> {rd3tProps.nodeDatum.attributes.title}</div>
                  )}
                  {rd3tProps.nodeDatum.attributes.summary && (
                    <div><strong>摘要:</strong> {rd3tProps.nodeDatum.attributes.summary.substring(0, 50)}...</div>
                  )}
                </div>
              </foreignObject>
            )}
          </g>
        )}
      />
    </div>
  );
}
```

### 步骤 4: 在页面中使用智能分析组件

```jsx
// pages/mind-map.jsx
import Head from "next/head";
import BookmarkMindMap from "../components/BookmarkMindMap";
import Layout from "../components/Layout";

export default function MindMapPage() {
  return (
    <Layout>
      <Head>
        <title>智能分析 - BookmarkMindWeave</title>
        <meta name="description" content="使用AI分析书签内容并生成脑图" />
      </Head>
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">智能分析</h1>
        <BookmarkMindMap />
      </main>
    </Layout>
  );
}
```

## 示例项目结构

```
my-next-app/
├── components/
│   ├── BookmarkAnalyzer.tsx
│   ├── BookmarkMindMap.tsx
│   ├── MindMapVisualization.tsx
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── useAuth.ts
├── pages/
│   ├── _app.tsx
│   ├── index.tsx
│   ├── login.tsx
│   ├── dashboard.tsx
│   └── mind-map.tsx
├── services/
│   ├── api.ts
│   └── firebase.ts
├── styles/
│   └── globals.css
├── .env.local
└── next.config.js
```

## 进一步阅读

- [Firebase Authentication 文档](https://firebase.google.com/docs/auth)
- [Next.js 文档](https://nextjs.org/docs)
- [React Hooks 文档](https://reactjs.org/docs/hooks-intro.html)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
- [React D3 Tree 文档](https://github.com/bkrem/react-d3-tree)
- [React Flow 文档](https://reactflow.dev/docs/introduction/)
- [Gemini API 文档](https://ai.google.dev/gemini-api/docs) 