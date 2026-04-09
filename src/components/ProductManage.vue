<template>
  <div class="product-manage">
    <!-- 分类管理 -->
    <el-card class="section-card" v-if="userStore.canManageProducts()">
      <template #header>
        <div class="section-header">
          <span>分类管理</span>
          <el-button type="primary" size="small" @click="showAddCategoryDialog">
            <el-icon><Plus /></el-icon> 添加分类
          </el-button>
        </div>
      </template>
      <el-table :data="productStore.categories" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="分类名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="productCount" label="产品数" width="100">
          <template #default="{ row }">
            {{ productStore.getProductCountByCategory(row.id) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" v-if="userStore.canManageProducts()">
          <template #default="{ row }">
            <el-button type="danger" size="small" text @click="deleteCategory(row.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 系列管理 -->
    <el-card class="section-card" v-if="userStore.canManageProducts()">
      <template #header>
        <div class="section-header">
          <span>系列管理</span>
          <el-button type="primary" size="small" @click="showAddSeriesDialog">
            <el-icon><Plus /></el-icon> 添加系列
          </el-button>
        </div>
      </template>
      
      <!-- 筛选 -->
      <div class="filter-row">
        <el-select v-model="filterCategoryId" placeholder="选择分类筛选" clearable size="default">
          <el-option v-for="cat in productStore.categories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>
      </div>
      
      <el-table :data="filteredSeries" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="系列名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="所属分类" width="150">
          <template #default="{ row }">
            {{ getCategoryName(row.categoryId) }}
          </template>
        </el-table-column>
        <el-table-column prop="keywords" label="关键词">
          <template #default="{ row }">
            <el-tag v-for="kw in row.keywords" :key="kw" size="small" style="margin-right: 4px">
              {{ kw }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="productCount" label="产品数" width="100">
          <template #default="{ row }">
            {{ productStore.getProductCountBySeries(row.id) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" v-if="userStore.canManageProducts()">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="showAddProductDialog(row)">
              <el-icon><Plus /></el-icon> 添加产品
            </el-button>
            <el-button type="danger" size="small" text @click="deleteSeries(row.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 产品列表 -->
    <el-card class="section-card">
      <template #header>
        <div class="section-header">
          <span>产品列表</span>
          <div class="header-actions">
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索产品名称..." 
              clearable 
              style="width: 200px; margin-right: 10px"
              size="default"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>
        </div>
      </template>
      
      <!-- 筛选 -->
      <div class="filter-row">
        <el-select v-model="filterProductCategoryId" placeholder="选择分类" clearable size="default" @change="handleCategoryFilterChange">
          <el-option v-for="cat in productStore.categories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>
        <el-select v-model="filterProductSeriesId" placeholder="选择系列" clearable size="default" :disabled="!filterProductCategoryId">
          <el-option v-for="s in categorySeries" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </div>
      
      <el-table :data="filteredProducts" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="产品名称" />
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            {{ getCategoryName(row.categoryId) }}
          </template>
        </el-table-column>
        <el-table-column label="系列" width="120">
          <template #default="{ row }">
            {{ getSeriesName(row.seriesId) }}
          </template>
        </el-table-column>
        <el-table-column label="规格参数">
          <template #default="{ row }">
            <el-tag v-for="(value, key) in row.specs" :key="key" size="small" style="margin: 2px">
              {{ key }}: {{ value }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="showSpecDialog(row)">
              <el-icon><Document /></el-icon> 规格书
            </el-button>
            <el-button 
              type="warning" 
              size="small" 
              text 
              @click="showEditProductDialog(row)"
              v-if="userStore.canManageProducts()"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              text 
              @click="deleteProduct(row.id)"
              v-if="userStore.canManageProducts()"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加分类对话框 -->
    <el-dialog v-model="categoryDialogVisible" title="添加分类" width="500px">
      <el-form :model="categoryForm" label-width="100px">
        <el-form-item label="分类名称" required>
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="categoryForm.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addCategory">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加系列对话框 -->
    <el-dialog v-model="seriesDialogVisible" title="添加系列" width="500px">
      <el-form :model="seriesForm" label-width="100px">
        <el-form-item label="所属分类" required>
          <el-select v-model="seriesForm.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="cat in productStore.categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="系列名称" required>
          <el-input v-model="seriesForm.name" placeholder="请输入系列名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="seriesForm.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-select 
            v-model="seriesForm.keywords" 
            multiple 
            filterable 
            allow-create 
            default-first-option 
            placeholder="输入关键词后回车添加"
            style="width: 100%"
          >
            <el-option v-for="kw in suggestedKeywords" :key="kw" :label="kw" :value="kw" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="seriesDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addSeries">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑产品对话框 -->
    <el-dialog v-model="productDialogVisible" :title="editProduct ? '编辑产品' : '添加产品'" width="600px">
      <el-form :model="productForm" label-width="100px">
        <el-form-item label="所属分类" required v-if="!editProduct">
          <el-select v-model="productForm.categoryId" placeholder="请选择分类" style="width: 100%" @change="handleProductCategoryChange">
            <el-option v-for="cat in productStore.categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属系列" required v-if="!editProduct">
          <el-select v-model="productForm.seriesId" placeholder="请先选择分类" style="width: 100%" :disabled="!productForm.categoryId">
            <el-option v-for="s in availableSeries" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品名称" required>
          <el-input v-model="productForm.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="规格参数">
          <div class="spec-inputs">
            <div v-for="(spec, index) in specInputs" :key="index" class="spec-row">
              <el-input v-model="spec.name" placeholder="规格名" style="width: 150px" />
              <el-input v-model="spec.value" placeholder="规格值" style="width: 200px" />
              <el-button type="danger" text @click="removeSpec(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" text @click="addSpec">
              <el-icon><Plus /></el-icon> 添加规格
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">{{ editProduct ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <!-- 规格书对话框 -->
    <el-dialog v-model="specDialogVisible" title="产品规格书" width="700px">
      <div class="spec-document" ref="specDocumentRef">
        <!-- 默认显示公司Logo -->
        <div class="spec-header-custom">
          <div class="logo-area">
            <img :src="customSettings?.logoUrl || '/logo.jpg'" alt="LUMIMORE" class="custom-logo" />
          </div>
          <div class="custom-title">
            <h2>{{ customSettings?.title || '产品规格书' }}</h2>
            <p class="custom-subtitle">{{ customSettings?.subtitle || 'LUMIMORE LED LIGHTING' }}</p>
          </div>
        </div>
        
        <div class="spec-info">
          <p><strong>产品名称：</strong>{{ currentProduct?.name }}</p>
          <p><strong>所属分类：</strong>{{ getCategoryName(currentProduct?.categoryId || 0) }}</p>
          <p><strong>所属系列：</strong>{{ getSeriesName(currentProduct?.seriesId || 0) }}</p>
        </div>
        
        <h3>规格参数</h3>
        <table class="spec-table">
          <thead>
            <tr>
              <th>规格名称</th>
              <th>规格值</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(value, key) in currentProduct?.specs" :key="key">
              <td>{{ key }}</td>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </table>
        
        <p class="spec-footer" v-if="customSettings?.footer || true">
          {{ customSettings?.footer || 'LUMIMORE Lighting Technology Co., Ltd.' }}
        </p>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCustomDialog" v-if="userStore.canCustomizeSpec()">
            <el-icon><Setting /></el-icon> 自定义设置
          </el-button>
          <el-button type="primary" @click="downloadSpec">
            <el-icon><Download /></el-icon> 下载规格书
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 自定义规格书设置对话框 -->
    <el-dialog v-model="customDialogVisible" title="自定义规格书" width="500px">
      <el-form :model="customSettingsForm" label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="customSettingsForm.title" placeholder="规格书标题" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="customSettingsForm.subtitle" placeholder="副标题" />
        </el-form-item>
        <el-form-item label="Logo URL">
          <el-input v-model="customSettingsForm.logoUrl" placeholder="输入Logo图片URL" />
        </el-form-item>
        <el-form-item label="页脚">
          <el-input v-model="customSettingsForm.footer" type="textarea" placeholder="页脚内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="customDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="applyCustomSettings">应用设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProductStore, type Product } from '../stores/product'
import { useUserStore } from '../stores/user'

const productStore = useProductStore()
const userStore = useUserStore()

// 分类筛选
const filterCategoryId = ref<number | null>(null)
const filterProductCategoryId = ref<number | null>(null)
const filterProductSeriesId = ref<number | null>(null)
const searchKeyword = ref('')

// 分类对话框
const categoryDialogVisible = ref(false)
const categoryForm = reactive({
  name: '',
  description: ''
})

// 系列对话框
const seriesDialogVisible = ref(false)
const seriesForm = reactive({
  categoryId: null as number | null,
  name: '',
  description: '',
  keywords: [] as string[]
})

const suggestedKeywords = ['电阻', '电容', '精密', '贴片', '陶瓷', '温度', '传感', '工业', 'DC-DC', '转换']

// 产品对话框
const productDialogVisible = ref(false)
const editProduct = ref<Product | null>(null)
const productForm = reactive({
  categoryId: null as number | null,
  seriesId: null as number | null,
  name: ''
})

interface SpecInput {
  name: string
  value: string
}

const specInputs = ref<SpecInput[]>([
  { name: '', value: '' }
])

// 规格书对话框
const specDialogVisible = ref(false)
const currentProduct = ref<Product | null>(null)
const specDocumentRef = ref<HTMLElement | null>(null)
const customSettings = ref<{
  title?: string
  subtitle?: string
  logoUrl?: string
  footer?: string
} | null>(null)

// 自定义对话框
const customDialogVisible = ref(false)
const customSettingsForm = reactive({
  title: '',
  subtitle: '',
  logoUrl: '',
  footer: ''
})

// 计算属性
const filteredSeries = computed(() => {
  if (!filterCategoryId.value) return productStore.seriesList
  return productStore.seriesList.filter(s => s.categoryId === filterCategoryId.value)
})

const categorySeries = computed(() => {
  if (!filterProductCategoryId.value) return []
  return productStore.seriesList.filter(s => s.categoryId === filterProductCategoryId.value)
})

const availableSeries = computed(() => {
  if (!productForm.categoryId) return []
  return productStore.seriesList.filter(s => s.categoryId === productForm.categoryId)
})

const filteredProducts = computed(() => {
  let products = [...productStore.products]
  
  if (filterProductCategoryId.value) {
    products = products.filter(p => p.categoryId === filterProductCategoryId.value)
  }
  
  if (filterProductSeriesId.value) {
    products = products.filter(p => p.seriesId === filterProductSeriesId.value)
  }
  
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    products = products.filter(p => {
      if (p.name.toLowerCase().includes(kw)) return true
      for (const [key, value] of Object.entries(p.specs)) {
        if (key.toLowerCase().includes(kw) || value.toLowerCase().includes(kw)) return true
      }
      return false
    })
  }
  
  return products
})

// 方法
const getCategoryName = (id: number) => {
  return productStore.categories.find(c => c.id === id)?.name || '-'
}

const getSeriesName = (id: number) => {
  return productStore.seriesList.find(s => s.id === id)?.name || '-'
}

const showAddCategoryDialog = () => {
  categoryForm.name = ''
  categoryForm.description = ''
  categoryDialogVisible.value = true
}

const addCategory = () => {
  if (!categoryForm.name) {
    ElMessage.warning('请输入分类名称')
    return
  }
  productStore.addCategory(categoryForm.name, categoryForm.description)
  ElMessage.success('添加成功')
  categoryDialogVisible.value = false
}

const deleteCategory = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定删除该分类吗？将同时删除该分类下的所有系列和产品', '提示', {
      type: 'warning'
    })
    productStore.deleteCategory(id)
    ElMessage.success('删除成功')
  } catch {
    // 取消
  }
}

