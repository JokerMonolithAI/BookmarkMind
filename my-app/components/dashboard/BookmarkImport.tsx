import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { saveUserBookmarks, Bookmark as ServiceBookmark } from '@/lib/supabaseBookmarkService';
import { apiService } from '@/lib/apiService';
import { eventService, EVENTS } from '@/lib/eventService';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { parseBookmarkFile } from '@/utils/bookmark-parser';
import { Bookmark } from '@/types/bookmark';
import { FileUp, CheckCircle, AlertCircle, FileIcon, X, Loader2, RefreshCw, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { generateId } from '@/lib/utils';

export default function BookmarkImport() {
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    importDuplicates?: number;
    dbDuplicates?: number;
    totalImported?: number;
    analyzedCount?: number;
  } | null>(null);
  
  // 添加分析选项
  const [analyzeBookmarks, setAnalyzeBookmarks] = useState(true);
  const [analysisOptions, setAnalysisOptions] = useState({
    extractContent: true,
    generateSummary: true,
    extractKeywords: true,
    extractTags: true,
    maxSummaryLength: 300
  });

  // 使用 useRef 而不是 useState 来跟踪计时器
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // 组件挂载/卸载处理
  useEffect(() => {
   
    // 组件卸载时
    return () => {
      isMountedRef.current = false;
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, []);

  // 简化的进度更新函数
  const updateProgress = (value: number) => {
    if (isMountedRef.current) {
      setImportProgress(value);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
      
      // 重置进度条
      updateProgress(0);
      
      // 设置初始进度
      updateProgress(30);
    }
  };

  const resetImport = () => {
    // 清除计时器
    if (progressTimerRef.current) {
      clearTimeout(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    
    setSelectedFile(null);
    setImportResult(null);
    updateProgress(0);
    const input = document.getElementById('bookmark-file') as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user) {
      setImportResult({
        success: false,
        message: '请先选择文件或登录'
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      // 清除之前的计时器
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      
      // 更新进度 - 解析开始
      updateProgress(20);
      
      // 1. 解析书签文件并获取去重信息
      console.time('parseBookmarkFile');
      console.log('开始解析文件:', selectedFile.name);
      let parsedBookmarks;
      let importDuplicates;
      
      try {
        const result = await parseBookmarkFile(selectedFile);
        parsedBookmarks = result.bookmarks;
        importDuplicates = result.duplicatesCount;
        console.log(`解析完成: 获取到 ${parsedBookmarks.length} 个书签，去重 ${importDuplicates} 个`);
      } catch (parseError) {
        console.error('文件解析失败:', parseError);
        throw new Error(`文件解析失败: ${parseError instanceof Error ? parseError.message : '格式不正确或文件损坏'}`);
      }
      
      console.timeEnd('parseBookmarkFile');
      
      if (!parsedBookmarks || parsedBookmarks.length === 0) {
        throw new Error('文件中未找到有效的书签数据');
      }
      
      // 更新进度 - 解析完成
      updateProgress(40);
      
      // 2. 将去重后的书签转换为对象
      const bookmarksObject: Record<string, ServiceBookmark> = {};
      parsedBookmarks.forEach((bookmark, index) => {
        // 使用改进后的 generateId 函数生成唯一 ID
        const id = bookmark.id || generateId('bm');
        
        // 处理日期字段
        const now = new Date();
        const createdAt = bookmark.createdAt || now.getTime();
        const addedAt = bookmark.addedAt || now.getTime();
        
        // 将Bookmark类型转换为ServiceBookmark类型
        bookmarksObject[id] = {
          ...bookmark,
          id,
          userId: user.id,
          createdAt,
          addedAt,
          updatedAt: new Date().toISOString(),
          visitCount: 0,
          isRead: false,
          isFavorite: false,
          type: 'article'  // 默认类型
        };
      });
      
      console.log(`准备导入 ${Object.keys(bookmarksObject).length} 个书签`);
      
      // 更新进度 - 转换完成
      updateProgress(50);
      
      // 3. 与数据库中的书签对比去重并保存
      console.time('saveUserBookmarks');
      console.log('开始保存书签到数据库');
      
      let result;
      try {
        result = await saveUserBookmarks(user.id, bookmarksObject, {});
        console.log('书签保存结果:', result);
      } catch (saveError) {
        console.error('保存书签失败:', saveError);
        throw new Error(`保存书签失败: ${saveError instanceof Error ? saveError.message : '数据库错误'}`);
      }
      
      console.timeEnd('saveUserBookmarks');
      
      // 更新进度 - 保存完成
      updateProgress(70);
      
      // 4. 如果启用了分析，调用API分析书签
      let analyzedCount = 0;
      if (analyzeBookmarks && result.savedCount > 0) {
        updateProgress(75);
        
        try {
          // 准备要分析的书签数组
          const bookmarksToAnalyze = Object.entries(bookmarksObject)
            .filter(([id, _]) => !result.existingBookmarkIds?.includes(id))
            .map(([id, bookmark]) => ({
              id,
              url: bookmark.url
            }));
          
          console.log(`准备分析 ${bookmarksToAnalyze.length} 个书签`);
          
          if (bookmarksToAnalyze.length > 0) {
            try {
              // 调用批量分析API
              const analysisResult = await apiService.analyzeBatchBookmarks(
                bookmarksToAnalyze,
                analysisOptions
              );
              
              analyzedCount = analysisResult.successCount;
              console.log(`分析完成: ${analyzedCount} 个书签已分析`);
            } catch (analysisError) {
              console.error('分析书签失败:', analysisError);
              // 分析失败不影响整体导入流程，继续执行
            }
          }
        } catch (error) {
          console.error('准备分析数据时出错:', error);
          // 分析失败不影响整体导入流程，继续执行
        }
      }
      
      // 更新进度 - 分析完成
      updateProgress(100);
      
      // 显示结果
      setImportResult({
        success: true,
        message: '', // 移除重复的成功消息
        importDuplicates,
        dbDuplicates: result.dbDuplicates,
        totalImported: result.savedCount,
        analyzedCount: analyzedCount
      });
      
      // 发布书签导入成功事件
      eventService.publish(EVENTS.BOOKMARKS_IMPORTED);
      
      // 注意：这里不设置 isImporting = false，保持导入状态
      // 这样可以确保文件信息区域保持隐藏
      
    } catch (error) {
      console.error('导入过程发生错误:', error);
      
      // 设置进度为0
      updateProgress(0);
      
      let errorMessage = '导入失败';
      
      if (error instanceof Error) {
        errorMessage = `${errorMessage}: ${error.message}`;
        console.error('错误详情:', error.stack);
      } else if (typeof error === 'string') {
        errorMessage = `${errorMessage}: ${error}`;
      } else if (error && typeof error === 'object') {
        try {
          errorMessage = `${errorMessage}: ${JSON.stringify(error)}`;
        } catch {
          errorMessage = `${errorMessage}: 未知对象错误`;
        }
      } else {
        errorMessage = `${errorMessage}: 未知错误`;
      }
      
      setImportResult({
        success: false,
        message: errorMessage
      });
      
      // 导入失败时，设置 isImporting = false，显示文件信息
      setIsImporting(false);
      
    } finally {
      // 不在 finally 中设置 isImporting = false
      // 只在导入失败时设置
    }
  };

  // 导入新文件的处理函数
  const handleImportAnother = () => {
    setIsImporting(false);
    setImportResult(null);
    setSelectedFile(null);
    updateProgress(0);
    const input = document.getElementById('bookmark-file') as HTMLInputElement;
    if (input) input.value = '';
  };

  return (
    <div className="space-y-4">
      {/* 显示上传区域的条件：
          1. 没有选择文件，或者
          2. 有导入结果且导入成功（此时显示"导入另一个"按钮） */}
      {!selectedFile ? (
        <div className="flex flex-col items-center">
          <div className="group relative mb-4 flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 px-5 py-5 text-center transition hover:bg-muted">
            <input
              type="file"
              accept=".html,.htm,.json"
              onChange={handleFileSelect}
              className="absolute inset-0 cursor-pointer opacity-0"
              id="bookmark-file"
              disabled={isImporting}
            />
            <FileUp className="mb-2 h-8 w-8 text-muted-foreground group-hover:text-primary" />
            <p className="mb-1 text-sm font-medium text-muted-foreground group-hover:text-foreground">
              点击或拖拽文件到此处
            </p>
            <p className="text-xs text-muted-foreground">
              支持 HTML 和 JSON 格式的书签文件
            </p>
          </div>
          
          {/* 分析选项 */}
          <div className="w-full space-y-2 rounded-lg border p-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="analyze-bookmarks"
                checked={analyzeBookmarks}
                onCheckedChange={(checked) => setAnalyzeBookmarks(checked === true)}
              />
              <label
                htmlFor="analyze-bookmarks"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
              >
                <Zap className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />
                智能分析书签内容
              </label>
            </div>
            
            {analyzeBookmarks && (
              <div className="ml-6 mt-2 space-y-2 text-xs text-gray-500">
                <p>将自动分析书签网页内容，提取关键信息并生成摘要和标签</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="extract-content"
                      checked={analysisOptions.extractContent}
                      onCheckedChange={(checked) => 
                        setAnalysisOptions(prev => ({...prev, extractContent: checked === true}))
                      }
                    />
                    <label htmlFor="extract-content" className="text-xs">提取内容</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="generate-summary"
                      checked={analysisOptions.generateSummary}
                      onCheckedChange={(checked) => 
                        setAnalysisOptions(prev => ({...prev, generateSummary: checked === true}))
                      }
                    />
                    <label htmlFor="generate-summary" className="text-xs">生成摘要</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="extract-keywords"
                      checked={analysisOptions.extractKeywords}
                      onCheckedChange={(checked) => 
                        setAnalysisOptions(prev => ({...prev, extractKeywords: checked === true}))
                      }
                    />
                    <label htmlFor="extract-keywords" className="text-xs">提取关键词</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="extract-tags"
                      checked={analysisOptions.extractTags}
                      onCheckedChange={(checked) => 
                        setAnalysisOptions(prev => ({...prev, extractTags: checked === true}))
                      }
                    />
                    <label htmlFor="extract-tags" className="text-xs">生成标签</label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // 只有在没有导入结果时才显示文件信息卡片
        !importResult && (
          <div className="rounded-lg border bg-card p-4">
            {/* 导入状态 */}
            {isImporting ? (
              // 导入中状态 - 只显示进度条和按钮
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      处理中...
                    </span>
                    <span>{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} className="h-2 transition-all duration-300" />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    disabled
                    className="gap-2 min-w-[100px] cursor-not-allowed opacity-70"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    导入中...
                  </Button>
                </div>
              </div>
            ) : (
              // 非导入状态 - 显示文件信息和开始按钮
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <FileIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={resetImport}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {importProgress > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>准备导入</span>
                      <span>{Math.round(importProgress)}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2 transition-all duration-300" />
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleFileUpload} 
                    className="gap-2 min-w-[100px]"
                  >
                    开始导入
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {importResult && (
        <div className="space-y-4">
          <Alert 
            variant={importResult.success ? "default" : "destructive"} 
            className="animate-in fade-in-50 slide-in-from-bottom-5"
          >
            <div className="flex items-start gap-3">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-primary" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <div>
                <AlertTitle className="mb-1">
                  {importResult.success ? "导入成功" : "导入失败"}
                </AlertTitle>
                <AlertDescription>
                  {importResult.message}
                  {importResult.success && (
                    <div className="mt-2 rounded-md bg-muted p-3">
                      <p className="mb-2 text-sm font-medium">导入结果分析：</p>
                      <ul className="space-y-1 text-sm">
                        {importResult.importDuplicates! > 0 && (
                          <li className="flex items-center gap-2">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                            文件内有 {importResult.importDuplicates} 个重复书签已自动去除
                          </li>
                        )}
                        {importResult.dbDuplicates! > 0 && (
                          <li className="flex items-center gap-2">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                            与已有书签重复的 {importResult.dbDuplicates} 个书签已自动跳过
                          </li>
                        )}
                        <li className="flex items-center gap-2">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          成功导入 {importResult.totalImported} 个书签
                        </li>
                        {analyzeBookmarks && importResult.analyzedCount !== undefined && (
                          <li className="flex items-center gap-2">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                            成功分析 {importResult.analyzedCount} 个书签内容
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
          
          {/* 导入成功后显示"导入另一个"按钮 */}
          {importResult.success && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={handleImportAnother}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                导入另一个
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 