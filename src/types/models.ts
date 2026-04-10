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

export interface PhotometricGroup {
  model: string
  power: string
  lumen: string
  efficacy: string
  cri2700: string
  cri3000: string
  cri3500: string
  cri4000: string
  cri5000: string
  cri5700: string
}

// 自定义模块项
export interface CustomModuleItem {
  label: string  // 规格名，如 "Voltage", "Power" 等
  value: string  // 规格值
}

// 自定义模块
export interface CustomModule {
  id: number
  name: string  // 模块名，如 "Electrical", "Optical" 等
  items: CustomModuleItem[]  // 模块内的规格项
}
