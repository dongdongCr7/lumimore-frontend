import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  categoryApi, 
  seriesApi, 
  productApi, 
  specSettingsApi,
  type Category,
  type Series,
  type Product,
  type SpecSettings,
  type PhotometricGroup
} from '@/storage/database/database'

export type { Category, Series, Product, SpecSettings, PhotometricGroup }

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

// 默认数据
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

export const useProductStore = defineStore('product', () => {
  const isLoading = ref(false)
  const isInitialized = ref(false)
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

  // 初始化：从数据库加载数据
  async function initialize() {
    if (isInitialized.value) return
    
    isLoading.value = true
    error.value = null
    
    try {
      // 并行加载所有数据
      const [categoriesData, seriesData, productsData] = await Promise.all([
        categoryApi.getAll(),
        seriesApi.getAll(),
        productApi.getAll()
      ])
      
      // 如果数据库为空，使用默认数据
      if (categoriesData.length === 0) {
        categories.value = defaultCategories
        seriesList.value = defaultSeries
        products.value = defaultProducts
        // 创建默认数据到数据库
        await Promise.all([
          categoryApi.create(defaultCategories[0].name, defaultCategories[0].description),
          seriesApi.create(defaultSeries[0].categoryId, defaultSeries[0].name, defaultSeries[0].description, defaultSeries[0].keywords),
          productApi.create(defaultProducts[0].seriesId, defaultProducts[0].categoryId, defaultProducts[0].name, defaultProducts[0].specs)
        ])
        // 重新加载
        const [newSeriesData, newProductsData] = await Promise.all([
          seriesApi.getAll(),
          productApi.getAll()
        ])
        seriesList.value = newSeriesData
        products.value = newProductsData
      } else {
        categories.value = categoriesData
        seriesList.value = seriesData
        products.value = productsData
      }
      
      isInitialized.value = true
    } catch (e: any) {
      console.error('初始化数据失败:', e)
      error.value = e.message
      // 使用本地默认数据作为降级
      categories.value = defaultCategories
      seriesList.value = defaultSeries
      products.value = defaultProducts
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
  async function addCategory(name: string, description: string) {
    try {
      const newCategory = await categoryApi.create(name, description)
      categories.value.push(newCategory)
    } catch (e: any) {
      console.error('添加分类失败:', e)
      throw e
    }
  }

  // 添加系列
  async function addSeries(categoryId: number, name: string, description: string, keywords: string[]) {
    try {
      const newSeries = await seriesApi.create(categoryId, name, description, keywords)
      seriesList.value.push(newSeries)
    } catch (e: any) {
      console.error('添加系列失败:', e)
      throw e
    }
  }

  // 添加产品
  async function addProduct(seriesId: number, categoryId: number, name: string, specs: Record<string, string>) {
    try {
      const newProduct = await productApi.create(seriesId, categoryId, name, specs)
      products.value.push(newProduct)
    } catch (e: any) {
      console.error('添加产品失败:', e)
      throw e
    }
  }

  // 删除分类
  async function deleteCategory(id: number) {
    try {
      await categoryApi.delete(id)
      categories.value = categories.value.filter(c => c.id !== id)
      // 同时删除该分类下的系列和产品
      seriesList.value = seriesList.value.filter(s => s.categoryId !== id)
      products.value = products.value.filter(p => p.categoryId !== id)
    } catch (e: any) {
      console.error('删除分类失败:', e)
      throw e
    }
  }

  // 删除系列
  async function deleteSeries(id: number) {
    try {
      await seriesApi.delete(id)
      seriesList.value = seriesList.value.filter(s => s.id !== id)
      products.value = products.value.filter(p => p.seriesId !== id)
    } catch (e: any) {
      console.error('删除系列失败:', e)
      throw e
    }
  }

  // 删除产品
  async function deleteProduct(id: number) {
    try {
      await productApi.delete(id)
      products.value = products.value.filter(p => p.id !== id)
      // 删除对应的规格书设置
      delete specSettings.value[id]
    } catch (e: any) {
      console.error('删除产品失败:', e)
      throw e
    }
  }

  // 更新产品
  async function updateProduct(id: number, name: string, specs: Record<string, string>) {
    try {
      const updated = await productApi.update(id, name, specs)
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = updated
      }
    } catch (e: any) {
      console.error('更新产品失败:', e)
      throw e
    }
  }

  // 获取某产品ID的规格书设置（从数据库加载）
  async function loadSpecSettings(productId: number): Promise<CustomSpecSettings | undefined> {
    if (specSettings.value[productId]) {
      return specSettings.value[productId]
    }
    
    try {
      const dbSettings = await specSettingsApi.getByProduct(productId)
      if (dbSettings) {
        const settings: CustomSpecSettings = {
          productId: dbSettings.productId,
          logoUrl: dbSettings.logoUrl,
          productImage: dbSettings.productImage,
          dimensionImage: dbSettings.dimensionImage,
          certifications: dbSettings.certifications,
          footer: dbSettings.footer,
          editableSpecs: dbSettings.editableSpecs,
          photometricGroups: dbSettings.photometricGroups
        }
        specSettings.value[productId] = settings
        return settings
      }
    } catch (e: any) {
      console.error('加载规格书设置失败:', e)
    }
    return undefined
  }

  // 获取本地规格书设置
  function getSpecSettings(productId: number): CustomSpecSettings | undefined {
    return specSettings.value[productId]
  }

  // 保存某产品ID的规格书设置到数据库
  async function saveSpecSettingsForProduct(productId: number, settings: Omit<CustomSpecSettings, 'productId'>) {
    try {
      await specSettingsApi.upsert({
        product_id: productId,
        logo_url: settings.logoUrl,
        product_image: settings.productImage,
        dimension_image: settings.dimensionImage,
        certifications: settings.certifications,
        footer: settings.footer,
        editable_specs: settings.editableSpecs,
        photometric_groups: settings.photometricGroups
      })
      
      // 更新本地缓存
      specSettings.value[productId] = {
        productId,
        ...settings
      }
    } catch (e: any) {
      console.error('保存规格书设置失败:', e)
      throw e
    }
  }

  return {
    isLoading,
    isInitialized,
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
