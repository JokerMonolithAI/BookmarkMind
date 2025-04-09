'use client';

import Link from 'next/link';
import { Github, Twitter, Mail, ExternalLink } from 'lucide-react';
import Image from 'next/image';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-4 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <span>© {currentYear}</span>
            <div className="w-5 h-5 bg-blue-50 dark:bg-blue-900 flex items-center justify-center rounded-full">
              <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-medium">BookmarkMind</span>
          </div>
          
          <div className="flex items-center">
            <Link 
              href="https://www.jokerai.info/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <span className="mr-1">由 Joker AI 精心打造</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href="https://github.com/JokerMonolithAI" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </Link>
            <Link
              href="https://x.com/Arthur_Joker" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </Link>
            <Link
              href="https://weibo.com/u/1336036062" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="微博"
            >
              <div className="h-4 w-4 relative">
                <Image 
                  src="/sina-weibo-logo.svg"
                  alt="微博"
                  width={16}
                  height={16}
                  className="text-current"
                />
              </div>
            </Link>
            <Link
              href="https://www.xiaohongshu.com/user/profile/56570b69cb35fb113dec0168" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="小红书"
            >
              <div className="h-4 w-4 relative">
                <Image 
                  src="/Xiaohongshu.svg"
                  alt="小红书"
                  width={16}
                  height={16}
                  className="text-current"
                />
              </div>
            </Link>
            <Link
              href="mailto:king.arthhur.han@gmail.com" 
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 