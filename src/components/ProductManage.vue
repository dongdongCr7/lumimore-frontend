<template>
  <div class="product-manage">
    <!-- 分类Tab选择 -->
    <div class="step-section">
      <div class="section-header">
        <span class="step-title">第一步：选择分类</span>
        <el-button type="primary" size="small" @click="showAddCategoryDialog" v-if="userStore.canManageProducts()">
          <el-icon><Plus /></el-icon> 添加分类
        </el-button>
      </div>
      <div class="category-tabs">
        <div 
          v-for="cat in productStore.categories" 
          :key="cat.id"
          class="category-tab"
          :class="{ active: selectedCategoryId === cat.id }"
          @click="selectCategory(cat.id)"
        >
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-count">{{ productStore.getProductCountByCategory(cat.id) }}个</span>
          <el-button 
            v-if="userStore.canManageProducts()" 
            type="danger" 
            text 
            size="small" 
            class="delete-btn"
            @click.stop="deleteCategory(cat.id)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 系列选择（选中分类后显示） -->
    <div class="step-section" v-if="selectedCategoryId">
      <div class="section-header">
        <span class="step-title">第二步：选择系列 - {{ getCategoryName(selectedCategoryId) }}</span>
        <el-button type="primary" size="small" @click="showAddSeriesDialog" v-if="userStore.canManageProducts()">
          <el-icon><Plus /></el-icon> 添加系列
        </el-button>
      </div>
      <div class="series-list">
        <el-card 
          v-for="series in categorySeries" 
          :key="series.id"
          class="series-card"
          :class="{ active: selectedSeriesId === series.id }"
          shadow="hover"
          @click="selectSeries(series.id)"
        >
          <div class="series-content">
            <div class="series-name">{{ series.name }}</div>
            <div class="series-desc">{{ series.description }}</div>
            <div class="series-meta">
              <el-tag size="small">{{ productStore.getProductCountBySeries(series.id) }} 个产品</el-tag>
            </div>
          </div>
          <el-button 
            v-if="userStore.canManageProducts()" 
            type="danger" 
            text 
            size="small" 
            class="delete-series-btn"
            @click.stop="deleteSeries(series.id)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-card>
      </div>
    </div>

    <!-- 产品列表（选中系列后显示） -->
    <div class="step-section" v-if="selectedSeriesId">
      <div class="section-header">
        <span class="step-title">第三步：产品列表 - {{ getSeriesName(selectedSeriesId) }}</span>
        <div class="header-actions">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索产品名称..." 
            clearable 
            style="width: 200px"
            size="default"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>
      </div>
      
      <el-table :data="filteredProducts" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="产品名称" />
        <el-table-column label="规格参数">
          <template #default="{ row }">
            <el-tag v-for="(value, key) in row.specs" :key="key" size="small" style="margin: 2px">
              {{ key }}: {{ value }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="showSpecDialog(row)">
              <el-icon><Document /></el-icon> 规格书
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
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
        <el-form-item label="所属分类">
          <span>{{ selectedCategoryId ? getCategoryName(selectedCategoryId) : '-' }}</span>
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

    <!-- 规格书对话框 -->
    <el-dialog v-model="specDialogVisible" title="产品规格书" width="850px" class="spec-dialog">
      <div class="spec-dialog-content">
        <div class="spec-document" ref="specDocumentRef">
        
        <!-- Logo单独一行，小尺寸 -->
        <div class="spec-logo-row">
          <div class="logo-upload-area" @click="triggerLogoUpload">
            <img v-if="customSettings?.logoUrl" :src="customSettings.logoUrl" class="spec-logo-img" />
            <div v-else class="logo-upload-placeholder">
              <el-icon><Plus /></el-icon>
              <span>上传Logo</span>
            </div>
          </div>
          <input type="file" ref="logoInputRef" @change="handleLogoFileChange" accept="image/*" style="display:none" />
        </div>
        
        <!-- 认证图标横排 -->
        <div class="spec-cert-row">
          <div v-for="i in 5" :key="i" class="cert-box" @click="triggerCertUpload(i-1)">
            <img v-if="customSettings?.certifications?.[i-1]?.image" :src="customSettings.certifications[i-1].image" />
            <el-icon v-else><Plus /></el-icon>
          </div>
        </div>
        <input type="file" ref="certInputRef" @change="handleCertFileChange" accept="image/*" style="display:none" />
        
        <!-- 产品图片 + 产品信息 -->
        <div class="spec-row1">
          <div class="spec-product-img" @click="triggerProductImageUpload">
            <img v-if="customSettings?.productImage" :src="customSettings.productImage" class="product-img-uploaded" />
            <div v-else class="product-img-placeholder">
              <div class="led-strip-visual"></div>
              <div class="led-badge">{{ editableSpecs.power || '14.4W/m' }}</div>
              <div class="upload-hint">点击上传产品图</div>
            </div>
          </div>
          <input type="file" ref="productImageInputRef" @change="handleProductImageFileChange" accept="image/*" style="display:none" />
          
          <div class="spec-info">
            <input type="text" class="spec-title-input borderless" v-model="editableSpecs.title" placeholder="产品名称" />
            <input type="text" class="spec-model-input borderless" v-model="editableSpecs.model" placeholder="Model: LS-XXXX" />
          </div>
        </div>
        
        <!-- Features + Dimension -->
        <div class="spec-row2">
          <table class="spec-mini-table">
            <tr><th>Features</th></tr>
            <tr><td>
              <input type="text" class="spec-cell-input borderless" v-model="editableSpecs.feature1" placeholder="Super High CRI Ra98" />
              <input type="text" class="spec-cell-input borderless" v-model="editableSpecs.feature2" placeholder="Ra9>98, Rg12>98" />
              <input type="text" class="spec-cell-input borderless" v-model="editableSpecs.feature3" placeholder="120LED/M | 15W/m" />
              <input type="text" class="spec-cell-input borderless" v-model="editableSpecs.feature4" placeholder="2835" />
            </td></tr>
          </table>
          <table class="spec-mini-table">
            <tr><th>Dimension</th></tr>
            <tr><td class="dimension-cell" @click="triggerDimensionUpload">
              <img v-if="customSettings?.dimensionImage" :src="customSettings.dimensionImage" class="dimension-img" />
              <div v-else class="dimension-placeholder">
                <el-icon><Plus /></el-icon>
                <span>上传尺寸图</span>
              </div>
            </td></tr>
          </table>
        </div>
        <input type="file" ref="dimensionInputRef" @change="handleDimensionFileChange" accept="image/*" style="display:none" />
        
        <!-- 第1行：Product Setup + Light Engine -->
        <div class="spec-row-duo">
          <table class="spec-duo-table">
            <tr><th>Product Setup</th></tr>
            <tr><td>
              <div class="hex-cell">
                <span class="hex-label">Category</span>
                <input type="text" class="hex-input borderless" v-model="editableSpecs.category" />
              </div>
              <div class="hex-cell">
                <span class="hex-label">Level</span>
                <input type="text" class="hex-input borderless" v-model="editableSpecs.level" />
              </div>
              <div class="hex-cell">
                <span class="hex-label">Spectrum</span>
                <input type="text" class="hex-input borderless" v-model="editableSpecs.spectrum" />
              </div>
            </td></tr>
          </table>
          
          <table class="spec-duo-table">
            <tr><th>Light Engine</th></tr>
            <tr><td>
              <div class="hex-cell">
                <span class="hex-label">LED Type</span>
                <input type="text" class="hex-input borderless" v-model="editableSpecs.ledType" />
              </div>
              <div class="hex-cell">
                <span class="hex-label">LED Density</span>
                <input type="text" class="hex-input borderless" v-model="editableSpecs.ledDensity" />
              </div>
            </td></tr>
          </table>
        </div>
        
        <!-- 第2行：Electrical + Photometric -->
        <div class="spec-row-duo">
          <table class="spec-duo-table">
            <tr><th>Electrical</th></tr>
            <tr><td>
              <div class="hex-cell">
                <span class="hex-label">Voltage</span>
                <input type="text" class="hex-input borderless" v-model="editableSpecs.voltage" />
              </div>
              <div class="hex-cell">
                <span class="hex-label">Power</span>
                <input type="text" class="hex-input borderless" v-model="editableSpecs.power" />
              </div>
              <div class="hex-cell">
                <span class="hex-label">IP Rating</span>
                <input type="text" class="hex-input borderless" v-model="editableSpecs.ipRating" />
              </div>
              <div class="hex-cell">
                <span class="hex-label">Beam Angle</span>
                <input type="text" class="hex-input borderless" v-model="editableSpecs.beamAngle" />
              </div>
            </td></tr>
          </table>
          
          <table class="spec-duo-table">
            <tr><th>Photometric</th></tr>
            <tr><td>
              <div class="hex-cell">
                <span class="hex-label">CCT</span>
                <input type="text" class="hex-input borderless" v-model="editableSpecs.cct" />
              </div>
              <div class="hex-cell">
                <span class="hex-label">Lumen</span>
                <input type="text" class="hex-input borderless" v-model="editableSpecs.lumen" />
              </div>
              <div class="hex-cell">
                <span class="hex-label">Efficacy</span>
                <input type="text" class="hex-input borderless" v-model="editableSpecs.efficacy" />
              </div>
            </td></tr>
          </table>
        </div>
        
        <!-- 第5行：Photometric大表格 - 按功率分组，可编辑，可添加删除 -->
        <div class="spec-row5">
          <div class="photometric-title-row">
            <div class="photometric-title">Photometric</div>
            <el-button size="small" type="primary" text @click="addPhotometricGroup">
              <el-icon><Plus /></el-icon> 添加功率
            </el-button>
          </div>
          <table class="photometric-big-table">
            <thead>
              <tr>
                <th style="width:35%">Model</th>
                <th style="width:12%">Power</th>
                <th style="width:10%">CCT</th>
                <th style="width:10%">CRI</th>
                <th style="width:15%">Lumen</th>
                <th style="width:18%">Efficacy</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(group, groupIndex) in photometricGroups" :key="groupIndex">
                <!-- 每个功率组的第一行 -->
                <tr class="power-group-start">
                  <td :rowspan="6">
                    <input type="text" class="table-input borderless center" v-model="group.model" />
                    <el-button v-if="photometricGroups.length > 1" size="small" type="danger" text class="remove-group-btn" @click="removePhotometricGroup(groupIndex)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </td>
                  <td :rowspan="6" class="power-cell">
                    <input type="text" class="table-input borderless center" v-model="group.power" />
                  </td>
                  <td>2700K</td>
                  <td><input type="text" class="table-input borderless center small" v-model="group.cri2700" /></td>
                  <td :rowspan="6"><input type="text" class="table-input borderless center" v-model="group.lumen" /></td>
                  <td :rowspan="6"><input type="text" class="table-input borderless center" v-model="group.efficacy" /></td>
                </tr>
                <tr><td>3000K</td><td><input type="text" class="table-input borderless center small" v-model="group.cri3000" /></td></tr>
                <tr><td>3500K</td><td><input type="text" class="table-input borderless center small" v-model="group.cri3500" /></td></tr>
                <tr><td>4000K</td><td><input type="text" class="table-input borderless center small" v-model="group.cri4000" /></td></tr>
                <tr><td>5000K</td><td><input type="text" class="table-input borderless center small" v-model="group.cri5000" /></td></tr>
                <tr><td>5700K</td><td><input type="text" class="table-input borderless center small" v-model="group.cri5700" /></td></tr>
                
                <!-- 分隔线（除了最后一个） -->
                <tr v-if="groupIndex < photometricGroups.length - 1" class="power-separator"><td colspan="6"></td></tr>
              </template>
            </tbody>
          </table>
        </div>
        
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="downloadSpec">
            <el-icon><Download /></el-icon> 下载规格书
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import html2canvas from 'html2canvas'
import { useProductStore, type Product } from '../stores/product'
import { useUserStore } from '../stores/user'

const productStore = useProductStore()
const userStore = useUserStore()

// 选中状态
const selectedCategoryId = ref<number | null>(null)
const selectedSeriesId = ref<number | null>(null)
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
  name: '',
  description: '',
  keywords: [] as string[]
})

