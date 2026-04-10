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
