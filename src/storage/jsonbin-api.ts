/**
 * JSONBin.io API - 免费云端存储
 * 无需服务器注册，直接可用
 */
const BASE_URL = 'https://api.jsonbin.io/v3'
const BIN_ID_KEY = 'lumimore_bin_id'
const API_KEY_KEY = 'lumimore_api_key'

// 获取或创建 Bin
async function getOrCreateBin(): Promise<{ binId: string; apiKey: string }> {
  const storedBinId = localStorage.getItem(BIN_ID_KEY)
  const storedApiKey = localStorage.getItem(API_KEY_KEY)

  if (storedBinId && storedApiKey) {
    return { binId: storedBinId, apiKey: storedApiKey }
  }

  // 创建新的 bin
  const response = await fetch(`${BASE_URL}/b`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bin-Private': 'false' // 公开读，需要 API key 写
    },
    body: JSON.stringify({
      categories: [],
      seriesList: [],
      products: [],
      specTemplates: [],
      specSettings: {}
    })
  })

  const data = await response.json()
  const binId = data.metadata.id as string
  const apiKey = data.metadata.privateKey as string

  // 保存到 localStorage
  localStorage.setItem(BIN_ID_KEY, binId)
  localStorage.setItem(API_KEY_KEY, apiKey)

  console.log('已创建新的数据存储 bin:', binId)
  return { binId, apiKey }
}

// 读取数据
async function readData(): Promise<any> {
  try {
    const { binId, apiKey } = await getOrCreateBin()
    
    const response = await fetch(`${BASE_URL}/b/${binId}/latest`, {
      headers: {
        'X-Master-Key': apiKey
      }
    })

    if (!response.ok) {
      throw new Error('读取数据失败')
    }

    const result = await response.json()
    return result.record
  } catch (error) {
    console.error('读取数据失败:', error)
    return null
  }
}

// 保存数据
async function saveData(data: any): Promise<boolean> {
  try {
    const { binId, apiKey } = await getOrCreateBin()

    const response = await fetch(`${BASE_URL}/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey
      },
      body: JSON.stringify(data)
    })

    return response.ok
  } catch (error) {
    console.error('保存数据失败:', error)
    return false
  }
}

// 获取分享链接
function getShareLink(): string | null {
  const binId = localStorage.getItem(BIN_ID_KEY)
  if (binId) {
    return `https://jsonbin.io/${binId}`
  }
  return null
}

// 检查是否已配置
function isConfigured(): boolean {
  return !!(localStorage.getItem(BIN_ID_KEY) && localStorage.getItem(API_KEY_KEY))
}

export const jsonbinApi = {
  readData,
  saveData,
  getOrCreateBin,
  getShareLink,
  isConfigured
}