const showAddSeriesDialog = () => {
  seriesForm.categoryId = null
  seriesForm.name = ''
  seriesForm.description = ''
  seriesForm.keywords = []
  seriesDialogVisible.value = true
}

const addSeries = () => {
  if (!seriesForm.categoryId || !seriesForm.name) {
    ElMessage.warning('请填写完整信息')
    return
  }
  productStore.addSeries(
    seriesForm.categoryId,
    seriesForm.name,
    seriesForm.description,
    seriesForm.keywords
  )
  ElMessage.success('添加成功')
  seriesDialogVisible.value = false
}

const deleteSeries = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定删除该系列吗？将同时删除该系列下的所有产品', '提示', {
      type: 'warning'
    })
    productStore.deleteSeries(id)
    ElMessage.success('删除成功')
  } catch {
    // 取消
  }
}

const showAddProductDialog = (series: any) => {
  editProduct.value = null
  productForm.categoryId = series.categoryId
  productForm.seriesId = series.id
  productForm.name = ''
  specInputs.value = [{ name: '', value: '' }]
  productDialogVisible.value = true
}

const showEditProductDialog = (product: Product) => {
  editProduct.value = product
  productForm.categoryId = product.categoryId
  productForm.seriesId = product.seriesId
  productForm.name = product.name
  specInputs.value = Object.entries(product.specs).map(([name, value]) => ({ name, value }))
  productDialogVisible.value = true
}

