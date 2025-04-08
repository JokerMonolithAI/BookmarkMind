import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from 'sonner'
import { BookmarkProvider } from '@/context/BookmarkContext'
import { ThemeProvider } from '@/components/theme-provider'
import StructuredData from '@/components/structured-data'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BookmarkMind - AI智能书签管理平台，知识整理的得力助手",
  description: "BookmarkMind通过AI技术将零散的网页书签转化为结构化知识网络，支持多维可视化、脑图生成、PDF关联，让知识管理更轻松高效。",
  keywords: "书签管理,知识管理,脑图生成,AI书签,知识网络,书签整理,PDF管理,思维导图,知识图谱",
  authors: [{ name: "BookmarkMind Team" }],
  creator: "BookmarkMind",
  publisher: "BookmarkMind",
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://www.bookmarkmind.top',
    title: 'BookmarkMind - AI智能书签管理平台',
    description: '通过AI技术将零散的网页书签转化为结构化知识网络，实现「书签→知识→洞察」的认知升级',
    siteName: 'BookmarkMind',
    images: [
      {
        url: 'https://www.bookmarkmind.top/1.png',
        width: 1200,
        height: 630,
        alt: 'BookmarkMind - 智能书签管理平台',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BookmarkMind - 智能书签管理平台',
    description: 'AI驱动的智能书签管理工具，提供多维可视化和知识网络构建',
    images: ['https://www.bookmarkmind.top/1.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.bookmarkmind.top',
  },
  verification: {
    google: 'google-site-verification-code',
    other: {
      baidu: 'baidu-site-verification-code'
    }
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="sitemap" href="/sitemap.xml" type="application/xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <BookmarkProvider>
              {children}
            </BookmarkProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
        <StructuredData />
      </body>
    </html>
  );
}
