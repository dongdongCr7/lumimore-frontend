/**
 * 数据库 API 层 - 使用 Supabase SDK
 */
import { getSupabaseClient } from './supabase-client'

const client = getSupabaseClient()

// ============ 数据库模型 (snake_case) ============
interface DbCategory {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string | null
}

interface DbSeries {
  id: number
  category_id: number
  name: string
  description: string | null
  keywords: string[] | null
  created_at: string
  updated_at: string | null
}

interface DbProduct {
  id: number
  series_id: number
  category_id: number
  name: string
  specs: Record<string, string> | null
  image: string | null
  created_at: string
  updated_at: string | null
}

interface DbSpecSettings {
  id: number
  product_id: number
  logo_url: string | null
  product_image: string | null
  dimension_image: string | null
  certifications: Array<{ name: string; image?: string }> | null
  footer: string | null
  editable_specs: Record<string, string> | null
  photometric_groups: Array<{
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
  }> | null
  created_at: string
  updated_at: string | null
}

interface DbCertification {
  id: number
  product_id: number
  name: string
  image: string | null
  created_at: string
}

// ============ 前端模型 (camelCase) ============
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

export interface Certification {
  id: number
  productId: number
  name: string
  image?: string
}

// ============ 转换函数 ============
function toCategory(db: DbCategory): Category {
  return {
    id: db.id,
    name: db.name,
    description: db.description || ''
  }
}

function toSeries(db: DbSeries): Series {
  return {
    id: db.id,
    categoryId: db.category_id,
    name: db.name,
    description: db.description || '',
    keywords: db.keywords || []
  }
}

function toProduct(db: DbProduct): Product {
  return {
    id: db.id,
    seriesId: db.series_id,
    categoryId: db.category_id,
    name: db.name,
    specs: db.specs || {},
    image: db.image || undefined
  }
}

function toSpecSettings(db: DbSpecSettings): SpecSettings {
  return {
    id: db.id,
    productId: db.product_id,
    logoUrl: db.logo_url || undefined,
    productImage: db.product_image || undefined,
    dimensionImage: db.dimension_image || undefined,
    certifications: db.certifications || undefined,
    footer: db.footer || undefined,
    editableSpecs: db.editable_specs || undefined,
    photometricGroups: db.photometric_groups || undefined
  }
}

function toCertification(db: DbCertification): Certification {
  return {
    id: db.id,
    productId: db.product_id,
    name: db.name,
    image: db.image || undefined
  }
}

