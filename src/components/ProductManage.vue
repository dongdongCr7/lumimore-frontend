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
        <div class="spec-header-new">
          <!-- 左侧产品图片 -->
          <div class="spec-product-image">
            <div class="product-img-placeholder">
              <div class="led-strip-visual">
                <div class="led-strip-body"></div>
              </div>
            </div>
            <div class="led-density-badge">{{ currentProduct?.specs['LED密度'] || '120 LED/M' }}</div>
          </div>
          
          <!-- 中间产品信息 -->
          <div class="spec-product-info-new">
            <div class="spec-product-title-new">{{ currentProduct?.name }}</div>
            <div class="spec-product-model-new">Model: {{ currentProduct?.name?.split(' ').pop() || 'LS-SW28N120-10' }}</div>
          </div>
          
          <!-- 右侧认证图标 -->
          <div class="spec-certifications-new">
            <div 
              v-for="i in 5" 
              :key="i"
              class="cert-box"
              :class="{ 'has-cert': customSettings?.certifications?.[i-1]?.image }"
            >
              <img 
                v-if="customSettings?.certifications?.[i-1]?.image" 
                :src="customSettings.certifications[i-1].image" 
                alt="cert" 
              />
            </div>
          </div>
        </div>

        <!-- 中间区域：左侧 Features+Dimension 横向排列，右侧 Product Setup/Light Engine + Electrical/Photometric/Features/Remark -->
        <div class="spec-mid-section">
          <!-- 左侧 Features 和 Dimension 横向排列 -->
          <div class="spec-left-row">
            <!-- Features表格 -->
            <table class="spec-mini-table features-table">
              <tr>
                <td class="mini-table-title">Features</td>
              </tr>
              <tr>
                <td class="mini-table-content features-content">
                  <div class="feature-item">Super High CRI {{ currentProduct?.specs['显色指数'] || 'Ra98+' }}</div>
                  <div class="feature-item">Ra9 {{ currentProduct?.specs['R9值'] || '>98' }}, Rg12 {{ currentProduct?.specs['R12值'] || '>98' }}</div>
                  <div class="feature-item">{{ currentProduct?.specs['LED密度'] || '120LED/M' }} | {{ currentProduct?.specs['功率'] || '15W/m' }}</div>
                  <div class="feature-item">{{ currentProduct?.specs['LED类型'] || '2835 SMD' }}</div>
                </td>
              </tr>
            </table>
            
            <!-- Dimension表格 -->
            <table class="spec-mini-table dimension-table">
              <tr>
                <td class="mini-table-title">Dimension</td>
              </tr>
              <tr>
                <td class="mini-table-content dimension-content">
                  <div class="dimension-diagram">
                    <div class="dimension-line dimension-width"></div>
                    <div class="dimension-line dimension-base"></div>
                    <div class="dimension-line dimension-leds"></div>
                    <div class="dimension-label">总宽: {{ currentProduct?.specs['总宽度'] || '10mm' }}</div>
                    <div class="dimension-label base-label">基板: {{ currentProduct?.specs['基板宽度'] || '12mm' }}</div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- 右侧参数组：上下排列 -->
          <div class="spec-right-col">
            <!-- 第一行：Product Setup + Light Engine -->
            <div class="spec-right-row">
              <table class="spec-mini-table setup-table">
                <tr>
                  <td class="mini-table-title">Product Setup</td>
                </tr>
                <tr>
                  <td class="mini-table-content">
                    <div class="param-row"><span class="param-label">Category</span><span class="param-value">LumStrip</span></div>
                    <div class="param-row"><span class="param-label">Level</span><span class="param-value">Core</span></div>
                    <div class="param-row"><span class="param-label">Spectrum</span><span class="param-value">White</span></div>
                  </td>
                </tr>
              </table>
              
              <table class="spec-mini-table engine-table">
                <tr>
                  <td class="mini-table-title">Light Engine</td>
                </tr>
                <tr>
                  <td class="mini-table-content">
                    <div class="param-row"><span class="param-label">Category</span><span class="param-value">LumStrip</span></div>
                    <div class="param-row"><span class="param-label">Level</span><span class="param-value">Core</span></div>
                    <div class="param-row"><span class="param-label">Spectrum</span><span class="param-value">White</span></div>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- 第二行：Electrical / Photometric / Features / Remark 四列 -->
            <table class="spec-mini-table combined-table">
              <tr>
                <td class="mini-table-title">Electrical</td>
                <td class="mini-table-title">Photometric</td>
                <td class="mini-table-title">Features</td>
                <td class="mini-table-title">Remark</td>
              </tr>
              <tr>
                <td class="mini-table-content">
                  <div class="param-row"><span class="param-label">Voltage</span><span class="param-value">{{ currentProduct?.specs['输入电压'] || '24V DC' }}</span></div>
                  <div class="param-row"><span class="param-label">Power</span><span class="param-value">{{ currentProduct?.specs['功率'] || '15W/m' }}</span></div>
                </td>
                <td class="mini-table-content">
                  <div class="param-row"><span class="param-label">CCT</span><span class="param-value">{{ currentProduct?.specs['色温'] || '2700K-5700K' }}</span></div>
                  <div class="param-row"><span class="param-label">CRI</span><span class="param-value">{{ currentProduct?.specs['显色指数'] || 'Ra98+' }}</span></div>
                  <div class="param-row"><span class="param-label">Lumen</span><span class="param-value">{{ currentProduct?.specs['光通量'] || '1200lm/m' }}</span></div>
                </td>
                <td class="mini-table-content">
                  <div class="param-row"><span class="param-label">LED Type</span><span class="param-value">{{ currentProduct?.specs['LED类型'] || '2835' }}</span></div>
                  <div class="param-row"><span class="param-label">IP Rating</span><span class="param-value">{{ currentProduct?.specs['IP等级'] || 'IP20' }}</span></div>
                  <div class="param-row"><span class="param-label">Angle</span><span class="param-value">{{ currentProduct?.specs['发光角度'] || '120°' }}</span></div>
                </td>
                <td class="mini-table-content">
                  <div class="param-row"><span class="param-label">Cut Unit</span><span class="param-value">{{ currentProduct?.specs['裁剪单元'] || '50mm' }}</span></div>
                  <div class="param-row"><span class="param-label">Lifespan</span><span class="param-value">{{ currentProduct?.specs['寿命'] || '>50,000hrs' }}</span></div>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- 底部Photometric参数表格 -->
        <div class="spec-photometric-section">
          <div class="photometric-title">Photometric</div>
          <table class="photometric-table">
            <thead>
              <tr>
                <th class="col-model">Model</th>
                <th class="col-power">Power</th>
                <th class="col-cct">CCT</th>
                <th class="col-cri">CRI</th>
                <th class="col-lumen">Lumen</th>
                <th class="col-efficacy">Efficacy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ currentProduct?.name }}</td>
                <td>{{ currentProduct?.specs['功率'] || '14.4W/m' }}</td>
                <td>{{ currentProduct?.specs['色温'] || '2700K-5700K' }}</td>
                <td>{{ currentProduct?.specs['显色指数'] || 'Ra98+' }}</td>
                <td>{{ currentProduct?.specs['光通量'] || '1200lm/m' }}</td>
                <td>{{ currentProduct?.specs['能效'] || '80lm/W' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="spec-footer">
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
  
  canvas.width = 850
  canvas.height = 900
  
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  let y = 15
  
  // === Logo行 ===
  const logoUrl = customSettings.value?.logoUrl || '/logo.jpg'
  try {
    const logoImg = new Image()
    logoImg.crossOrigin = 'anonymous'
    logoImg.src = logoUrl
    ctx.drawImage(logoImg, 350, y, 150, 40)
  } catch (e) {
    ctx.fillStyle = '#ff6b00'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('LUMIMORE', 425, y + 28)
  }
  
  y += 50
  
  // 顶部区域分隔线
  ctx.strokeStyle = '#ff6b00'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(20, y)
  ctx.lineTo(830, y)
  ctx.stroke()
  ctx.lineWidth = 1
  
  y += 12
  
  // === 顶部区域：产品图片 + 产品信息 + 认证图标 ===
  
  // 左侧产品图片
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(20, y, 100, 100)
  ctx.strokeStyle = '#ddd'
  ctx.strokeRect(20, y, 100, 100)
  
  // LED灯带示意图
  ctx.fillStyle = '#ff6b00'
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(28 + i * 12, y + 40, 8, 22)
    if (i < 5) {
      ctx.fillStyle = '#fff'
      ctx.fillRect(36 + i * 12, y + 40, 4, 22)
      ctx.fillStyle = '#ff6b00'
    }
  }
  
  // LED密度标签
  ctx.fillStyle = '#ff6b00'
  ctx.fillRect(78, y + 82, 38, 14)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 8px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(specs['LED密度'] || '120 LED/M', 97, y + 92)
  
  // 中间产品信息
  ctx.fillStyle = '#333'
  ctx.textAlign = 'left'
  ctx.font = 'bold 16px Arial'
  ctx.fillText(currentProduct.value?.name || 'LED Strip Light', 130, y + 40)
  
  ctx.font = '11px Arial'
  ctx.fillStyle = '#666'
  ctx.fillText(`Model: ${currentProduct.value?.name?.split(' ').pop() || 'LS-SW28N120-10'}`, 130, y + 58)
  
  // 右侧认证图标
  const certs = customSettings.value?.certifications || []
  for (let i = 0; i < 5; i++) {
    const certX = 600 + i * 42
    ctx.strokeStyle = '#ddd'
    ctx.strokeRect(certX, y + 10, 35, 35)
    
    if (certs[i]?.image) {
      const certImg = new Image()
      certImg.crossOrigin = 'anonymous'
      certImg.src = certs[i].image!
      ctx.drawImage(certImg, certX + 2, y + 12, 31, 31)
    }
  }
  
  y += 115
  
  // 分隔线
  ctx.strokeStyle = '#ddd'
  ctx.beginPath()
  ctx.moveTo(20, y)
  ctx.lineTo(830, y)
  ctx.stroke()
  
  y += 12
  
  // === 中间区域 ===
  
  // 左侧：Features + Dimension 横向排列
  const featuresWidth = 220
  const dimWidth = 180
  
  // Features表格
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(20, y, featuresWidth, 20)
  ctx.strokeStyle = '#ddd'
  ctx.strokeRect(20, y, featuresWidth, 20)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 10px Arial'
  ctx.fillText('Features', 25, y + 14)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(20, y + 20, featuresWidth, 55)
  ctx.strokeRect(20, y + 20, featuresWidth, 55)
  ctx.fillStyle = '#333'
  ctx.font = '9px Arial'
  ctx.fillText(`Super High CRI ${specs['显色指数'] || 'Ra98+'}`, 25, y + 35)
  ctx.fillText(`Ra9 ${specs['R9值'] || '>98'}, Rg12 ${specs['R12值'] || '>98'}`, 25, y + 47)
  ctx.fillText(`${specs['LED密度'] || '120LED/M'} | ${specs['功率'] || '15W/m'}`, 25, y + 59)
  ctx.fillText(specs['LED类型'] || '2835 SMD', 25, y + 71)
  
  // Dimension表格
  const dimX = 245
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(dimX, y, dimWidth, 20)
  ctx.strokeStyle = '#ddd'
  ctx.strokeRect(dimX, y, dimWidth, 20)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 10px Arial'
  ctx.fillText('Dimension', dimX + 5, y + 14)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(dimX, y + 20, dimWidth, 55)
  ctx.strokeRect(dimX, y + 20, dimWidth, 55)
  
  // 尺寸示意图
  ctx.fillStyle = '#333'
  ctx.fillRect(dimX + 10, y + 45, 150, 2)
  ctx.fillRect(dimX + 10, y + 55, 105, 2)
  ctx.fillRect(dimX + 60, y + 40, 2, 10)
  ctx.fillStyle = '#666'
  ctx.font = '8px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`总宽: ${specs['总宽度'] || '10mm'}`, dimX + 85, y + 43)
  ctx.fillText(`基板: ${specs['基板宽度'] || '12mm'}`, dimX + 62, y + 53)
  ctx.textAlign = 'left'
  
  y += 82
  
  // 右侧：Product Setup + Light Engine 横向排列
  const rightWidth = 190
  
  // Product Setup
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(dimX, y, rightWidth, 20)
  ctx.strokeStyle = '#ddd'
  ctx.strokeRect(dimX, y, rightWidth, 20)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 10px Arial'
  ctx.fillText('Product Setup', dimX + 5, y + 14)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(dimX, y + 20, rightWidth, 45)
  ctx.strokeRect(dimX, y + 20, rightWidth, 45)
  ctx.fillStyle = '#333'
  ctx.font = '9px Arial'
  ctx.fillText('Category:', dimX + 5, y + 35)
  ctx.fillText('LumStrip', dimX + 60, y + 35)
  ctx.fillText('Level:', dimX + 5, y + 47)
  ctx.fillText('Core', dimX + 60, y + 47)
  ctx.fillText('Spectrum:', dimX + 5, y + 59)
  ctx.fillText('White', dimX + 60, y + 59)
  
  // Light Engine
  const engineX = dimX + rightWidth + 5
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(engineX, y, rightWidth, 20)
  ctx.strokeStyle = '#ddd'
  ctx.strokeRect(engineX, y, rightWidth, 20)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 10px Arial'
  ctx.fillText('Light Engine', engineX + 5, y + 14)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(engineX, y + 20, rightWidth, 45)
  ctx.strokeRect(engineX, y + 20, rightWidth, 45)
  ctx.fillStyle = '#333'
  ctx.font = '9px Arial'
  ctx.fillText('Category:', engineX + 5, y + 35)
  ctx.fillText('LumStrip', engineX + 60, y + 35)
  ctx.fillText('Level:', engineX + 5, y + 47)
  ctx.fillText('Core', engineX + 60, y + 47)
  ctx.fillText('Spectrum:', engineX + 5, y + 59)
  ctx.fillText('White', engineX + 60, y + 59)
  
  y += 72
  
  // Electrical / Photometric / Features / Remark 四列
  
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(dimX, y, rightWidth * 2 + 5, 20)
  ctx.strokeStyle = '#ddd'
  ctx.strokeRect(dimX, y, rightWidth * 2 + 5, 20)
  
  // 四列表头
  ctx.fillStyle = '#333'
  ctx.font = 'bold 9px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Electrical', dimX + 30, y + 14)
  ctx.fillText('Photometric', engineX + 30, y + 14)
  ctx.fillText('Features', dimX + rightWidth + 50, y + 14)
  ctx.fillText('Remark', dimX + rightWidth + 145, y + 14)
  
  // 画竖线分隔
  ctx.strokeStyle = '#ddd'
  ctx.beginPath()
  ctx.moveTo(dimX + rightWidth + 2, y)
  ctx.lineTo(dimX + rightWidth + 2, y + 50)
  ctx.moveTo(engineX + rightWidth + 2, y)
  ctx.lineTo(engineX + rightWidth + 2, y + 50)
  ctx.moveTo(engineX + rightWidth + 100, y)
  ctx.lineTo(engineX + rightWidth + 100, y + 50)
  ctx.stroke()
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(dimX, y + 20, rightWidth * 2 + 5, 30)
  ctx.strokeRect(dimX, y + 20, rightWidth * 2 + 5, 30)
  ctx.strokeStyle = '#ddd'
  ctx.beginPath()
  ctx.moveTo(dimX + rightWidth + 2, y + 20)
  ctx.lineTo(dimX + rightWidth + 2, y + 50)
  ctx.moveTo(engineX + rightWidth + 2, y + 20)
  ctx.lineTo(engineX + rightWidth + 2, y + 50)
  ctx.moveTo(engineX + rightWidth + 100, y + 20)
  ctx.lineTo(engineX + rightWidth + 100, y + 50)
  ctx.stroke()
  
  ctx.fillStyle = '#333'
  ctx.font = '8px Arial'
  ctx.textAlign = 'left'
  
  // Electrical
  ctx.fillText(`V: ${specs['输入电压'] || '24V DC'}`, dimX + 5, y + 33)
  ctx.fillText(`P: ${specs['功率'] || '15W/m'}`, dimX + 5, y + 45)
  
  // Photometric
  ctx.fillText(`CCT: ${specs['色温'] || '2700K-5700K'}`, engineX + 5, y + 33)
  ctx.fillText(`CRI: ${specs['显色指数'] || 'Ra98+'}`, engineX + 5, y + 45)
  
  // Features
  ctx.fillText(`LED: ${specs['LED类型'] || '2835'}`, dimX + rightWidth + 10, y + 33)
  ctx.fillText(`IP: ${specs['IP等级'] || 'IP20'}`, dimX + rightWidth + 10, y + 45)
  
  // Remark
  ctx.fillText(`Cut: ${specs['裁剪单元'] || '50mm'}`, dimX + rightWidth + 105, y + 33)
  ctx.fillText(`Life: ${specs['寿命'] || '>50,000h'}`, dimX + rightWidth + 105, y + 45)
  
  y += 80
  
  // 分隔线
  ctx.strokeStyle = '#ddd'
  ctx.beginPath()
  ctx.moveTo(20, y)
  ctx.lineTo(830, y)
  ctx.stroke()
  
  y += 10
  
  // === Photometric标题 ===
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(20, y, 810, 18)
  ctx.strokeStyle = '#ddd'
  ctx.strokeRect(20, y, 810, 18)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('Photometric', 25, y + 13)
  
  y += 18
  
  // === Photometric参数表格 ===
  ctx.fillStyle = '#333'
  ctx.fillRect(20, y, 810, 22)
  
  const columns = [
    { title: 'Model', x: 20, w: 280 },
    { title: 'Power', x: 300, w: 100 },
    { title: 'CCT', x: 400, w: 80 },
    { title: 'CRI', x: 480, w: 80 },
    { title: 'Lumen', x: 560, w: 120 },
    { title: 'Efficacy', x: 680, w: 150 }
  ]
  
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  columns.forEach(col => {
    ctx.fillText(col.title, col.x + col.w / 2, y + 15)
  })
  
  ctx.strokeStyle = '#555'
  columns.forEach((col, i) => {
    if (i < columns.length - 1) {
      ctx.beginPath()
      ctx.moveTo(col.x + col.w, y)
      ctx.lineTo(col.x + col.w, y + 22)
      ctx.stroke()
    }
  })
  
  y += 22
  
  // 数据行
  const drawSection = () => {
    ctx.fillStyle = '#fff'
    ctx.fillRect(20, y, 810, 22)
    ctx.strokeStyle = '#ddd'
    ctx.strokeRect(20, y, 810, 22)
    
    ctx.beginPath()
    columns.forEach((col, j) => {
      if (j < columns.length - 1) {
        ctx.moveTo(col.x + col.w, y)
        ctx.lineTo(col.x + col.w, y + 22)
      }
    })
    ctx.stroke()
    
    ctx.fillStyle = '#333'
    ctx.font = '9px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(currentProduct.value?.name || 'LED Strip', 160, y + 15)
    ctx.fillText(specs['功率'] || '14.4W/m', 350, y + 15)
    ctx.fillText(specs['色温'] || '2700K-5700K', 440, y + 15)
    ctx.fillText(specs['显色指数'] || 'Ra98+', 520, y + 15)
    ctx.fillText(specs['光通量'] || '1200lm/m', 620, y + 15)
    ctx.fillText(specs['能效'] || '80lm/W', 755, y + 15)
    
    y += 22
  }
  
  drawSection()
  
  // 页脚
  y += 10
  ctx.strokeStyle = '#ddd'
  ctx.beginPath()
  ctx.moveTo(20, y)
  ctx.lineTo(830, y)
  ctx.stroke()
  
  ctx.fillStyle = '#999'
  ctx.font = '9px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(customSettings.value?.footer || 'LUMIMORE Lighting Technology Co., Ltd.', 425, y + 20)
  
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

