// 移除'use client'指令，使其成为服务器组件
import { TagDetailsClient } from './TagDetailsClient';

// 将组件改为异步函数，并使用 await 来解包 params
export default async function TagDetailsPage({ params }: { params: { id: string } }) {
  // 等待 params 解析完成
  const unwrappedParams = await params;
  
  // 服务器组件将解析后的 id 传递给客户端组件
  return <TagDetailsClient tagId={unwrappedParams.id} />;
} 