// ============ Categories API ============
export const categoryApi = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await client
      .from('categories')
      .select('*')
      .order('id')
    if (error) throw new Error(`查询分类失败: ${error.message}`)
    return (data as DbCategory[]).map(toCategory)
  },

  async create(name: string, description?: string): Promise<Category> {
    const { data, error } = await client
      .from('categories')
      .insert({ name, description: description || null })
      .select()
      .single()
    if (error) throw new Error(`创建分类失败: ${error.message}`)
    return toCategory(data as DbCategory)
  },

  async update(id: number, name: string, description?: string): Promise<Category> {
    const { data, error } = await client
      .from('categories')
      .update({ name, description: description || null, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(`更新分类失败: ${error.message}`)
    return toCategory(data as DbCategory)
  },

  async delete(id: number): Promise<void> {
    const { error } = await client
      .from('categories')
      .delete()
      .eq('id', id)
    if (error) throw new Error(`删除分类失败: ${error.message}`)
  }
}

// ============ Series API ============
export const seriesApi = {
  async getAll(): Promise<Series[]> {
    const { data, error } = await client
      .from('series')
      .select('*')
      .order('id')
    if (error) throw new Error(`查询系列失败: ${error.message}`)
    return (data as DbSeries[]).map(toSeries)
  },

  async getByCategory(categoryId: number): Promise<Series[]> {
    const { data, error } = await client
      .from('series')
      .select('*')
      .eq('category_id', categoryId)
      .order('id')
    if (error) throw new Error(`查询系列失败: ${error.message}`)
    return (data as DbSeries[]).map(toSeries)
  },

  async create(categoryId: number, name: string, description?: string, keywords?: string[]): Promise<Series> {
    const { data, error } = await client
      .from('series')
      .insert({ 
        category_id: categoryId, 
        name, 
        description: description || null,
        keywords: keywords || null
      })
      .select()
      .single()
    if (error) throw new Error(`创建系列失败: ${error.message}`)
    return toSeries(data as DbSeries)
  },

  async update(id: number, name: string, description?: string, keywords?: string[]): Promise<Series> {
    const { data, error } = await client
      .from('series')
      .update({ 
        name, 
        description: description || null,
        keywords: keywords || null,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(`更新系列失败: ${error.message}`)
    return toSeries(data as DbSeries)
  },

  async delete(id: number): Promise<void> {
    const { error } = await client
      .from('series')
      .delete()
      .eq('id', id)
    if (error) throw new Error(`删除系列失败: ${error.message}`)
  }
}

// ============ Products API ============
export const productApi = {
  async getAll(): Promise<Product[]> {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('id')
    if (error) throw new Error(`查询产品失败: ${error.message}`)
    return (data as DbProduct[]).map(toProduct)
  },

  async getBySeries(seriesId: number): Promise<Product[]> {
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('series_id', seriesId)
      .order('id')
    if (error) throw new Error(`查询产品失败: ${error.message}`)
    return (data as DbProduct[]).map(toProduct)
  },

  async getByCategory(categoryId: number): Promise<Product[]> {
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .order('id')
    if (error) throw new Error(`查询产品失败: ${error.message}`)
    return (data as DbProduct[]).map(toProduct)
  },

  async getById(id: number): Promise<Product | null> {
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`查询产品失败: ${error.message}`)
    return data ? toProduct(data as DbProduct) : null
  },

  async create(
    seriesId: number, 
    categoryId: number, 
    name: string, 
    specs?: Record<string, string>,
    image?: string
  ): Promise<Product> {
    const { data, error } = await client
      .from('products')
      .insert({ 
        series_id: seriesId, 
        category_id: categoryId, 
        name, 
        specs: specs || null,
        image: image || null
      })
      .select()
      .single()
    if (error) throw new Error(`创建产品失败: ${error.message}`)
    return toProduct(data as DbProduct)
  },

  async update(
    id: number, 
    name: string, 
    specs?: Record<string, string>,
    image?: string
  ): Promise<Product> {
    const { data, error } = await client
      .from('products')
      .update({ 
        name, 
        specs: specs || null,
        image: image || null,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(`更新产品失败: ${error.message}`)
    return toProduct(data as DbProduct)
  },

  async delete(id: number): Promise<void> {
    const { error } = await client
      .from('products')
      .delete()
      .eq('id', id)
    if (error) throw new Error(`删除产品失败: ${error.message}`)
  }
}

// ============ SpecSettings API ============
export const specSettingsApi = {
  async getByProduct(productId: number): Promise<SpecSettings | null> {
    const { data, error } = await client
      .from('spec_settings')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle()
    if (error) throw new Error(`查询规格书设置失败: ${error.message}`)
    return data ? toSpecSettings(data as DbSpecSettings) : null
  },

  async upsert(settings: {
    product_id: number
    logo_url?: string
    product_image?: string
    dimension_image?: string
    certifications?: Array<{ name: string; image?: string }>
    footer?: string
    editable_specs?: Record<string, string>
    photometric_groups?: Array<{
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
    }>
  }): Promise<SpecSettings> {
    // 先查询是否存在
    const existing = await this.getByProduct(settings.product_id)
    
    if (existing) {
      // 更新
      const { data, error } = await client
        .from('spec_settings')
        .update({
          logo_url: settings.logo_url || null,
          product_image: settings.product_image || null,
          dimension_image: settings.dimension_image || null,
          certifications: settings.certifications || null,
          footer: settings.footer || null,
          editable_specs: settings.editable_specs || null,
          photometric_groups: settings.photometric_groups || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw new Error(`更新规格书设置失败: ${error.message}`)
      return toSpecSettings(data as DbSpecSettings)
    } else {
      // 插入
      const { data, error } = await client
        .from('spec_settings')
        .insert({
          product_id: settings.product_id,
          logo_url: settings.logo_url || null,
          product_image: settings.product_image || null,
          dimension_image: settings.dimension_image || null,
          certifications: settings.certifications || null,
          footer: settings.footer || null,
          editable_specs: settings.editable_specs || null,
          photometric_groups: settings.photometric_groups || null
        })
        .select()
        .single()
      if (error) throw new Error(`创建规格书设置失败: ${error.message}`)
      return toSpecSettings(data as DbSpecSettings)
    }
  }
}

// ============ Certifications API ============
export const certificationApi = {
  async getByProduct(productId: number): Promise<Certification[]> {
    const { data, error } = await client
      .from('certifications')
      .select('*')
      .eq('product_id', productId)
      .order('id')
    if (error) throw new Error(`查询证书失败: ${error.message}`)
    return (data as DbCertification[]).map(toCertification)
  },

  async create(productId: number, name: string, image?: string): Promise<Certification> {
    const { data, error } = await client
      .from('certifications')
      .insert({ 
        product_id: productId, 
        name, 
        image: image || null
      })
      .select()
      .single()
    if (error) throw new Error(`创建证书失败: ${error.message}`)
    return toCertification(data as DbCertification)
  },

  async update(id: number, name: string, image?: string): Promise<Certification> {
    const { data, error } = await client
      .from('certifications')
      .update({ 
        name, 
        image: image || null
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(`更新证书失败: ${error.message}`)
    return toCertification(data as DbCertification)
  },

  async delete(id: number): Promise<void> {
    const { error } = await client
      .from('certifications')
      .delete()
      .eq('id', id)
    if (error) throw new Error(`删除证书失败: ${error.message}`)
  }
}