const suggestedKeywords = ['LED', '筒灯', '射灯', '灯带', '面板灯', '智能', 'RGB', 'COB']

// 规格书对话框
const specDialogVisible = ref(false)
const currentProduct = ref<Product | null>(null)
const specDocumentRef = ref<HTMLElement | null>(null)
const customSettings = ref<{
  logoUrl?: string
  productImage?: string
  dimensionImage?: string
  certifications?: Array<{ name: string; image?: string }>
  footer?: string
} | null>(null)

// 规格书内联编辑相关
const editableSpecs = ref<Record<string, string>>({})

// 规格书内联上传相关 refs
const logoInputRef = ref<HTMLInputElement | null>(null)
const productImageInputRef = ref<HTMLInputElement | null>(null)
const dimensionInputRef = ref<HTMLInputElement | null>(null)
const certInputRef = ref<HTMLInputElement | null>(null)
const currentCertIndex = ref<number>(0)

// 规格书内联上传相关方法
const triggerLogoUpload = () => {
  logoInputRef.value?.click()
}

const handleLogoFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    try {
      const dataUrl = await compressImage(file)
      if (customSettings.value) {
        customSettings.value.logoUrl = dataUrl
      }
      ElMessage.success('Logo上传成功')
    } catch {
      ElMessage.error('Logo上传失败')
    }
    target.value = ''
  }
}

