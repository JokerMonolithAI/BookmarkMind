export default function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "BookmarkMind",
          "applicationCategory": "ProductivityApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "CNY"
          },
          "description": "AI智能书签管理平台，通过AI技术将零散的网页书签转化为结构化知识网络",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "86"
          },
          "featureList": "智能解析，多维可视化，无缝迁移，PDF文档关联，隐私守护",
          "applicationSubCategory": "Knowledge Management",
          "author": {
            "@type": "Organization",
            "name": "BookmarkMind Team"
          },
          "potentialAction": {
            "@type": "RegisterAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://www.bookmarkmind.top/signup"
            },
            "description": "注册BookmarkMind，免费使用智能书签管理功能"
          },
          "sameAs": [
            "https://www.bookmarkmind.top",
            "https://www.bookmarkmind.top/login",
            "https://www.bookmarkmind.top/signup"
          ]
        })
      }}
    />
  )
} 