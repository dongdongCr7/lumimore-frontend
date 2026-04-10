import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Category, Series, Product, PhotometricGroup } from '@/types/models'

export type { Category, Series, Product, PhotometricGroup }

export interface SpecTemplate {
  id: number
  categoryId: number
  specNames: string[]
}

export interface CustomSpecSettings {
  productId: number
  logoUrl?: string
  productImage?: string
  dimensionImage?: string
  certifications?: Array<{ name: string; image?: string }>
  footer?: string
  editableSpecs?: Record<string, string>
  photometricGroups?: PhotometricGroup[]
}

// ============ 默认数据 ============
const defaultCategories: Category[] = [
  { id: 5, name: 'LUMISTRIP', description: '高显指LED灯带系列' }
]

const defaultSeries: Series[] = [
  { id: 9, categoryId: 5, name: '2835', description: '2835 SMD 高显指灯带', keywords: ['2835', '高显指', 'Ra98', '灯带'] }
]

const defaultProducts: Product[] = [
  { 
    id: 1, 
    seriesId: 9, 
    categoryId: 5, 
    name: 'White 14.4W 2835 120LED 10MM', 
    specs: { 
      'LED密度': '120LED/M',
      '功率': '14.4W/m',
      'LED类型': '2835 SMD',
      '显色指数': 'Ra98+',
      'R9值': '>98',
      'R12值': '>98',
      '色温': '2700K-5700K',
      '光通量': '1200lm/m',
      '能效': '80lm/W',
      '输入电压': '24V DC',
      '裁剪单元': '50mm',
      '总宽度': '10mm',
      '基板宽度': '12mm',
      'IP等级': 'IP20',
      '发光角度': '120°',
      '工作温度': '-20°C ~ +45°C',
      '储存温度': '-30°C ~ +70°C',
      '寿命': '>50,000小时',
      '认证': 'CE, RoHS'
    }
  }
]

// ============ Store ============
export const useProductStore = defineStore('product', () => {
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const error = ref<string | null>(null)

  const categories = ref<Category[]>([])
  const seriesList = ref<Series[]>([])
  const products = ref<Product[]>([])
  const specSettings = ref<Record<number, CustomSpecSettings>>({})

  const specTemplates = ref<SpecTemplate[]>([
    { id: 1, categoryId: 1, specNames: ['阻值', '精度', '功率', '封装'] },
    { id: 2, categoryId: 2, specNames: ['类型', '范围', '精度', '接口'] },
    { id: 3, categoryId: 3, specNames: ['输入', '输出', '效率', '保护'] }
  ])

  const STORAGE_KEY = 'lumimore_product_data'
  const SPEC_SETTINGS_KEY = 'lumimore_spec_settings'

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      categories: categories.value,
      seriesList: seriesList.value,
      products: products.value,
      specTemplates: specTemplates.value
    }))
    localStorage.setItem(SPEC_SETTINGS_KEY, JSON.stringify(specSettings.value))
  }

  watch([categories, seriesList, products, specTemplates, specSettings], () => {
    if (isInitialized.value) saveData()
  }, { deep: true })

  async function initialize() {
    if (isInitialized.value) return
    isLoading.value = true

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const savedSpecs = localStorage.getItem(SPEC_SETTINGS_KEY)

      if (saved) {
        const data = JSON.parse(saved)
        categories.value = data.categories?.length ? data.categories : defaultCategories
        seriesList.value = data.seriesList?.length ? data.seriesList : defaultSeries
        products.value = data.products?.length ? data.products : defaultProducts
        specTemplates.value = data.specTemplates?.length ? data.specTemplates : specTemplates.value
      } else {
        categories.value = defaultCategories
        seriesList.value = defaultSeries
        products.value = defaultProducts
      }

      if (savedSpecs) {
        specSettings.value = JSON.parse(savedSpecs)
      }
    } catch (e: any) {
      error.value = e.message
      categories.value = defaultCategories
      seriesList.value = defaultSeries
      products.value = defaultProducts
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

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
            categories.value = backup.data.categories || []
            seriesList.value = backup.data.seriesList || []
            products.value = backup.data.products || []
            specTemplates.value = backup.data.specTemplates || []
            specSettings.value = backup.data.specSettings || {}
            saveData()
            resolve(true)
          }
        } catch { resolve(false) }
      }
      input.click()
    })
  }

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

  function addCategory(name: string, description: string) {
    const id = Math.max(...categories.value.map(c => c.id), 0) + 1
    categories.value.push({ id, name, description })
  }

  function addSeries(categoryId: number, name: string, description: string, keywords: string[]) {
    const id = Math.max(...seriesList.value.map(s => s.id), 0) + 1
    seriesList.value.push({ id, categoryId, name, description, keywords })
  }

  function addProduct(seriesId: number, categoryId: number, name: string, specs: Record<string, string>) {
    const id = Math.max(...products.value.map(p => p.id), 0) + 1
    products.value.push({ id, seriesId, categoryId, name, specs })
  }

  function deleteCategory(id: number) {
    categories.value = categories.value.filter(c => c.id !== id)
    seriesList.value = seriesList.value.filter(s => s.categoryId !== id)
    products.value = products.value.filter(p => p.categoryId !== id)
  }

  function deleteSeries(id: number) {
    seriesList.value = seriesList.value.filter(s => s.id !== id)
    products.value = products.value.filter(p => p.seriesId !== id)
  }

  function deleteProduct(id: number) {
    products.value = products.value.filter(p => p.id !== id)
    delete specSettings.value[id]
  }

  function updateProduct(id: number, name: string, specs: Record<string, string>) {
    const product = products.value.find(p => p.id === id)
    if (product) { product.name = name; product.specs = specs }
  }

  function getSpecSettings(productId: number): CustomSpecSettings | undefined {
    return specSettings.value[productId]
  }

  function saveSpecSettingsForProduct(productId: number, settings: Omit<CustomSpecSettings, 'productId'>) {
    specSettings.value[productId] = { productId, ...settings }
  }

  async function loadSpecSettings(productId: number): Promise<CustomSpecSettings | undefined> {
    return specSettings.value[productId]
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
    exportBackup, importBackup
  }
})
