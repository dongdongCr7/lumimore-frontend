/**
 * Supabase 客户端 - 浏览器版本
 * 环境变量由 Coze 平台自动注入
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * 获取 Supabase 客户端实例
 */
function getSupabaseClient(): SupabaseClient {
  if (client) {
    return client
  }

  // 从环境变量获取凭证
  // 在 Coze 环境中，这些通过 Vite 的 import.meta.env 暴露
  const url = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.COZE_SUPABASE_URL) as string
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.COZE_SUPABASE_ANON_KEY) as string

  if (!url) {
    throw new Error('Supabase URL is not configured. Please set VITE_SUPABASE_URL or COZE_SUPABASE_URL environment variable.')
  }

  if (!anonKey) {
    throw new Error('Supabase Anon Key is not configured. Please set VITE_SUPABASE_ANON_KEY or COZE_SUPABASE_ANON_KEY environment variable.')
  }

  client = createClient(url, anonKey, {
    db: {
      timeout: 60000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return client
}

export { getSupabaseClient }
