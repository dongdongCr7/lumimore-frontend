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
  const categories = ref<Category[]>([
    { id: 1, name: '电子元器件', description: '各类电子元器件产品' },
    { id: 2, name: '传感器', description: '工业级传感器' },
    { id: 3, name: '电源模块', description: '电源转换与管理模块' }
  ])

  const seriesList = ref<Series[]>([
    { id: 1, categoryId: 1, name: '电阻系列', description: '高精度电阻', keywords: ['电阻', '精密', '贴片'] },
    { id: 2, categoryId: 1, name: '电容系列', description: '陶瓷电容、电解电容', keywords: ['电容', '储能', '滤波'] },
    { id: 3, categoryId: 2, name: '温度传感器', description: '工业温度检测', keywords: ['温度', '传感', '工业'] },
    { id: 4, categoryId: 3, name: 'DC-DC模块', description: '直流转换模块', keywords: ['DC-DC', '转换', '降压'] }
  ])

  const products = ref<Product[]>([
    { id: 1, seriesId: 1, categoryId: 1, name: '精密贴片电阻 10K', specs: { '阻值': '10KΩ', '精度': '±1%', '功率': '1/4W', '封装': '0805' } },
    { id: 2, seriesId: 1, categoryId: 1, name: '精密贴片电阻 100K', specs: { '阻值': '100KΩ', '精度': '±0.5%', '功率': '1/8W', '封装': '0603' } },
    { id: 3, seriesId: 2, categoryId: 1, name: 'MLCC电容 100nF', specs: { '容值': '100nF', '耐压': '50V', '封装': '0805', '类型': '陶瓷' } },
    { id: 4, seriesId: 3, categoryId: 2, name: 'PT100温度传感器', specs: { '类型': 'PT100', '范围': '-50~200℃', '精度': '±0.3℃', '接口': 'PT1000' } },
    { id: 5, seriesId: 4, categoryId: 3, name: '降压模块 5V3A', specs: { '输入': '12-24V', '输出': '5V/3A', '效率': '≥92%', '保护': '过压/过流' } }
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