const triggerProductImageUpload = () => {
  productImageInputRef.value?.click()
}

const handleProductImageFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    try {
      const dataUrl = await compressImage(file)
      if (customSettings.value) {
        customSettings.value.productImage = dataUrl
      }
      ElMessage.success('产品图片上传成功')
    } catch {
      ElMessage.error('产品图片上传失败')
    }
    target.value = ''
  }
}

const triggerCertUpload = (index: number) => {
  currentCertIndex.value = index
  certInputRef.value?.click()
}

const handleCertFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && customSettings.value) {
    try {
      const dataUrl = await compressImage(file)
      if (!customSettings.value.certifications) {
        customSettings.value.certifications = []
      }
      // 确保有足够的认证项
      while (customSettings.value.certifications.length <= currentCertIndex.value) {
        customSettings.value.certifications.push({ name: '', image: '' })
      }
      customSettings.value.certifications[currentCertIndex.value].image = dataUrl
      ElMessage.success('认证图标上传成功')
    } catch {
      ElMessage.error('认证图标上传失败')
    }
    target.value = ''
  }
}

const triggerDimensionUpload = () => {
  dimensionInputRef.value?.click()
}

const handleDimensionFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    try {
      const dataUrl = await compressImage(file)
      if (customSettings.value) {
        customSettings.value.dimensionImage = dataUrl
      }
      ElMessage.success('尺寸图片上传成功')
    } catch {
      ElMessage.error('尺寸图片上传失败')
    }
    target.value = ''
  }
}

