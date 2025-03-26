import { createClient } from '@supabase/supabase-js'

// 创建 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 如果 URL 或密钥未定义，将引发错误
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少 Supabase 环境变量')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 