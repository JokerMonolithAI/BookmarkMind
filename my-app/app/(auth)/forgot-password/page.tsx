'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setError('未找到该邮箱对应的账户');
      } else if (error.code === 'auth/invalid-email') {
        setError('请输入有效的邮箱地址');
      } else {
        setError('发送密码重置邮件失败，请重试');
      }
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
        <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">忘记密码</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">我们将向您的邮箱发送密码重置链接</p>
      </div>

      {success ? (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-md flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300">重置链接已发送</h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                我们已向 {email} 发送了一封包含密码重置链接的邮件。请检查您的收件箱，并点击邮件中的链接重置密码。
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-2.5 px-4 border border-transparent rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            返回登录
          </button>
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-800 focus:border-blue-500 focus:outline-none transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
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
                  发送中...
                </span>
              ) : (
                "发送重置链接"
              )}
            </button>
          </div>
        </form>
      )}

      <div className="text-center pt-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          记起密码了?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
            返回登录
          </Link>
        </p>
      </div>
    </div>
  );
} 