// Photometric表格 - 动态功率组
interface PhotometricGroup {
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

const photometricGroups = ref<PhotometricGroup[]>([])

// 添加功率组
const addPhotometricGroup = () => {
  photometricGroups.value.push({
    model: 'LS-SW28N120-2790-2408-100',
    power: '10W/m',
    lumen: '1000lm/m',
    efficacy: '100lm/W',
    cri2700: 'Ra98+',
    cri3000: 'Ra98+',
    cri3500: 'Ra90+',
    cri4000: 'Ra90+',
    cri5000: 'Ra90+',
    cri5700: 'Ra90+'
  })
}

// 删除功率组
const removePhotometricGroup = (index: number) => {
  if (photometricGroups.value.length > 1) {
    photometricGroups.value.splice(index, 1)
  }
}

// 压缩图片到指定大小以内
const compressImage = (file: File, maxSizeMB: number = 2): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        // 初始质量
        let quality = 0.9
        const maxSize = maxSizeMB * 1024 * 1024
        
        // 如果文件已经小于限制，直接返回
        if (file.size <= maxSize) {
          resolve(e.target?.result as string)
          return
        }
        
        // 压缩直到小于限制
        const compress = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          
          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          const size = atob(dataUrl.split(',')[1]).length
          
          if (size <= maxSize || quality <= 0.1) {
            resolve(dataUrl)
          } else {
            quality -= 0.1
            compress()
          }
        }
        
        compress()
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 计算属性
const categorySeries = computed(() => {
  if (!selectedCategoryId.value) return []
  return productStore.seriesList.filter(s => s.categoryId === selectedCategoryId.value)
})

const filteredProducts = computed(() => {
  if (!selectedSeriesId.value) return []
  let products = productStore.products.filter(p => p.seriesId === selectedSeriesId.value)
  
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    products = products.filter(p => p.name.toLowerCase().includes(kw))
  }
  
  return products
})

// 方法
const getCategoryName = (id: number | null) => {
  if (!id) return '-'
  return productStore.categories.find(c => c.id === id)?.name || '-'
}

const getSeriesName = (id: number | null) => {
  if (!id) return '-'
  return productStore.seriesList.find(s => s.id === id)?.name || '-'
}

