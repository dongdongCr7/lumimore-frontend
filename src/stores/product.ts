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
    { id: 1, name: '筒灯', description: '嵌入式筒灯系列产品' },
    { id: 2, name: '射灯', description: '轨道射灯/嵌入式射灯' },
    { id: 3, name: '灯带', description: '柔性灯带/硬灯条' },
    { id: 4, name: '面板灯', description: '办公照明面板灯' },
    { id: 5, name: 'LUMISTRIP', description: '高显指LED灯带系列' }
  ])

  // LED灯系列
  const seriesList = ref<Series[]>([
    { id: 1, categoryId: 1, name: '标准筒灯', description: '常规功率筒灯', keywords: ['筒灯', '嵌入式', '商业照明'] },
    { id: 2, categoryId: 1, name: '智能筒灯', description: '可调光/智能控制筒灯', keywords: ['调光', '智能', 'RGB'] },
    { id: 3, categoryId: 2, name: 'COB射灯', description: 'COB光源射灯', keywords: ['COB', '高显指', '精准配光'] },
    { id: 4, categoryId: 2, name: '磁吸射灯', description: '磁吸轨道系统射灯', keywords: ['磁吸', '轨道', '灵活'] },
    { id: 5, categoryId: 3, name: 'RGB灯带', description: 'RGB全彩灯带', keywords: ['RGB', '全彩', '变化'] },
    { id: 6, categoryId: 3, name: 'COB灯带', description: 'COB无光斑灯带', keywords: ['COB', '均匀', '无光斑'] },
    { id: 7, categoryId: 4, name: '常规面板灯', description: '标准办公室面板灯', keywords: ['面板', '办公', '节能'] },
    { id: 8, categoryId: 4, name: '智能面板灯', description: '可调色温面板灯', keywords: ['调色温', '智能', '健康'] },
    { id: 9, categoryId: 5, name: '2835', description: '2835 SMD 高显指灯带', keywords: ['2835', '高显指', 'Ra98', '灯带'] }
  ])

  // LED灯产品示例数据
  const products = ref<Product[]>([
    // 筒灯系列
    { id: 1, seriesId: 1, categoryId: 1, name: '3W 嵌入式筒灯', specs: { '功率': '3W', '色温': '3000K/4000K/6500K', '光通量': '240lm', '发光角度': '120°', '显色指数': 'Ra≥80', '使用寿命': '30000H' } },
    { id: 2, seriesId: 1, categoryId: 1, name: '5W 嵌入式筒灯', specs: { '功率': '5W', '色温': '3000K/4000K/6500K', '光通量': '400lm', '发光角度': '120°', '显色指数': 'Ra≥80', '使用寿命': '30000H' } },
    { id: 3, seriesId: 1, categoryId: 1, name: '7W 嵌入式筒灯', specs: { '功率': '7W', '色温': '3000K/4000K/6500K', '光通量': '560lm', '发光角度': '120°', '显色指数': 'Ra≥80', '使用寿命': '30000H' } },
    { id: 4, seriesId: 2, categoryId: 1, name: '9W 智能调光筒灯', specs: { '功率': '9W', '色温': '2700K-6500K', '光通量': '720lm', '控制方式': 'APP/遥控', '显色指数': 'Ra≥90', '使用寿命': '40000H' } },
    // 射灯系列
    { id: 5, seriesId: 3, categoryId: 2, name: '7W COB 射灯', specs: { '功率': '7W', '色温': '3000K/4000K', '光通量': '560lm', '发光角度': '24°/36°', '显色指数': 'Ra≥95', '防护等级': 'IP44' } },
    { id: 6, seriesId: 3, categoryId: 2, name: '12W COB 射灯', specs: { '功率': '12W', '色温': '3000K/4000K', '光通量': '960lm', '发光角度': '15°/24°/36°', '显色指数': 'Ra≥95', '防护等级': 'IP44' } },
    { id: 7, seriesId: 4, categoryId: 2, name: '15W 磁吸射灯', specs: { '功率': '15W', '色温': '3000K/4000K', '光通量': '1200lm', '发光角度': '15°/24°', '显色指数': 'Ra≥90', '轨道类型': '磁吸轨道' } },
    // 灯带系列
    { id: 8, seriesId: 5, categoryId: 3, name: 'RGB 5050 灯带(5m)', specs: { '电压': 'DC12V/24V', '灯珠型号': '5050 RGB', '灯珠数量': '60灯/m', '功率': '14.4W/m', '防水等级': 'IP20/IP65', '长度': '5m/卷' } },
    { id: 9, seriesId: 6, categoryId: 3, name: 'COB 320灯/m 灯带(5m)', specs: { '电压': 'DC24V', '灯珠型号': 'COB 320灯', '灯珠数量': '320灯/m', '功率': '10W/m', '发光角度': '180°', '显色指数': 'Ra≥90' } },
    // 面板灯系列
    { id: 10, seriesId: 7, categoryId: 4, name: '40W 600x600 面板灯', specs: { '功率': '40W', '色温': '4000K/6500K', '光通量': '4000lm', '尺寸': '600x600mm', '显色指数': 'Ra≥80', '使用寿命': '50000H' } },
    { id: 11, seriesId: 8, categoryId: 4, name: '50W 智能调色温面板灯', specs: { '功率': '50W', '色温': '2700K-6500K', '光通量': '4500lm', '控制方式': 'APP/墙壁开关', '显色指数': 'Ra≥95', '调光范围': '0-100%' } },
    // LUMISTRIP 2835系列
    { id: 12, seriesId: 9, categoryId: 5, name: 'White 14.4W 2835 120LED 10MM', specs: { 
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
