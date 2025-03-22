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
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.9955 10.8987C20.1633 7.27152 16.9542 4.79384 13.202 4.79384C8.82869 4.79384 5.28623 8.33629 5.28623 12.7096C5.28623 15.1472 6.35997 17.3405 8.06544 18.8617C8.08748 18.8808 8.09987 18.9061 8.09987 18.9333C8.09987 18.9605 8.08748 18.9858 8.06544 19.0049C7.73624 19.2931 6.20669 20.0956 6.34561 21.2525C6.48889 22.4313 8.28986 22.6138 9.9788 22.1367C11.6678 21.6596 14.2297 20.6562 16.1252 18.9753C17.9333 17.3745 20.9991 14.4337 20.9991 10.8987H20.9955ZM13.6155 18.5919C11.3677 18.8889 8.99099 18.0246 8.02499 16.3228C7.05827 14.621 7.65407 12.5578 9.90183 12.2599C12.1496 11.9629 14.5263 12.8263 15.4923 14.5281C16.459 16.2299 15.8632 18.2931 13.6155 18.5901V18.5919Z" />
                <path d="M12.1552 15.5171C11.1664 16.3815 9.54737 16.1808 8.68298 15.0575C7.8186 13.9342 7.95752 12.2997 8.94628 11.4353C9.93503 10.5709 11.554 10.7716 12.4184 11.8949C13.2828 13.0182 13.1439 14.6527 12.1552 15.5171Z" />
                <path d="M20.2386 3.74792C17.0075 0.516806 11.8702 0.516806 8.63912 3.74792C8.36832 4.01872 8.36832 4.45816 8.63912 4.72896C8.90992 4.99976 9.34935 4.99976 9.62015 4.72896C12.3139 2.03517 16.5638 2.03517 19.2576 4.72896C19.5284 4.99976 19.9678 4.99976 20.2386 4.72896C20.5094 4.45816 20.5094 4.01872 20.2386 3.74792Z" />
                <path d="M17.7367 6.24966C15.8613 4.3743 12.8842 4.3743 11.0088 6.24966C10.738 6.52046 10.738 6.9599 11.0088 7.2307C11.2796 7.5015 11.719 7.5015 11.9898 7.2307C13.3705 5.85003 15.375 5.85003 16.7557 7.2307C17.0265 7.5015 17.4659 7.5015 17.7367 7.2307C18.0075 6.9599 18.0075 6.52046 17.7367 6.24966Z" />
              </svg>
            </Link>
            <Link
              href="https://www.xiaohongshu.com/user/profile/56570b69cb35fb113dec0168" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="小红书"
            >
              <div className="h-4 w-4 relative flex items-center justify-center">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.201 4.584L17.64 2.4a.845.845 0 0 1 1.2.845v5.203c0 .498-.504.845-.976.652l-4.72-1.935m-5.038-1.73L1.359 7.732a.845.845 0 0 0-.559.794v8.07c0 .326.185.623.477.767l10.074 4.96a.845.845 0 0 0 .748 0l10.075-4.96a.845.845 0 0 0 .476-.767V7.732a.845.845 0 0 0-.559-.795l-13.127-4.59a.845.845 0 0 0-.56 0zM10.5 16.5h3m-4.5-3.5h6" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" fill="none"/>
                </svg>
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