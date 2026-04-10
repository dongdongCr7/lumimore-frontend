import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Category, Series, Product, PhotometricGroup } from '@/storage/database/database'
import { jsonbinApi } from '@/storage/jsonbin-api'

export type { Category, Series, Product, PhotometricGroup }

export interface SpecSettings {
  id: number
  productId: number
  logoUrl?: string
  productImage?: string
  dimensionImage?: string
  certifications?: Array<{ name: string; image?: string }>
  footer?: string
  editableSpecs?: Record<string, string>
  photometricGroups?: PhotometricGroup[]
}

export interface SpecTemplate {
  id: number
  categoryId: number
  specNames: string[]
}

// 自定义规格书设置
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
  const useCloudStorage = ref(false)
  const cloudBinUrl = ref<string | null>(null)
  const error = ref<string | null>(null)

  // 数据状态
  const categories = ref<Category[]>([])
  const seriesList = ref<Series[]>([])
  const products = ref<Product[]>([])
  
  // 规格书设置（按产品ID存储）
  const specSettings = ref<Record<number, CustomSpecSettings>>({})

  // 规格模板
  const specTemplates = ref<SpecTemplate[]>([
    { id: 1, categoryId: 1, specNames: ['阻值', '精度', '功率', '封装'] },
    { id: 2, categoryId: 2, specNames: ['类型', '范围', '精度', '接口'] },
    { id: 3, categoryId: 3, specNames: ['输入', '输出', '效率', '保护'] }
  ])

  // 保存到云端
  async function saveToCloud() {
    if (!useCloudStorage.value) return
    await jsonbinApi.saveData({
      categories: categories.value,
      seriesList: seriesList.value,
      products: products.value,
      specTemplates: specTemplates.value,
      specSettings: specSettings.value
    })
  }

  // 从云端加载
  async function loadFromCloud() {
    try {
      const data = await jsonbinApi.readData()
      if (data) {
        if (data.categories?.length) categories.value = data.categories
        if (data.seriesList?.length) seriesList.value = data.seriesList
        if (data.products?.length) products.value = data.products
        if (data.specTemplates?.length) specTemplates.value = data.specTemplates
        if (data.specSettings) specSettings.value = data.specSettings
        cloudBinUrl.value = jsonbinApi.getShareLink()
        return true
      }
    } catch (e) {
      console.error('从云端加载失败:', e)
    }
    return false
  }

  // 监听数据变化，自动保存
  watch([categories, seriesList, products], () => {
    if (isInitialized.value) {
      saveToCloud()
    }
  }, { deep: true })

  watch(specSettings, () => {
    if (isInitialized.value) {
      saveToCloud()
    }
  }, { deep: true })

  // 初始化
  async function initialize() {
    if (isInitialized.value) return
    
    isLoading.value = true
    error.value = null
    
    try {
      // 尝试从云端加载
      const cloudLoaded = await loadFromCloud()
      
      if (cloudLoaded) {
        useCloudStorage.value = true
        console.log('已从云端加载数据:', cloudBinUrl.value)
      } else {
        // 使用默认数据
        categories.value = defaultCategories
        seriesList.value = defaultSeries
        products.value = defaultProducts
        
        // 保存到云端
        await saveToCloud()
        useCloudStorage.value = true
        cloudBinUrl.value = jsonbinApi.getShareLink()
        console.log('已创建云端存储:', cloudBinUrl.value)
      }
      
      isInitialized.value = true
    } catch (e: any) {
      console.error('初始化失败:', e)
      error.value = e.message
      // 使用默认数据（本地模式）
      categories.value = defaultCategories
      seriesList.value = defaultSeries
      products.value = defaultProducts
      useCloudStorage.value = false
      isInitialized.value = true
    } finally {
      isLoading.value = false
    }
  }

  // 获取某分类下的产品数量
  const getProductCountByCategory = computed(() => {
    return (categoryId: number) => products.value.filter(p => p.categoryId === categoryId).length
  })

  // 获取某系列下的产品数量
  const getProductCountBySeries = computed(() => {
    return (seriesId: number) => products.value.filter(p => p.seriesId === seriesId).length
  })

  // 图表数据
  const chartData = computed(() => {
    return categories.value.map(cat => ({
      name: cat.name,
      value: getProductCountByCategory.value(cat.id)
    }))
  })

  // 添加分类
  function addCategory(name: string, description: string) {
    const id = Math.max(...categories.value.map(c => c.id), 0) + 1
    categories.value.push({ id, name, description })
  }

  // 添加系列
  function addSeries(categoryId: number, name: string, description: string, keywords: string[]) {
    const id = Math.max(...seriesList.value.map(s => s.id), 0) + 1
    seriesList.value.push({ id, categoryId, name, description, keywords })
  }

  // 添加产品
  function addProduct(seriesId: number, categoryId: number, name: string, specs: Record<string, string>) {
    const id = Math.max(...products.value.map(p => p.id), 0) + 1
    products.value.push({ id, seriesId, categoryId, name, specs })
  }

  // 删除分类
  function deleteCategory(id: number) {
    categories.value = categories.value.filter(c => c.id !== id)
    seriesList.value = seriesList.value.filter(s => s.categoryId !== id)
    products.value = products.value.filter(p => p.categoryId !== id)
  }

  // 删除系列
  function deleteSeries(id: number) {
    seriesList.value = seriesList.value.filter(s => s.id !== id)
    products.value = products.value.filter(p => p.seriesId !== id)
  }

  // 删除产品
  function deleteProduct(id: number) {
    products.value = products.value.filter(p => p.id !== id)
    delete specSettings.value[id]
  }

  // 更新产品
  function updateProduct(id: number, name: string, specs: Record<string, string>) {
    const product = products.value.find(p => p.id === id)
    if (product) {
      product.name = name
      product.specs = specs
    }
  }

  // 获取规格书设置
  function getSpecSettings(productId: number): CustomSpecSettings | undefined {
    return specSettings.value[productId]
  }

  // 保存规格书设置
  async function saveSpecSettingsForProduct(productId: number, settings: Omit<CustomSpecSettings, 'productId'>) {
    specSettings.value[productId] = {
      productId,
      ...settings
    }
    // 自动保存到云端
    await saveToCloud()
  }

  // 加载规格书设置
  async function loadSpecSettings(productId: number): Promise<CustomSpecSettings | undefined> {
    return specSettings.value[productId]
  }

  return {
    isLoading,
    isInitialized,
    useCloudStorage,
    cloudBinUrl,
    error,
    categories,
    seriesList,
    products,
    specTemplates,
    specSettings,
    getProductCountByCategory,
    getProductCountBySeries,
    chartData,
    initialize,
    addCategory,
    addSeries,
    addProduct,
    deleteCategory,
    deleteSeries,
    deleteProduct,
    updateProduct,
    loadSpecSettings,
    getSpecSettings,
    saveSpecSettingsForProduct
  }
})
