import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Category {
  id: number
  name: string
  description: string
}

export interface Series {
  id: number
  categoryId: number
  name: string
  description: string
  keywords: string[]
}

export interface Product {
  id: number
  seriesId: number
  categoryId: number
  name: string
  specs: Record<string, string>
  image?: string
}

export interface SpecTemplate {
  id: number
  categoryId: number
  specNames: string[]
}

export const useProductStore = defineStore('product', () => {
  // LED灯产品分类
  const categories = ref<Category[]>([
    { id: 5, name: 'LUMISTRIP', description: '高显指LED灯带系列' }
  ])

  // LED灯系列
  const seriesList = ref<Series[]>([
    { id: 9, categoryId: 5, name: '2835', description: '2835 SMD 高显指灯带', keywords: ['2835', '高显指', 'Ra98', '灯带'] }
  ])

  // LED灯产品示例数据
  const products = ref<Product[]>([
    // LUMISTRIP 2835系列
    { id: 1, seriesId: 9, categoryId: 5, name: 'White 14.4W 2835 120LED 10MM', specs: { 
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
    }}
  ])

  const specTemplates = ref<SpecTemplate[]>([
    { id: 1, categoryId: 1, specNames: ['阻值', '精度', '功率', '封装'] },
    { id: 2, categoryId: 2, specNames: ['类型', '范围', '精度', '接口'] },
    { id: 3, categoryId: 3, specNames: ['输入', '输出', '效率', '保护'] }
  ])

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
    const index = categories.value.findIndex(c => c.id === id)
    if (index > -1) {
      categories.value.splice(index, 1)
      // 同时删除该分类下的系列和产品
      seriesList.value = seriesList.value.filter(s => s.categoryId !== id)
      products.value = products.value.filter(p => p.categoryId !== id)
    }
  }

  // 删除系列
  function deleteSeries(id: number) {
    const index = seriesList.value.findIndex(s => s.id === id)
    if (index > -1) {
      seriesList.value.splice(index, 1)
      products.value = products.value.filter(p => p.seriesId !== id)
    }
  }

  // 删除产品
  function deleteProduct(id: number) {
    const index = products.value.findIndex(p => p.id === id)
    if (index > -1) {
      products.value.splice(index, 1)
    }
  }

  // 更新产品
  function updateProduct(id: number, name: string, specs: Record<string, string>) {
    const product = products.value.find(p => p.id === id)
    if (product) {
      product.name = name
      product.specs = specs
    }
  }

  return {
    categories,
    seriesList,
    products,
    specTemplates,
    getProductCountByCategory,
    getProductCountBySeries,
    chartData,
    addCategory,
    addSeries,
    addProduct,
    deleteCategory,
    deleteSeries,
    deleteProduct,
    updateProduct
  }
})
