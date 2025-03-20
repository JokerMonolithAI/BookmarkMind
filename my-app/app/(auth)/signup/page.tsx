'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save additional user data to Firebase Realtime Database
      await set(ref(db, `users/${user.uid}`), {
        name,
        email,
        createdAt: new Date().toISOString(),
      });

      router.push('/dashboard');
    } catch (error: any) {
      // 提供更具体的错误信息
      if (error.code === 'auth/email-already-in-use') {
        setError('该邮箱已被注册，请使用其他邮箱或直接登录');
      } else if (error.code === 'auth/weak-password') {
        setError('密码强度不足，请使用至少6位字符的密码');
      } else {
        setError('注册失败，请重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // 检查用户是否为首次使用Google登录
      const userRef = ref(db, `users/${user.uid}`);
      
      // 保存用户数据（无论是否为新用户，都更新信息）
      await set(userRef, {
        name: user.displayName || '用户',
        email: user.email,
        createdAt: new Date().toISOString(),
      });
      
      router.push('/dashboard');
    } catch (error) {
      setError('Google 注册失败，请重试');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50 p-4">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-50 flex items-center justify-center rounded-full">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-gray-900 tracking-tight">BookmarkMind</h2>
          <p className="mt-1 text-sm text-gray-500">智能书签管理平台</p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSignup}>
          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                姓名
              </label>
              <input
                id="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all duration-200"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入您的姓名"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                id="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  注册中...
                </span>
              ) : (
                "注册"
              )}
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading}
              className="w-full py-2.5 px-4 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  处理中...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  使用 Google 账号注册
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-600">
            已有账号?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium transition-colors">
              登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 