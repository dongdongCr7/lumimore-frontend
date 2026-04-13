import axios from 'axios'

// API 基础配置 - 使用 Railway 后端
const API_BASE_URL = 'https://lumimore-server-production.up.railway.app/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ============ Categories API ============
export const categoryApi = {
  getAll: () => api.get('/categories').then(res => res.data),
  create: (data: { name: string; description: string }) => 
    api.post('/categories', data).then(res => res.data),
  update: (id: number, data: { name: string; description: string }) => 
    api.put(`/categories/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/categories/${id}`).then(res => res.data)
}

// ============ Series API ============
export const seriesApi = {
  getAll: () => api.get('/series').then(res => res.data),
  create: (data: { categoryId: number; name: string; description: string; keywords?: string[] }) => 
    api.post('/series', data).then(res => res.data),
  update: (id: number, data: { categoryId: number; name: string; description: string; keywords?: string[] }) => 
    api.put(`/series/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/series/${id}`).then(res => res.data)
}

// ============ Products API ============
export const productApi = {
  getAll: () => api.get('/products').then(res => res.data),
  getById: (id: number) => api.get(`/products/${id}`).then(res => res.data),
  create: (data: { seriesId: number; categoryId: number; name: string; specs?: Record<string, string>; image?: string }) => 
    api.post('/products', data).then(res => res.data),
  update: (id: number, data: { seriesId: number; categoryId: number; name: string; specs?: Record<string, string>; image?: string }) => 
    api.put(`/products/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/products/${id}`).then(res => res.data)
}

// ============ Spec Settings API ============
export const specSettingsApi = {
  get: (productId: number) => api.get(`/spec-settings/${productId}`).then(res => res.data).catch(() => null),
  save: (data: {
    productId: number
    logoUrl?: string
    productImage?: string
    dimensionImage?: string
    certifications?: Array<{ name: string; image?: string }>
    footer?: string
    editableSpecs?: Record<string, string>
    photometricRows?: Array<{
      model: string
      power: string
      cct: string
      cri: string
      lumen: string
      efficacy: string
    }>
    moduleCustomSpecs?: Record<string, Array<{ name: string; value: string }>>
    hasControlSystem?: boolean
  }) => api.post('/spec-settings', data).then(res => res.data)
}

export default api
