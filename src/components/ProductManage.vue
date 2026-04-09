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
          <el-button type="primary" size="small" @click="showAddProductDialog" v-if="userStore.canManageProducts()">
            <el-icon><Plus /></el-icon> 添加产品
          </el-button>
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

    <!-- 添加/编辑产品对话框 -->
    <el-dialog v-model="productDialogVisible" :title="editProduct ? '编辑产品' : '添加产品'" width="700px">
      <el-form :model="productForm" label-width="100px">
        <el-form-item label="所属分类">
          <span>{{ selectedCategoryId ? getCategoryName(selectedCategoryId) : '-' }}</span>
        </el-form-item>
        <el-form-item label="所属系列">
          <span>{{ selectedSeriesId ? getSeriesName(selectedSeriesId) : '-' }}</span>
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
    <el-dialog v-model="specDialogVisible" title="产品规格书" width="900px">
      <div class="spec-document" ref="specDocumentRef">
        <!-- Logo行 -->
        <div class="spec-logo-row">
          <img :src="customSettings?.logoUrl || '/logo.jpg'" alt="LUMIMORE Logo" class="spec-logo-img" />
        </div>
        
        <!-- 顶部区域：产品图片 + 产品信息 + 认证图标 -->
        <div class="spec-header-area">
          <!-- 左侧产品图片 -->
          <div class="spec-product-img">
            <div class="led-strip-preview">
              <div class="led-strip-line"></div>
            </div>
            <div class="led-badge">120 LED/M</div>
          </div>
          
          <!-- 中间产品信息 -->
          <div class="spec-info-center">
            <div class="spec-title">White 14.4W 2835 120LED 10MM</div>
            <div class="spec-model">Model: LS-SW28N120-10</div>
          </div>
          
          <!-- 右侧认证图标 -->
          <div class="spec-certs">
            <div v-for="i in 5" :key="i" class="cert-frame"></div>
          </div>
        </div>
        
        <!-- 中间区域：Features + Dimension -->
        <div class="spec-features-row">
          <table class="spec-table features-table">
            <tr><th>Features</th></tr>
            <tr><td>
              <div>Super High CRI Ra98+</div>
              <div>Ra98, R1-R9:81</div>
              <div>120LED [8MM] | 15W/m</div>
              <div>2835</div>
            </td></tr>
          </table>
          
          <table class="spec-table dimension-table">
            <tr><th>Dimension</th></tr>
            <tr><td class="dimension-cell">
              <div class="dimension-diagram"></div>
              <div class="dim-labels">
                <span>总宽: 10mm</span>
                <span>基板: 12mm</span>
              </div>
            </td></tr>
          </table>
        </div>
        
        <!-- Product Setup + Light Engine -->
        <div class="spec-setup-row">
          <table class="spec-table setup-table">
            <tr><th>Product Setup</th></tr>
            <tr><td>
              <div><span class="label">Category:</span> LumStrip</div>
              <div><span class="label">Level:</span> Core</div>
              <div><span class="label">Spectrum:</span> White</div>
            </td></tr>
          </table>
          
          <table class="spec-table engine-table">
            <tr><th>Light Engine</th></tr>
            <tr><td>
              <div><span class="label">Category:</span> LumStrip</div>
              <div><span class="label">Level:</span> Core</div>
              <div><span class="label">Spectrum:</span> White</div>
            </td></tr>
          </table>
        </div>
        
        <!-- 四列参数 -->
        <div class="spec-params-row">
          <div class="param-col"><div class="param-title">Electrical</div>
            <div>V: 24V DC</div><div>P: 15W/m</div>
          </div>
          <div class="param-col"><div class="param-title">Photometric</div>
            <div>CCT: 2700K-5700K</div><div>CRI: Ra98+</div>
          </div>
          <div class="param-col"><div class="param-title">Features</div>
            <div>LED: 2835</div><div>IP: IP20</div>
          </div>
          <div class="param-col"><div class="param-title">Remark</div>
            <div>Cut: 50mm</div><div>Life: >50,000h</div>
          </div>
        </div>
        
        <!-- Photometric表格 -->
        <div class="spec-photometric-section">
          <div class="photometric-header">Photometric</div>
          <table class="photometric-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Power</th>
                <th>CCT</th>
                <th>CRI</th>
                <th>Lumen</th>
                <th>Efficacy</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in photometricData" :key="idx">
                <td>{{ row.model }}</td>
                <td>{{ row.power }}</td>
                <td>{{ row.cct }}</td>
                <td>{{ row.cri }}</td>
                <td>{{ row.lumen }}</td>
                <td>{{ row.efficacy }}</td>
              </tr>
            </tbody>
          </table>
        </div>
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
    <el-dialog v-model="customDialogVisible" title="自定义规格书" width="600px">
      <el-form :model="customSettingsForm" label-width="100px">
        <el-form-item label="Logo上传">
          <div class="logo-upload">
            <el-upload
              class="logo-uploader"
              :show-file-list="false"
              :before-upload="beforeLogoUpload"
              :http-request="handleLogoUpload"
              accept="image/*"
            >
              <img v-if="customSettingsForm.logoUrl" :src="customSettingsForm.logoUrl" class="logo-preview" />
              <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="logo-tip">
              <span>点击上传 Logo</span>
              <el-button v-if="customSettingsForm.logoUrl" type="danger" size="small" text @click="removeLogo">移除</el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="认证图标">
          <div class="cert-list">
            <div v-for="(cert, index) in customSettingsForm.certifications" :key="index" class="cert-item">
              <el-input v-model="cert.name" placeholder="认证名称" style="width: 120px" />
              <el-upload
                :show-file-list="false"
                :before-upload="beforeLogoUpload"
                :http-request="(opt: any) => handleCertUpload(opt, index)"
                accept="image/*"
                style="display: inline-block"
              >
                <el-button size="small">上传图标</el-button>
              </el-upload>
              <el-button type="danger" size="small" @click="removeCert(index)">删除</el-button>
            </div>
            <el-button type="primary" size="small" @click="addCert">添加认证</el-button>
          </div>
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