// 选择分类
const selectCategory = (categoryId: number) => {
  selectedCategoryId.value = categoryId
  selectedSeriesId.value = null
}

// 选择系列
const selectSeries = (seriesId: number) => {
  selectedSeriesId.value = seriesId
}

// 分类操作
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
    if (selectedCategoryId.value === id) {
      selectedCategoryId.value = null
      selectedSeriesId.value = null
    }
    ElMessage.success('删除成功')
  } catch {
    // 取消
  }
}

// 系列操作
const showAddSeriesDialog = () => {
  seriesForm.name = ''
  seriesForm.description = ''
  seriesForm.keywords = []
  seriesDialogVisible.value = true
}

const addSeries = () => {
  if (!seriesForm.name) {
    ElMessage.warning('请输入系列名称')
    return
  }
  productStore.addSeries(
    selectedCategoryId.value!,
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
    if (selectedSeriesId.value === id) {
      selectedSeriesId.value = null
    }
    ElMessage.success('删除成功')
  } catch {
    // 取消
  }
}

// 规格书
const showSpecDialog = (product: Product) => {
  currentProduct.value = product
  
  // 从store加载保存的设置，如果没有则使用默认值
  const savedSettings = productStore.getSpecSettings(product.id)
  if (savedSettings) {
    customSettings.value = {
      logoUrl: savedSettings.logoUrl || '/logo.jpg',
      productImage: savedSettings.productImage || '',
      dimensionImage: savedSettings.dimensionImage || '',
      certifications: savedSettings.certifications || [],
      footer: savedSettings.footer || ''
    }
  } else {
    customSettings.value = {
      logoUrl: '/logo.jpg',
      productImage: '',
      dimensionImage: '',
      certifications: [],
      footer: ''
    }
  }
  
  // 初始化可编辑规格数据 - 优先使用保存的设置，否则从产品规格中提取
  const specs = product.specs
  const savedEditableSpecs = savedSettings?.editableSpecs
  
  // 生成默认型号
  const series = productStore.seriesList.find(s => s.id === product.seriesId)
  const category = productStore.categories.find(c => c.id === product.categoryId)
  const defaultModel = `LS-${series?.name || 'XX'}N${(specs['LED密度'] || '120').replace('LED/M', '')}-${(specs['功率'] || '14.4').replace('W/m', '')}-${(specs['总宽度'] || '10').replace('mm', '')}`
  
  editableSpecs.value = {
    // 基础信息
    title: savedEditableSpecs?.['title'] || product.name,
    model: savedEditableSpecs?.['model'] || defaultModel,
    category: savedEditableSpecs?.['category'] || category?.name || 'LumStrip',
    level: savedEditableSpecs?.['level'] || 'Core',
    spectrum: savedEditableSpecs?.['spectrum'] || 'White',
    
    // Features
    feature1: savedEditableSpecs?.['feature1'] || (specs['显色指数'] ? `Super High CRI ${specs['显色指数']}` : 'Super High CRI Ra98+'),
    feature2: savedEditableSpecs?.['feature2'] || (specs['R9值'] && specs['R12值'] ? `Ra9 ${specs['R9值']}, Rg12 ${specs['R12值']}` : 'Ra9 >98, Rg12 >98'),
    feature3: savedEditableSpecs?.['feature3'] || (specs['LED密度'] || '120LED/M') + ' | ' + (specs['功率'] || '14.4W/m'),
    feature4: savedEditableSpecs?.['feature4'] || specs['LED类型'] || '2835 SMD',
    
    // Light Engine
    ledType: savedEditableSpecs?.['ledType'] || specs['LED类型'] || '2835 SMD',
    ledDensity: savedEditableSpecs?.['ledDensity'] || specs['LED密度'] || '120LED/M',
    
    // Electrical
    voltage: savedEditableSpecs?.['voltage'] || specs['输入电压'] || '24V DC',
    power: savedEditableSpecs?.['power'] || specs['功率'] || '14.4W/m',
    ipRating: savedEditableSpecs?.['ipRating'] || specs['IP等级'] || 'IP20',
    beamAngle: savedEditableSpecs?.['beamAngle'] || specs['发光角度'] || '120°',
    
    // Photometric Summary
    cct: savedEditableSpecs?.['cct'] || specs['色温'] || '2700K-5700K',
    lumen: savedEditableSpecs?.['lumen'] || specs['光通量'] || '1200lm/m',
    efficacy: savedEditableSpecs?.['efficacy'] || specs['能效'] || '80lm/W',
    
    // LED Brand & Lifetime
    ledBrand: savedEditableSpecs?.['ledBrand'] || specs['LED品牌'] || 'Lumileds',
    lifetime: savedEditableSpecs?.['lifetime'] || specs['寿命'] || '50,000Hrs',
    
    // Remark
    remark: savedEditableSpecs?.['remark'] || '',
  }
  
  // 初始化 Photometric 功率组 - 从保存的数据加载，否则使用默认
  if (savedSettings?.photometricGroups && savedSettings.photometricGroups.length > 0) {
    photometricGroups.value = savedSettings.photometricGroups
  } else {
    photometricGroups.value = [
      {
        model: defaultModel,
        power: '9.6W/m',
        lumen: '960lm/m',
        efficacy: '100lm/W',
        cri2700: 'Ra90+',
        cri3000: 'Ra90+',
        cri3500: 'Ra90+',
        cri4000: 'Ra90+',
        cri5000: 'Ra90+',
        cri5700: 'Ra90+'
      },
      {
        model: defaultModel,
        power: '15W/m',
        lumen: '1500lm/m',
        efficacy: '100lm/W',
        cri2700: 'Ra98+',
        cri3000: 'Ra98+',
        cri3500: 'Ra90+',
        cri4000: 'Ra90+',
        cri5000: 'Ra90+',
        cri5700: 'Ra90+'
      }
    ]
  }
  
  specDialogVisible.value = true
}

