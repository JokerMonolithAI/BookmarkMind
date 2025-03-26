'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 验证 URL 中是否包含密码重置所需的令牌
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (!hashParams.get('access_token')) {
      setError('无效的重置链接');
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('密码长度必须至少为 6 个字符');
      setIsLoading(false);
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setSuccess(true);
      
      // 3秒后跳转到登录页
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setError('密码重置失败，请重试');
      console.error('密码重置错误:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-6 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-50 dark:bg-blue-900 flex items-center justify-center rounded-full">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">重置密码</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">请输入您的新密码</p>
      </div>

      {success ? (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-md flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300">密码已重置</h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                您的密码已重置成功。即将为您跳转到登录页面...
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form className="mt-6 space-y-5" onSubmit={handleResetPassword}>
          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-md text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                新密码
              </label>
              <input
                id="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-800 focus:border-blue-500 focus:outline-none transition-all duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                确认新密码
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-800 focus:border-blue-500 focus:outline-none transition-all duration-200"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 border border-transparent rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  处理中...
                </span>
              ) : (
                "重置密码"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 