const handleProductCategoryChange = () => {
  productForm.seriesId = null
}

const handleCategoryFilterChange = () => {
  filterProductSeriesId.value = null
}

const addSpec = () => {
  specInputs.value.push({ name: '', value: '' })
}

const removeSpec = (index: number) => {
  specInputs.value.splice(index, 1)
}

const saveProduct = () => {
  if (!productForm.name) {
    ElMessage.warning('请输入产品名称')
    return
  }
  
  const specs: Record<string, string> = {}
  for (const spec of specInputs.value) {
    if (spec.name && spec.value) {
      specs[spec.name] = spec.value
    }
  }
  
  if (Object.keys(specs).length === 0) {
    ElMessage.warning('请至少添加一个规格参数')
    return
  }
  
  if (editProduct.value) {
    productStore.updateProduct(editProduct.value.id, productForm.name, specs)
    ElMessage.success('修改成功')
  } else {
    if (!productForm.categoryId || !productForm.seriesId) {
      ElMessage.warning('请选择分类和系列')
      return
    }
    productStore.addProduct(productForm.seriesId, productForm.categoryId, productForm.name, specs)
    ElMessage.success('添加成功')
  }
  
  productDialogVisible.value = false
}

const deleteProduct = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定删除该产品吗？', '提示', {
      type: 'warning'
    })
    productStore.deleteProduct(id)
    ElMessage.success('删除成功')
  } catch {
    // 取消
  }
}