/* ========== 新规格书样式 ========== */
.spec-document {
  background: white;
  padding: 15px;
  font-family: Arial, sans-serif;
  border: 1px solid #e4e7ed;
  width: 850px;
}

/* Logo行 */
.spec-logo-row {
  text-align: center;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.spec-logo-img {
  height: 50px;
  width: auto;
}

/* 顶部区域：产品图片 + 产品信息 + 认证图标 */
.spec-header-new {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd;
  margin-bottom: 10px;
}

.spec-product-image {
  width: 100px;
  height: 100px;
  position: relative;
  flex-shrink: 0;
}

.product-img-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
}

.led-strip-visual {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.led-strip-body {
  width: 80%;
  height: 25px;
  background: linear-gradient(to right, #ff6b00 25%, #fff 25%, #fff 50%, #ff6b00 50%, #ff6b00 75%, #fff 75%);
  background-size: 12px 25px;
  border-radius: 2px;
  border: 1px solid #ccc;
}

.led-density-badge {
  position: absolute;
  bottom: 3px;
  right: 3px;
  background: #ff6b00;
  color: white;
  font-size: 8px;
  font-weight: bold;
  padding: 2px 4px;
  border-radius: 2px;
}

.spec-product-info-new {
  flex: 1;
  min-width: 0;
}

.spec-product-title-new {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  line-height: 1.2;
}

.spec-product-model-new {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.spec-certifications-new {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.cert-box {
  width: 35px;
  height: 35px;
  border: 1px solid #ddd;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.cert-box.has-cert {
  background: white;
}

.cert-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 中间区域 */
.spec-mid-section {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

/* 左侧：Features + Dimension 横向排列 */
.spec-left-row {
  display: flex;
  gap: 10px;
  width: 45%;
}

.spec-left-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 45%;
}

/* 右侧：上下排列 */
.spec-right-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spec-right-row {
  display: flex;
  gap: 10px;
}

.spec-mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

.mini-table-title {
  background: #f5f7fa;
  font-weight: bold;
  color: #333;
  padding: 4px 8px;
  border: 1px solid #ddd;
  text-align: left;
}

.mini-table-content {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-top: none;
  background: white;
  vertical-align: top;
}

.features-table {
  width: 60%;
}

.features-content {
  height: 60px;
}

.dimension-table {
  width: 40%;
}

.feature-item {
  color: #333;
  line-height: 1.5;
  font-size: 9px;
}

.param-row {
  display: flex;
  justify-content: space-between;
  line-height: 1.6;
}

.param-label {
  color: #666;
  font-size: 9px;
}

.param-value {
  color: #333;
  font-weight: 500;
  font-size: 9px;
}

/* Dimension尺寸图 */
.dimension-content {
  height: 60px;
  padding: 8px;
}

.dimension-diagram {
  position: relative;
  width: 100%;
  height: 100%;
}

.dimension-line {
  position: absolute;
  background: #333;
}

.dimension-width {
  width: 100%;
  height: 2px;
  top: 10px;
  left: 0;
}

.dimension-base {
  width: 70%;
  height: 2px;
  top: 20px;
  left: 0;
}

.dimension-leds {
  width: 2px;
  height: 10px;
  top: 6px;
  left: 30%;
}

.dimension-label {
  position: absolute;
  font-size: 8px;
  color: #666;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}

.base-label {
  top: 22px;
  left: 35%;
}

.led-label {
  top: 32px;
  left: 32%;
}

/* Combined表格 */
.combined-table {
  margin-bottom: 0;
}

.combined-table .mini-table-title,
.combined-table .mini-table-content {
  width: 25%;
  display: table-cell;
}

.setup-table,
.engine-table {
  width: 50%;
}

/* 底部Photometric表格 */
.spec-photometric-section {
  margin-bottom: 10px;
}

.photometric-title {
  background: #f5f7fa;
  border: 1px solid #ddd;
  border-bottom: none;
  padding: 4px 10px;
  font-weight: bold;
  font-size: 11px;
  color: #333;
}

.photometric-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

.photometric-table th,
.photometric-table td {
  border: 1px solid #ddd;
  padding: 5px 8px;
  text-align: center;
}

.photometric-table th {
  background: #333;
  color: white;
  font-weight: bold;
}

.photometric-table .col-model {
  width: 35%;
}

.photometric-table .col-power {
  width: 12%;
}

.photometric-table .col-cct {
  width: 12%;
}

.photometric-table .col-cri {
  width: 12%;
}

.photometric-table .col-lumen {
  width: 15%;
}

.photometric-table .col-efficacy {
  width: 14%;
}

.photometric-table .section-header {
  background: #f0f0f0;
  font-weight: bold;
  color: #333;
}

.photometric-table tbody tr:nth-child(even):not(.section-header) {
  background: #fafafa;
}

.spec-footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
  text-align: center;
  color: #999;
  font-size: 12px;
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
