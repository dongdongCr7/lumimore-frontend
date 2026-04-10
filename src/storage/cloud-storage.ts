/**
 * JSONStore.io API - 完全免费，无需注册
 * https://jsonstore.io
 */

const STORE_URL = 'https://www.jsonstore.io'
const STORAGE_KEY = 'lumimore_store_endpoint'

interface StoreData {
  categories: any[]
  seriesList: any[]
  products: any[]
  specTemplates: any[]
  specSettings: Record<string, any>
  updatedAt: string
}

// 获取或创建存储端点
function getEndpoint(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

function saveEndpoint(endpoint: string) {
  localStorage.setItem(STORAGE_KEY, endpoint)
}

// 初始化存储
async function init(): Promise<boolean> {
  let endpoint = getEndpoint()
  
  if (!endpoint) {
    // 生成随机端点
    const randomPart = Math.random().toString(36).substring(2) + Date.now().toString(36)
    endpoint = `${STORE_URL}/${randomPart}`
    saveEndpoint(endpoint)
  }
  
  // 测试连接
  try {
    const response = await fetch(endpoint, {
      method: 'GET'
    })
    return response.ok
  } catch {
    return false
  }
}

// 读取数据
async function readData(): Promise<StoreData | null> {
  const endpoint = getEndpoint()
  if (!endpoint) return null
  
  try {
    const response = await fetch(endpoint)
    if (response.ok) {
      const data = await response.json()
      if (data.result) {
        return data.result as StoreData
      }
    }
  } catch (e) {
    console.error('读取云端数据失败:', e)
  }
  return null
}

// 保存数据
async function saveData(data: Omit<StoreData, 'updatedAt'>): Promise<boolean> {
  const endpoint = getEndpoint()
  if (!endpoint) {
    await init()
  }
  
  const finalEndpoint = getEndpoint()
  if (!finalEndpoint) return false
  
  try {
    const response = await fetch(finalEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...data,
        updatedAt: new Date().toISOString()
      })
    })
    return response.ok
  } catch (e) {
    console.error('保存到云端失败:', e)
    return false
  }
}

// 获取分享链接
function getShareLink(): string | null {
  return getEndpoint()
}

// 检查是否已初始化
function isConfigured(): boolean {
  return !!getEndpoint()
}

export const cloudStorage = {
  init,
  readData,
  saveData,
  getShareLink,
  isConfigured
}
