import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Category, Series, Product } from '@/types/models'
import { categoryApi, seriesApi, productApi, specSettingsApi } from '@/services/api'

export type { Category, Series, Product } from '@/types/models'

export interface CustomSpecItem {
  name: string
  value: string
}

export interface CustomSpecSettings {
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
  hasControlSystem?: boolean
  moduleCustomSpecs?: {
    productSetup?: CustomSpecItem[]
    lightEngine?: CustomSpecItem[]
    controlSystem?: CustomSpecItem[]
    electrical?: CustomSpecItem[]
    photometric?: CustomSpecItem[]
    features?: CustomSpecItem[]
  }
}

// ============ Store ============
export const useProductStore = defineStore('product', () => {
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const error = ref<string | null>(null)

  const categories = ref<Category[]>([])
  const seriesList = ref<Series[]>([])
  const products = ref<Product[]>([])
  const specSettings = ref<Record<number, CustomSpecSettings>>({})

  const specTemplates = ref([
    { id: 1, categoryId: 1, specNames: ['阻值', '精度', '功率', '封装'] },
    { id: 2, categoryId: 2, specNames: ['类型', '范围', '精度', '接口'] },
    { id: 3, categoryId: 3, specNames: ['输入', '输出', '效率', '保护'] }
  ])

  // ============ 初始化 ============
  async function initialize() {
    if (isInitialized.value) return
    isLoading.value = true

    try {
      await loadAllData()
    } catch (e: any) {
      error.value = e.message
      console.error('Failed to load data:', e)
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  async function loadAllData() {
    try {
      const [cats, series, prods] = await Promise.all([
        categoryApi.getAll(),
        seriesApi.getAll(),
        productApi.getAll()
      ])
      categories.value = cats || []
      seriesList.value = series || []
      products.value = prods || []
    } catch (e) {
      console.error('Failed to load data:', e)
      categories.value = []
      seriesList.value = []
      products.value = []
    }
  }

  // ============ 备份/恢复 ============
  function exportBackup() {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        categories: categories.value,
        seriesList: seriesList.value,
        products: products.value,
        specTemplates: specTemplates.value,
        specSettings: specSettings.value
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lumimore_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importBackup(): Promise<boolean> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) { resolve(false); return }
        try {
          const backup = JSON.parse(await file.text())
          if (backup.data) {
            // 导入需要逐条写入数据库
            for (const cat of backup.data.categories || []) {
              try { await categoryApi.create({ name: cat.name, description: cat.description }) } catch {}
            }
            await loadAllData()
            resolve(true)
          }
        } catch { resolve(false) }
      }
      input.click()
    })
  }

  // ============ 计算属性 ============
  const getProductCountByCategory = computed(() => (id: number) => 
    products.value.filter(p => p.categoryId === id).length
  )

  const getProductCountBySeries = computed(() => (id: number) => 
    products.value.filter(p => p.seriesId === id).length
  )

  const chartData = computed(() => 
    categories.value.map(cat => ({
      name: cat.name,
      value: getProductCountByCategory.value(cat.id)
    }))
  )

  // ============ Categories CRUD ============
  async function addCategory(name: string, description: string) {
    const result = await categoryApi.create({ name, description })
    categories.value.push(result)
    return result
  }

  async function deleteCategory(id: number) {
    await categoryApi.delete(id)
    categories.value = categories.value.filter(c => c.id !== id)
    seriesList.value = seriesList.value.filter(s => s.categoryId !== id)
    products.value = products.value.filter(p => p.categoryId !== id)
  }

  // ============ Series CRUD ============
  async function addSeries(categoryId: number, name: string, description: string, keywords: string[]) {
    const result = await seriesApi.create({ categoryId, name, description, keywords })
    seriesList.value.push(result)
    return result
  }

  async function deleteSeries(id: number) {
    await seriesApi.delete(id)
    seriesList.value = seriesList.value.filter(s => s.id !== id)
    products.value = products.value.filter(p => p.seriesId !== id)
  }

  // ============ Products CRUD ============
  async function addProduct(seriesId: number, categoryId: number, name: string, specs: Record<string, string>) {
    const result = await productApi.create({ seriesId, categoryId, name, specs })
    products.value.push(result)
    return result
  }

  async function deleteProduct(id: number) {
    await productApi.delete(id)
    products.value = products.value.filter(p => p.id !== id)
    delete specSettings.value[id]
  }

  async function updateProduct(id: number, name: string, specs: Record<string, string>) {
    const product = products.value.find(p => p.id === id)
    if (!product) return
    const result = await productApi.update(id, { 
      seriesId: product.seriesId, 
      categoryId: product.categoryId, 
      name, 
      specs 
    })
    const index = products.value.findIndex(p => p.id === id)
    if (index !== -1) {
      products.value[index] = result
    }
    return result
  }

  // ============ Spec Settings ============
  async function getSpecSettings(productId: number): Promise<CustomSpecSettings | undefined> {
    if (specSettings.value[productId]) {
      return specSettings.value[productId]
    }
    try {
      const settings = await specSettingsApi.get(productId)
      if (settings) {
        specSettings.value[productId] = settings
        return settings
      }
    } catch (e) {
      console.error('Failed to load spec settings:', e)
    }
    return undefined
  }

  async function saveSpecSettingsForProduct(productId: number, settings: Omit<CustomSpecSettings, 'productId'>) {
    const result = await specSettingsApi.save({ productId, ...settings })
    specSettings.value[productId] = { productId, ...settings }
    return result
  }

  async function loadSpecSettings(productId: number): Promise<CustomSpecSettings | undefined> {
    return getSpecSettings(productId)
  }

  return {
    isLoading, isInitialized, error,
    categories, seriesList, products, specTemplates, specSettings,
    getProductCountByCategory, getProductCountBySeries, chartData,
    initialize,
    addCategory, addSeries, addProduct,
    deleteCategory, deleteSeries, deleteProduct,
    updateProduct,
    getSpecSettings, saveSpecSettingsForProduct, loadSpecSettings,
    exportBackup, importBackup,
    loadAllData
  }
})