// 下载规格书 - 使用html2canvas截取DOM
const downloadSpec = async () => {
  if (!specDocumentRef.value || !currentProduct.value) return
  
  // 先保存当前设置到 localStorage
  productStore.saveSpecSettingsForProduct(currentProduct.value.id, {
    logoUrl: customSettings.value?.logoUrl,
    productImage: customSettings.value?.productImage,
    dimensionImage: customSettings.value?.dimensionImage,
    certifications: customSettings.value?.certifications,
    footer: customSettings.value?.footer,
    editableSpecs: editableSpecs.value,
    photometricGroups: photometricGroups.value
  })
  
  try {
    ElMessage.info('正在生成规格书...')
    
    const canvas = await html2canvas(specDocumentRef.value, {
      scale: 2, // 2倍清晰度
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff'
    })
    
    const link = document.createElement('a')
    link.download = `${currentProduct.value?.name || 'spec'}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
    
    ElMessage.success('规格书已下载')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载规格书失败，请重试')
  }
}

// 暴露给父组件的方法
defineExpose({
  setCategoryFilter: (categoryId: number) => {
    selectCategory(categoryId)
  }
})
</script>

<style scoped>
.product-manage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.step-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 分类Tab */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 150px;
}

.category-tab:hover {
  border-color: #ff6b00;
}

.category-tab.active {
  border-color: #ff6b00;
  background: #fff7f0;
}

.cat-name {
  font-weight: bold;
  color: #333;
}

.cat-count {
  font-size: 12px;
  color: #909399;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.3s;
}

.category-tab:hover .delete-btn {
  opacity: 1;
}

/* 系列卡片 */
.series-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.series-card {
  width: 280px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

.series-card:hover {
  transform: translateY(-3px);
}

.series-card.active {
  border: 2px solid #ff6b00;
}

.series-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.series-name {
  font-weight: bold;
  color: #333;
}

.series-desc {
  font-size: 13px;
  color: #666;
}

.series-meta {
  margin-top: 5px;
}

.delete-series-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.3s;
}

.series-card:hover .delete-series-btn {
  opacity: 1;
}

/* 按钮样式 */
.section-card :deep(.el-button--primary) {
  background-color: #ff6b00;
  border-color: #ff6b00;
}

.section-card :deep(.el-button--primary:hover) {
  background-color: #ff8c00;
  border-color: #ff8c00;
}

/* Logo 上传样式 */
.logo-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.logo-uploader {
  width: 120px;
  height: 120px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s;
}

.logo-uploader:hover {
  border-color: #ff6b00;
}

.logo-uploader-icon {
  font-size: 28px;
  color: #8c9399;
}

.logo-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #909399;
}

/* 规格表单样式 */
.spec-form-section {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
  margin-top: 10px;
}

.spec-form-title {
  font-size: 14px;
  font-weight: bold;
  color: #ff6b00;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

/* 两列表格行 */
.spec-row-duo {
  display: flex;
  border-bottom: 1px solid #999;
}

.spec-duo-table {
  flex: 1;
  border-collapse: collapse;
  font-size: 9px;
}

.spec-duo-table:first-child {
  border-right: 1px solid #999;
}

.spec-duo-table th {
  background: #f5f5f5;
  border: 1px solid #333;
  border-top: none;
  padding: 5px 8px;
  font-weight: bold;
  text-align: center;
}

.spec-duo-table td {
  border: 1px solid #333;
  border-top: none;
  border-left: none;
  padding: 5px 8px;
  background: #fff;
  vertical-align: top;
}

.spec-duo-table:last-child th,
.spec-duo-table:last-child td {
  border-right: none;
}

/* Hex单元格样式 */
.hex-cell {
  margin: 2px 0;
  color: #000;
  line-height: 1.4;
}

.hex-label {
  font-weight: bold;
  color: #333;
}

.hex-input {
  display: block;
  width: 100%;
}

.hex-input.borderless {
  padding: 1px 2px !important;
  font-size: 8px !important;
}

/* Features + Dimension 行 */
.spec-row2 {
  display: flex;
  border-bottom: 1px solid #999;
}

.spec-row2 .spec-mini-table {
  flex: 1;
  min-width: 0;
}

/* 产品信息行 */
.spec-row1 {
  display: flex;
  align-items: flex-start;
  padding: 10px;
  border-bottom: 1px solid #999;
  gap: 10px;
}

.spec-row1 .spec-product-img {
  width: 180px;
  height: 110px;
  background: #f8f8f8;
  border: 1px solid #333;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.spec-product-img {
  width: 200px;
  height: 130px;
  background: #f8f8f8;
  border: 1px solid #333;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

/* ========== 规格书对话框样式 ========== */
.spec-dialog .el-dialog__body {
  padding: 0;
  overflow: hidden;
}

.spec-dialog-content {
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  justify-content: center;
}

/* ========== 规格书样式 - 按照原图排版 A4比例 ========== */
.spec-document {
  background: white;
  padding: 0;
  font-family: Arial, sans-serif;
  width: 794px;
  min-height: 1123px;
  border: 1px solid #333;
  flex-shrink: 0;
}

/* Logo单独一行 - 小尺寸 */
.spec-logo-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid #ddd;
  background: #fafafa;
}

.logo-upload-area {
  width: 100px;
  height: 40px;
  border: 1px dashed #999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fff;
}

.logo-upload-area:hover {
  border-color: #ff6b00;
}

.spec-logo-img {
  max-width: 100px;
  max-height: 40px;
  object-fit: contain;
}

.logo-upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
  font-size: 9px;
}

/* 认证图标横排 */
.spec-cert-row {
  display: flex;
  gap: 5px;
  padding: 5px 10px;
  border-bottom: 1px solid #ddd;
  background: #fff;
}

.spec-cert-row .cert-box {
  width: 35px;
  height: 25px;
  border: 1px solid #999;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  color: #999;
}

.spec-cert-row .cert-box:hover {
  border-color: #ff6b00;
}

.spec-cert-row .cert-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 两列表格行 */
.spec-row-duo {
  display: flex;
  border-bottom: 1px solid #999;
}

.spec-duo-table {
  flex: 1;
  border-collapse: collapse;
  font-size: 9px;
}

.spec-duo-table:first-child {
  border-right: 1px solid #999;
}

.spec-duo-table th {
  background: #f5f5f5;
  border: 1px solid #333;
  border-top: none;
  padding: 5px 8px;
  font-weight: bold;
  text-align: center;
}

.spec-duo-table td {
  border: 1px solid #333;
  border-top: none;
  border-left: none;
  padding: 5px 8px;
  background: #fff;
  vertical-align: top;
}

.spec-duo-table:last-child th,
.spec-duo-table:last-child td {
  border-right: none;
}

/* Hex单元格样式 */
.hex-cell {
  margin: 2px 0;
  color: #000;
  line-height: 1.4;
}

.hex-label {
  font-weight: bold;
  color: #333;
}

.hex-input {
  display: block;
  width: 100%;
}

.hex-input.borderless {
  padding: 1px 2px !important;
  font-size: 8px !important;
}

/* 认证图标横排 */
.spec-row1 {
  display: flex;
  align-items: flex-start;
  padding: 10px;
  border-bottom: 1px solid #999;
  gap: 10px;
}

.spec-logo {
  height: 40px;
  width: auto;
  flex-shrink: 0;
}

.spec-product-img {
  width: 200px;
  height: 130px;
  background: #f8f8f8;
  border: 1px solid #333;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.product-img-uploaded {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.product-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.led-strip-visual {
  width: 170px;
  height: 80px;
  background: repeating-linear-gradient(
    90deg,
    #ff8c00 0px,
    #ff8c00 8px,
    #e0e0e0 8px,
    #e0e0e0 12px
  );
  background-size: 12px 80px;
  border: 1px solid #333;
}

.led-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: #000;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  padding: 3px 8px;
}

.spec-info {
  flex: 1;
  padding: 0 10px;
}

.spec-title {
  font-size: 18px;
  font-weight: bold;
  color: #000;
  margin-bottom: 5px;
}

.spec-model {
  font-size: 12px;
  color: #000;
}

.spec-certs {
  display: flex;
  gap: 5px;
}

.cert-box {
  width: 30px;
  height: 30px;
  border: 1px solid #999;
  background: #fff;
}

.cert-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 通用表格样式 */
.spec-mini-table {
  border-collapse: collapse;
  font-size: 9px;
  width: 100%;
}

.spec-mini-table th {
  background: #f5f5f5;
  border: 1px solid #333;
  padding: 5px 8px;
  font-weight: bold;
  text-align: center;
}

.spec-mini-table td {
  border: 1px solid #333;
  border-top: none;
  padding: 5px 8px;
  background: #fff;
  vertical-align: top;
}

.spec-mini-table td > div {
  margin: 2px 0;
  color: #000;
  line-height: 1.4;
}

/* Features + Dimension 行 */
.spec-row2 {
  display: flex;
  border-bottom: 1px solid #999;
}

.spec-row2 .spec-mini-table {
  flex: 1;
  min-width: 0;
}

/* Dimension图片 */
.dimension-cell {
  height: 70px;
  text-align: center;
}

.dimension-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.dimension-placeholder {
  color: #999;
  font-size: 8px;
  padding: 20px;
}

/* 第3行：四列表格 */
.spec-row4 {
  border-bottom: 1px solid #999;
}

.spec-quad-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9px;
}

.spec-quad-table th {
  background: #f5f5f5;
  border: 1px solid #333;
  border-top: none;
  padding: 5px 8px;
  font-weight: bold;
  text-align: center;
  width: 25%;
}

.spec-quad-table td {
  border: 1px solid #333;
  border-top: none;
  padding: 5px 8px;
  background: #fff;
  vertical-align: top;
  width: 25%;
}

.spec-quad-table td > div {
  margin: 2px 0;
  color: #000;
  line-height: 1.4;
}

/* 第4行：Photometric大表格 */
.spec-row5 {
  padding: 0;
}

.photometric-title {
  background: #f5f5f5;
  border-bottom: none;
  padding: 5px 8px;
  font-weight: bold;
  font-size: 10px;
  display: inline-block;
}

.photometric-title-row {
  background: #f5f5f5;
  border: 1px solid #333;
  border-bottom: none;
  padding: 5px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remove-group-btn {
  margin-left: 5px;
  padding: 2px !important;
  font-size: 10px !important;
}

.photometric-big-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8px;
}

.photometric-big-table th {
  background: #333;
  color: #fff;
  border: 1px solid #555;
  padding: 5px;
  font-weight: bold;
  text-align: center;
}

.photometric-big-table td {
  border: 1px solid #555;
  padding: 4px;
  text-align: center;
  background: #fff;
}

.photometric-big-table tr:nth-child(even) td {
  background: #fafafa;
}

.dialog-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
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

/* 无边框输入框样式 - 与生成规格书一致的编辑体验 */
.borderless {
  border: none !important;
  background: transparent !important;
  outline: none !important;
  box-shadow: none !important;
  padding: 2px 4px !important;
  font-family: inherit !important;
  font-size: inherit !important;
  color: inherit !important;
  width: 100%;
  box-sizing: border-box;
}

.borderless:focus {
  background: rgba(255, 107, 0, 0.05) !important;
  border: 1px dashed #ff6b00 !important;
}

.table-input.borderless {
  padding: 2px !important;
  font-size: 8px !important;
}

.table-input.borderless.small {
  width: 90% !important;
}

.center {
  text-align: center !important;
}
</style>