const showSpecDialog = (product: Product) => {
  currentProduct.value = product
  customSettings.value = null
  customSettingsForm.title = ''
  customSettingsForm.subtitle = ''
  customSettingsForm.logoUrl = ''
  customSettingsForm.footer = ''
  specDialogVisible.value = true
}

const showCustomDialog = () => {
  customDialogVisible.value = true
}

const applyCustomSettings = () => {
  customSettings.value = {
    title: customSettingsForm.title,
    subtitle: customSettingsForm.subtitle,
    logoUrl: customSettingsForm.logoUrl,
    footer: customSettingsForm.footer
  }
  customDialogVisible.value = false
  ElMessage.success('自定义设置已应用')
}

const downloadSpec = async () => {
  if (!specDocumentRef.value) return
  
  // 创建临时 canvas 用于导出
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 设置画布大小
  canvas.width = 800
  canvas.height = 1000
  
  // 绘制背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 绘制Logo
  const logoUrl = customSettings.value?.logoUrl || '/logo.jpg'
  try {
    const logoImg = new Image()
    logoImg.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve()
      logoImg.onerror = () => reject()
      logoImg.src = logoUrl
    })
    ctx.drawImage(logoImg, 50, 20, 150, 50)
  } catch (e) {
    // Logo加载失败，继续绘制
  }
  
  // 绘制标题
  ctx.fillStyle = '#333333'
  ctx.font = 'bold 24px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(customSettings.value?.title || '产品规格书', 400, 50)
  
  // 绘制副标题
  ctx.font = '14px Arial'
  ctx.fillStyle = '#666666'
  ctx.fillText(customSettings.value?.subtitle || 'LUMIMORE LED LIGHTING', 400, 70)
  
  // 绘制产品信息
  ctx.font = '16px Arial'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#333333'
  let y = 120
  ctx.fillText(`产品名称：${currentProduct.value?.name || ''}`, 50, y)
  y += 30
  ctx.fillText(`所属分类：${getCategoryName(currentProduct.value?.categoryId || 0)}`, 50, y)
  y += 30
  ctx.fillText(`所属系列：${getSeriesName(currentProduct.value?.seriesId || 0)}`, 50, y)
  y += 30
  ctx.fillText(`所属分类：${getCategoryName(currentProduct.value?.categoryId || 0)}`, 50, y)
  y += 30
  ctx.fillText(`所属系列：${getSeriesName(currentProduct.value?.seriesId || 0)}`, 50, y)
  
  // 绘制规格参数表头
  y += 50
  ctx.fillStyle = '#409eff'
  ctx.fillRect(50, y, 700, 35)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 14px Arial'
  ctx.fillText('规格名称', 80, y + 23)
  ctx.fillText('规格值', 400, y + 23)
  
  // 绘制规格参数
  ctx.fillStyle = '#333333'
  ctx.font = '14px Arial'
  y += 35
  
  const specs = currentProduct.value?.specs || {}
  Object.entries(specs).forEach(([key, value], index) => {
    if (index % 2 === 0) {
      ctx.fillStyle = '#f5f7fa'
      ctx.fillRect(50, y, 700, 30)
    }
    ctx.fillStyle = '#333333'
    ctx.fillText(key, 80, y + 20)
    ctx.fillText(value, 400, y + 20)
    y += 30
  })
  
  // 绘制页脚
  if (customSettings.value?.footer) {
    ctx.fillStyle = '#999999'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(customSettings.value.footer, 400, 950)
  }
  
  // 下载图片
  const link = document.createElement('a')
  link.download = `${currentProduct.value?.name || 'spec'}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
  
  ElMessage.success('规格书已下载')
}
</script>

<style scoped>
.product-manage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card :deep(.el-card__header) {
  padding: 12px 20px;
  background: #fafafa;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-row {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.spec-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spec-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.spec-document {
  background: white;
  padding: 30px;
  font-family: Arial, sans-serif;
}

.spec-header-custom {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #409eff;
}

.logo-area {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-logo {
  max-width: 100%;
  max-height: 100%;
}

.logo-placeholder {
  width: 80px;
  height: 80px;
  border: 2px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
}

.custom-title {
  flex: 1;
}

.custom-title h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #333;
}

.custom-subtitle {
  margin: 0;
  color: #666;
}

.spec-header-default h2 {
  text-align: center;
  margin: 0 0 30px 0;
  font-size: 24px;
  color: #333;
}

.spec-info {
  margin-bottom: 20px;
}

.spec-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}

.spec-info strong {
  color: #333;
}

.spec-document h3 {
  margin: 20px 0;
  font-size: 16px;
  color: #333;
  border-left: 3px solid #409eff;
  padding-left: 10px;
}

.spec-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.spec-table th,
.spec-table td {
  border: 1px solid #e4e7ed;
  padding: 12px;
  text-align: left;
}

.spec-table th {
  background: #409eff;
  color: white;
}

.spec-table tbody tr:nth-child(even) {
  background: #fafafa;
}

.spec-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  text-align: center;
  color: #999;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
