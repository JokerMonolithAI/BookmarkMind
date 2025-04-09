'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Footer } from '@/components/ui/footer';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Brain, Check, Clock, FileText, Folder, Heart, HeartHandshake, MoveRight, Share2, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(1);
  const totalImages = 4;
  
  // 显示加载动画2秒，然后展示landing page
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // 轮播图自动切换
  useEffect(() => {
    if (isLoading) return;
    
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev % totalImages) + 1);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleGetStarted = () => {
    router.push('/login');
  };

  const nextImage = () => {
    setActiveImage((prev) => (prev % totalImages) + 1);
  };

  const prevImage = () => {
    setActiveImage((prev) => (prev === 1 ? totalImages : prev - 1));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {isLoading ? (
        // 加载页面
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center p-5">
            <div className="relative w-24 h-24 mb-6">
              <Image 
                src="/logo.svg" 
                alt="BookmarkMind Logo" 
                width={96}
                height={96}
                className="animate-pulse"
              />
            </div>
            <h1 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
              BookmarkMind
            </h1>
            <div className="flex items-center space-x-2 mt-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
            </div>
          </div>
        </div>
      ) : (
        // Landing Page
        <main className="flex-grow">
          {/* 导航栏 */}
          <nav className="py-4 px-6 flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Logo" width={32} height={32} />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">BookmarkMind</span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="https://afdian.com/a/bookmarkmind" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
              >
                <Heart className="h-4 w-4 text-pink-500" fill="currentColor" />
                <span>爱发电</span>
              </Link>
              <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">登录</Link>
              <Link href="/signup" className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">注册</Link>
            </div>
          </nav>
          
          {/* 头部区域 */}
          <section className="pt-16 pb-16 px-4 md:px-6 text-center max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
              智能书签管理平台
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
              通过AI技术将零散的网页书签转化为结构化知识网络，实现「书签 → 知识 → 洞察」的认知升级
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleGetStarted}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              >
                开始使用 <ArrowRight size={18} />
              </button>
              <a 
                href="#features" 
                className="px-8 py-3 rounded-full border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                了解更多
              </a>
            </div>
          </section>

          {/* 应用截图轮播 */}
          <section className="py-8 px-4 md:px-6 max-w-6xl mx-auto">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="ml-4 bg-white dark:bg-gray-700 rounded-full h-6 w-full max-w-md flex items-center px-3 text-xs text-gray-400">
                  bookmarkmind.top
                </div>
              </div>
              <div className="relative">
                {/* 图片展示区域 */}
                <div className="aspect-[16/9] relative overflow-hidden">
                  {[1, 2, 3, 4].map((num) => (
                    <Image 
                      key={num}
                      src={`/${num}.png`}
                      alt={`BookmarkMind 应用截图 ${num}`}
                      fill
                      className={`object-cover transition-opacity duration-500 ${
                        activeImage === num ? 'opacity-100' : 'opacity-0'
                      }`}
                      priority={num === 1}
                    />
                  ))}
                </div>
                
                {/* 导航按钮 */}
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 focus:outline-none"
                  aria-label="上一张图片"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
                
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 focus:outline-none"
                  aria-label="下一张图片"
                >
                  <ArrowRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
                
                {/* 指示器 */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setActiveImage(num)}
                      className={`w-2 h-2 rounded-full ${
                        activeImage === num 
                          ? 'bg-white' 
                          : 'bg-white/50 hover:bg-white/70'
                      }`}
                      aria-label={`切换到图片 ${num}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 主要特性展示 */}
          <section id="features" className="py-16 px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-16">一站式智能书签管理解决方案</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* 特性卡片 */}
                <FeatureCard 
                  icon={<Brain className="w-10 h-10 text-blue-500" />}
                  title="智能解析"
                  description="自动提取网页核心内容，生成结构化知识卡片"
                />
                <FeatureCard 
                  icon={<Share2 className="w-10 h-10 text-blue-500" />}
                  title="多维可视化"
                  description="支持脑图/时间轴/3D空间三种知识呈现模式"
                />
                <FeatureCard 
                  icon={<Folder className="w-10 h-10 text-blue-500" />}
                  title="无缝迁移"
                  description="兼容主流浏览器书签格式一键导入"
                />
                <FeatureCard 
                  icon={<FileText className="w-10 h-10 text-blue-500" />}
                  title="PDF文档关联"
                  description="为书签关联本地PDF文档，整合线上线下资料"
                />
                <FeatureCard 
                  icon={<Clock className="w-10 h-10 text-blue-500" />}
                  title="时间轴视图"
                  description="时间维度展示知识收集历程，回顾学习轨迹"
                />
                <FeatureCard 
                  icon={<ShieldCheck className="w-10 h-10 text-blue-500" />}
                  title="隐私守护"
                  description="端到端加密存储，用户数据完全自主控制"
                />
              </div>
            </div>
          </section>

          {/* 用户场景 */}
          <section className="py-16 px-4 md:px-6 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4">为知识工作者打造</h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
                无论您是学生、研究人员、职场人士还是知识爱好者，BookmarkMind都能满足您的知识管理需求
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                <UserTypeCard 
                  title="学生"
                  description="整理学习资料，构建知识体系，提高学习效率"
                  features={[
                    "课程资料整理归类",
                    "学习笔记与网页资源关联",
                    "考试复习知识脑图生成"
                  ]}
                />
                <UserTypeCard 
                  title="研究人员"
                  description="收集研究文献，分析研究成果，发现研究热点"
                  features={[
                    "文献收集与分类",
                    "研究方向可视化",
                    "跨领域知识关联发现"
                  ]}
                />
              </div>
            </div>
          </section>

          {/* 号召行动 */}
          <section className="py-20 px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">立即开始您的知识管理之旅</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                加入BookmarkMind，让AI助您整理知识，提升认知
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleGetStarted}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium text-lg inline-flex items-center gap-2 hover:shadow-lg transition-all"
                >
                  免费注册 <MoveRight size={20} />
                </button>
                <Link 
                  href="https://afdian.com/a/bookmarkmind"
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="px-8 py-3 rounded-full border border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 font-medium hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all inline-flex items-center gap-2"
                >
                  支持我们 <Heart size={18} fill="currentColor" />
                </Link>
              </div>
            </div>
          </section>
        </main>
      )}
      <Footer />
    </div>
  );
}

// 特性卡片组件
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

// 用户类型卡片
interface UserTypeCardProps {
  title: string;
  description: string;
  features: string[];
}

function UserTypeCard({ title, description, features }: UserTypeCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm">
      <h3 className="text-2xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
      <ul className="space-y-3">
        {features.map((feature: string, index: number) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="min-w-5 h-5 text-green-500 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