// 产品对话框
const productDialogVisible = ref(false)
const editProduct = ref<Product | null>(null)
const productForm = reactive({
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
  logoUrl?: string
  certifications?: Array<{ name: string; image?: string }>
  footer?: string
} | null>(null)

// 自定义对话框
const customDialogVisible = ref(false)
const customSettingsForm = reactive({
  logoUrl: '',
  certifications: [] as Array<{ name: string; image?: string }>,
  footer: ''
})

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

// Photometric表格数据
const photometricData = computed(() => {
  const ccts = ['2700K', '3000K', '3500K', '4000K', '5000K', '5700K']
  const powers = ['9.6W/m', '15W/m']
  const data: Array<{model: string, power: string, cct: string, cri: string, lumen: string, efficacy: string}> = []
  
  ccts.forEach(cct => {
    powers.forEach(power => {
      data.push({
        model: 'LS-SW28N120-2790-2408-100',
        power: power,
        cct: cct,
        cri: 'Ra90+',
        lumen: '1200lm/m',
        efficacy: '80lm/W'
      })
    })
  })
  
  return data
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

// 产品操作
const showAddProductDialog = () => {
  editProduct.value = null
  productForm.name = ''
  specInputs.value = [
    { name: 'LED密度', value: '120LED/M' },
    { name: '功率', value: '15W/m' },
    { name: 'LED类型', value: '2835' },
    { name: '显色指数', value: 'Ra98+' },
    { name: 'R9值', value: '>98' },
    { name: 'R12值', value: '>98' },
    { name: '色温', value: '2700K-5700K' },
    { name: '光通量', value: '1200mm/m' },
    { name: '能效', value: '80lm/W' },
    { name: '输入电压', value: '24V DC' },
    { name: '裁剪单元', value: '50mm' },
    { name: '总宽度', value: '16.6mm' },
    { name: '基板宽度', value: '12mm' },
    { name: 'IP等级', value: 'IP20' },
    { name: '发光角度', value: '120°' },
    { name: '工作温度', value: '-20°C ~ +45°C' },
    { name: '储存温度', value: '-30°C ~ +70°C' },
    { name: '寿命', value: '>50,000小时' },
    { name: '认证', value: 'CE, RoHS' }
  ]
  productDialogVisible.value = true
}

const showEditProductDialog = (product: Product) => {
  editProduct.value = product
  productForm.name = product.name
  specInputs.value = Object.entries(product.specs).map(([name, value]) => ({ name, value }))
  productDialogVisible.value = true
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
    productStore.addProduct(selectedSeriesId.value!, selectedCategoryId.value!, productForm.name, specs)
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

// 规格书
const showSpecDialog = (product: Product) => {
  currentProduct.value = product
  customSettings.value = {
    logoUrl: '/logo.jpg',
    certifications: [],
    footer: 'LUMIMORE Lighting Technology Co., Ltd.'
  }
  specDialogVisible.value = true
}

const showCustomDialog = () => {
  customSettingsForm.logoUrl = customSettings.value?.logoUrl || ''
  customSettingsForm.certifications = customSettings.value?.certifications ? [...customSettings.value.certifications] : []
  customSettingsForm.footer = customSettings.value?.footer || ''
  customDialogVisible.value = true
}

const addCert = () => {
  customSettingsForm.certifications.push({ name: '', image: '' })
}

const removeCert = (index: number) => {
  customSettingsForm.certifications.splice(index, 1)
}

// Logo 上传相关
const beforeLogoUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleLogoUpload = (options: { file: File }) => {
  const file = options.file
  const reader = new FileReader()
  reader.onload = (e) => {
    customSettingsForm.logoUrl = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const handleCertUpload = (options: { file: File }, index: number) => {
  const file = options.file
  const reader = new FileReader()
  reader.onload = (e) => {
    customSettingsForm.certifications[index].image = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeLogo = () => {
  customSettingsForm.logoUrl = ''
}

const applyCustomSettings = () => {
  customSettings.value = {
    logoUrl: customSettingsForm.logoUrl || '/logo.jpg',
    certifications: customSettingsForm.certifications,
    footer: customSettingsForm.footer
  }
  customDialogVisible.value = false
  ElMessage.success('自定义设置已应用')
}

const downloadSpec = () => {
  if (!specDocumentRef.value) return
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const specs = currentProduct.value?.specs || {}
  
  // 画布尺寸
  canvas.width = 850
  canvas.height = 750
  
  // 白色背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 边框颜色
  const borderColor = '#333'
  const lineWidth = 1
  
  // ========== 1. 顶部Logo行 ==========
  const logoUrl = customSettings.value?.logoUrl || '/logo.jpg'
  try {
    const logoImg = new Image()
    logoImg.crossOrigin = 'anonymous'
    logoImg.src = logoUrl
    logoImg.onload = () => {
      ctx.drawImage(logoImg, 20, 10, 120, 40)
    }
  } catch (e) {
    ctx.fillStyle = '#ff6b00'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('LUMIMORE', 80, 38)
  }
  
  let y = 60
  
  // 顶部分隔线
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(20, y)
  ctx.lineTo(830, y)
  ctx.stroke()
  
  y += 10
  
  // ========== 2. 顶部横向区域：产品图片 + 产品信息 + 认证图标 ==========
  
  // 产品图片区域（左侧）
  const imgWidth = 200
  const imgHeight = 130
  
  ctx.fillStyle = '#f8f8f8'
  ctx.fillRect(20, y, imgWidth, imgHeight)
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1
  ctx.strokeRect(20, y, imgWidth, imgHeight)
  
  // LED灯带示意图
  ctx.fillStyle = '#e0e0e0'
  ctx.fillRect(25, y + 10, 190, 60)
  
  // 绘制LED灯珠
  ctx.fillStyle = '#ff8c00'
  for (let i = 0; i < 15; i++) {
    ctx.fillRect(30 + i * 12, y + 20, 8, 40)
  }
  
  // LED密度标签
  ctx.fillStyle = '#000'
  ctx.fillRect(160, y + 105, 55, 20)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('120 LED/M', 187, y + 119)
  
  // 产品信息（中间）
  ctx.fillStyle = '#000'
  ctx.textAlign = 'left'
  ctx.font = 'bold 18px Arial'
  ctx.fillText('White 14.4W 2835 120LED 10MM', 235, y + 50)
  
  ctx.font = '12px Arial'
  ctx.fillText('Model: LS-SW28N120-10', 235, y + 75)
  
  // 认证图标框（右侧，5个）
  ctx.textAlign = 'left'
  for (let i = 0; i < 5; i++) {
    const certX = 650 + i * 32
    ctx.strokeStyle = '#999'
    ctx.strokeRect(certX, y + 30, 28, 28)
  }
  
  y += imgHeight + 10
  
  // 分隔线
  ctx.strokeStyle = '#999'
  ctx.beginPath()
  ctx.moveTo(20, y)
  ctx.lineTo(830, y)
  ctx.stroke()
  
  y += 10
  
  // ========== 3. 中间左侧：Features + Dimension 并排 ==========
  
  const leftColWidth = 240
  const dimWidth = 220
  
  // Features表格
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(20, y, leftColWidth, 18)
  ctx.strokeStyle = borderColor
  ctx.strokeRect(20, y, leftColWidth, 18)
  ctx.fillStyle = '#000'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Features', 140, y + 13)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(20, y + 18, leftColWidth, 70)
  ctx.strokeRect(20, y + 18, leftColWidth, 70)
  
  ctx.fillStyle = '#000'
  ctx.font = '9px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('Super High CRI Ra98+', 25, y + 33)
  ctx.fillText('Ra98, R1-R9:81', 25, y + 46)
  ctx.fillText('120LED [8MM] | 15W/m', 25, y + 59)
  ctx.fillText('2835', 25, y + 72)
  
  // Dimension表格
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(265, y, dimWidth, 18)
  ctx.strokeRect(265, y, dimWidth, 18)
  ctx.fillStyle = '#000'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Dimension', 375, y + 13)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(265, y + 18, dimWidth, 70)
  ctx.strokeRect(265, y + 18, dimWidth, 70)
  
  // 尺寸示意图
  ctx.fillStyle = '#000'
  // 主体矩形
  ctx.fillRect(275, y + 30, 190, 4)
  // 上层线
  ctx.fillRect(275, y + 26, 100, 4)
  // 引脚
  ctx.fillRect(290, y + 30, 3, 15)
  ctx.fillRect(385, y + 30, 3, 15)
  
  ctx.font = '8px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('总宽: 10mm', 420, y + 40)
  ctx.fillText('基板: 12mm', 300, y + 50)
  ctx.textAlign = 'left'
  
  y += 100
  
  // ========== 4. 中间左侧下方：Product Setup + Light Engine 并排 ==========
  
  const setupWidth = 200
  const engineWidth = 200
  
  // Product Setup表格
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(20, y, setupWidth, 18)
  ctx.strokeRect(20, y, setupWidth, 18)
  ctx.fillStyle = '#000'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Product Setup', 120, y + 13)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(20, y + 18, setupWidth, 55)
  ctx.strokeRect(20, y + 18, setupWidth, 55)
  
  ctx.fillStyle = '#000'
  ctx.font = '9px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('Category:', 25, y + 35)
  ctx.fillText('LumStrip', 80, y + 35)
  ctx.fillText('Level:', 25, y + 47)
  ctx.fillText('Core', 80, y + 47)
  ctx.fillText('Spectrum:', 25, y + 59)
  ctx.fillText('White', 80, y + 59)
  
  // Light Engine表格
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(230, y, engineWidth, 18)
  ctx.strokeRect(230, y, engineWidth, 18)
  ctx.fillStyle = '#000'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Light Engine', 330, y + 13)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(230, y + 18, engineWidth, 55)
  ctx.strokeRect(230, y + 18, engineWidth, 55)
  
  ctx.fillStyle = '#000'
  ctx.font = '9px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('Category:', 235, y + 35)
  ctx.fillText('LumStrip', 290, y + 35)
  ctx.fillText('Level:', 235, y + 47)
  ctx.fillText('Core', 290, y + 47)
  ctx.fillText('Spectrum:', 235, y + 59)
  ctx.fillText('White', 290, y + 59)
  
  y += 90
  
  // ========== 5. 中间右侧：Electrical / Photometric / Features / Remark 四列 ==========
  
  const colWidth = 95
  
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(440, y, colWidth * 4 + 6, 18)
  ctx.strokeRect(440, y, colWidth * 4 + 6, 18)
  
  // 竖线
  ctx.beginPath()
  ctx.moveTo(535, y)
  ctx.lineTo(535, y + 50)
  ctx.moveTo(630, y)
  ctx.lineTo(630, y + 50)
  ctx.moveTo(725, y)
  ctx.lineTo(725, y + 50)
  ctx.stroke()
  
  ctx.fillStyle = '#000'
  ctx.font = 'bold 9px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Electrical', 487, y + 13)
  ctx.fillText('Photometric', 582, y + 13)
  ctx.fillText('Features', 677, y + 13)
  ctx.fillText('Remark', 772, y + 13)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(440, y + 18, colWidth * 4 + 6, 32)
  ctx.strokeRect(440, y + 18, colWidth * 4 + 6, 32)
  
  // 竖线
  ctx.beginPath()
  ctx.moveTo(535, y + 18)
  ctx.lineTo(535, y + 50)
  ctx.moveTo(630, y + 18)
  ctx.lineTo(630, y + 50)
  ctx.moveTo(725, y + 18)
  ctx.lineTo(725, y + 50)
  ctx.stroke()
  
  ctx.fillStyle = '#000'
  ctx.font = '8px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('V: 24V DC', 445, y + 30)
  ctx.fillText('P: 15W/m', 445, y + 43)
  
  ctx.fillText('CCT: 2700K-5700K', 540, y + 30)
  ctx.fillText('CRI: Ra98+', 540, y + 43)
  
  ctx.fillText('LED: 2835', 635, y + 30)
  ctx.fillText('IP: IP20', 635, y + 43)
  
  ctx.fillText('Cut: 50mm', 730, y + 30)
  ctx.fillText('Life: >50,000h', 730, y + 43)
  
  y += 70
  
  // ========== 6. Photometric标题 + 数据表格 ==========
  
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(20, y, 810, 18)
  ctx.strokeRect(20, y, 810, 18)
  ctx.fillStyle = '#000'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('Photometric', 25, y + 13)
  
  y += 18
  
  // 表头
  ctx.fillStyle = '#333'
  ctx.fillRect(20, y, 810, 20)
  
  const headers = [
    { title: 'Model', x: 20, w: 290 },
    { title: 'Power', x: 310, w: 100 },
    { title: 'CCT', x: 410, w: 80 },
    { title: 'CRI', x: 490, w: 90 },
    { title: 'Lumen', x: 580, w: 120 },
    { title: 'Efficacy', x: 700, w: 130 }
  ]
  
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  headers.forEach(h => {
    ctx.fillText(h.title, h.x + h.w / 2, y + 14)
  })
  
  // 竖线
  ctx.beginPath()
  headers.forEach((h, i) => {
    if (i < headers.length - 1) {
      ctx.moveTo(h.x + h.w, y)
      ctx.lineTo(h.x + h.w, y + 20)
    }
  })
  ctx.stroke()
  
  y += 20
  
  // 数据行 - 根据实际产品数据生成多行
  const cctValues = ['2700K', '3000K', '3500K', '4000K', '5000K', '5700K']
  const powers = ['9.6W/m', '15W/m']
  
  let dataY = y
  cctValues.forEach((cct, cctIdx) => {
    powers.forEach((power, powerIdx) => {
      ctx.fillStyle = '#fff'
      ctx.fillRect(20, dataY, 810, 18)
      ctx.strokeStyle = '#555'
      ctx.strokeRect(20, dataY, 810, 18)
      
      // 竖线
      ctx.beginPath()
      headers.forEach((h, i) => {
        if (i < headers.length - 1) {
          ctx.moveTo(h.x + h.w, dataY)
          ctx.lineTo(h.x + h.w, dataY + 18)
        }
      })
      ctx.stroke()
      
      ctx.fillStyle = '#000'
      ctx.font = '8px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('LS-SW28N120-2790-2408-100', 165, dataY + 12)
      ctx.fillText(power, 360, dataY + 12)
      ctx.fillText(cct, 450, dataY + 12)
      ctx.fillText('Ra90+', 535, dataY + 12)
      ctx.fillText('1200lm/m', 640, dataY + 12)
      ctx.fillText('80lm/W', 765, dataY + 12)
      
      dataY += 18
    })
  })
  
  // 下载图片
  const link = document.createElement('a')
  link.download = `${currentProduct.value?.name || 'spec'}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
  
  ElMessage.success('规格书已下载')
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

/* 认证图标列表 */
.cert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cert-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* ========== 规格书样式 ========== */
.spec-document {
  background: white;
  padding: 15px;
  font-family: Arial, sans-serif;
  border: 1px solid #e4e7ed;
  width: 850px;
}

.spec-logo-row {
  text-align: left;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;
}

.spec-logo-img {
  height: 40px;
  width: auto;
}

/* 顶部区域 */
.spec-header-area {
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 10px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #999;
}

.spec-product-img {
  width: 200px;
  height: 130px;
  background: #f8f8f8;
  border: 1px solid #333;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.led-strip-preview {
  width: 190px;
  height: 60px;
  background: #e0e0e0;
  display: flex;
  align-items: center;
}

.led-strip-line {
  width: 100%;
  height: 40px;
  background: repeating-linear-gradient(
    90deg,
    #ff8c00 0px,
    #ff8c00 8px,
    #fff 8px,
    #fff 12px
  );
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

.spec-info-center {
  flex: 1;
}

.spec-title {
  font-size: 18px;
  font-weight: bold;
  color: #000;
  margin-bottom: 8px;
}

.spec-model {
  font-size: 12px;
  color: #000;
}

.spec-certs {
  display: flex;
  gap: 4px;
}

.cert-frame {
  width: 28px;
  height: 28px;
  border: 1px solid #999;
}

/* Features + Dimension 区域 */
.spec-features-row {
  display: flex;
  gap: 5px;
  margin: 10px 0;
}

.spec-table {
  border-collapse: collapse;
  font-size: 9px;
}

.spec-table th {
  background: #f5f5f5;
  border: 1px solid #333;
  padding: 4px 8px;
  font-weight: bold;
  text-align: center;
}

.spec-table td {
  border: 1px solid #333;
  padding: 4px 8px;
  background: #fff;
  vertical-align: top;
}

.spec-table td > div {
  margin: 2px 0;
  color: #000;
}

.features-table {
  width: 240px;
}

.dimension-table {
  width: 220px;
}

.dimension-cell {
  height: 70px;
}

.dimension-diagram {
  height: 30px;
  background: #fff;
  border-bottom: 2px solid #000;
  margin-bottom: 5px;
}

.dim-labels {
  font-size: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Product Setup + Light Engine */
.spec-setup-row {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

.setup-table, .engine-table {
  width: 200px;
}

.setup-table td, .engine-table td {
  height: 55px;
}

.label {
  color: #666;
}

/* 四列参数 */
.spec-params-row {
  display: flex;
  gap: 0;
  margin: 10px 0;
  border: 1px solid #333;
}

.param-col {
  flex: 1;
  padding: 8px;
  border-right: 1px solid #333;
  font-size: 8px;
}

.param-col:last-child {
  border-right: none;
}

.param-title {
  font-weight: bold;
  background: #f5f5f5;
  margin: -8px -8px 5px -8px;
  padding: 4px;
  text-align: center;
  border-bottom: 1px solid #333;
}

/* Photometric表格 */
.spec-photometric-section {
  margin-top: 10px;
}

.photometric-header {
  background: #f5f5f5;
  border: 1px solid #333;
  padding: 4px 8px;
  font-weight: bold;
  font-size: 10px;
}

.photometric-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8px;
}

.photometric-table th {
  background: #333;
  color: #fff;
  border: 1px solid #555;
  padding: 5px;
  font-weight: bold;
  text-align: center;
}

.photometric-table td {
  border: 1px solid #555;
  padding: 4px;
  text-align: center;
  background: #fff;
}

.photometric-table tr:nth-child(even) td {
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
</style>
