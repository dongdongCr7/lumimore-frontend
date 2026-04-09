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
    
    <!-- 调试：显示photometricData -->
    <div style="position:fixed;top:0;left:0;background:yellow;padding:10px;z-index:99999;font-size:20px;">
      测试：photometricData.length = {{ photometricData.length }}
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
    <el-dialog v-model="specDialogVisible" title="产品规格书" width="850px">
      <div class="spec-document" ref="specDocumentRef">
        
        <!-- 第1行：Logo + 产品图片 + 产品信息 + 认证图标 -->
        <div class="spec-row1">
          <img :src="customSettings?.logoUrl || '/logo.jpg'" alt="Logo" class="spec-logo" />
          <div class="spec-product-img">
            <img v-if="customSettings?.productImage" :src="customSettings.productImage" class="product-img-uploaded" />
            <div v-else class="product-img-placeholder">
              <div class="led-strip-visual"></div>
              <div class="led-badge">120 LED/M</div>
            </div>
          </div>
          <div class="spec-info">
            <div class="spec-title">White 14.4W 2835 120LED 10MM</div>
            <div class="spec-model">Model: LS-SW28N120-10</div>
          </div>
          <div class="spec-certs">
            <div v-for="i in 5" :key="i" class="cert-box">
              <img v-if="customSettings?.certifications?.[i-1]?.image" :src="customSettings.certifications[i-1].image" />
            </div>
          </div>
        </div>
        
        <!-- 第2行：产品图片 + Features + Dimension + Product Setup + Light Engine 并排 -->
        <div class="spec-row2">
          <div class="spec-product-img">
            <img v-if="customSettings?.productImage" :src="customSettings.productImage" class="product-img-uploaded" />
            <div v-else class="product-img-placeholder">
              <div class="led-strip-visual"></div>
              <div class="led-badge">120 LED/M</div>
            </div>
          </div>
          <table class="spec-mini-table">
            <tr><th>Features</th></tr>
            <tr><td>
              <div>Super High CRI Ra98</div>
              <div>Ra9>98, Rg12>98</div>
              <div>120LED/M | 15W/m</div>
              <div>2835</div>
            </td></tr>
          </table>
          <table class="spec-mini-table">
            <tr><th>Dimension</th></tr>
            <tr><td class="dimension-cell">
              <img v-if="customSettings?.dimensionImage" :src="customSettings.dimensionImage" class="dimension-img" />
              <div v-else class="dimension-placeholder">点击上传尺寸图</div>
            </td></tr>
          </table>
          <table class="spec-mini-table">
            <tr><th>Product Setup</th></tr>
            <tr><td>
              <div>Category&nbsp;&nbsp;LumStrip</div>
              <div>Level&nbsp;&nbsp;&nbsp;&nbsp;Core</div>
              <div>Spectrum&nbsp;White</div>
            </td></tr>
          </table>
          <table class="spec-mini-table">
            <tr><th>Light Engine</th></tr>
            <tr><td>
              <div>Category&nbsp;&nbsp;LumStrip</div>
              <div>Level&nbsp;&nbsp;&nbsp;&nbsp;Core</div>
              <div>Spectrum&nbsp;White</div>
            </td></tr>
          </table>
        </div>
        
        <!-- 第3行：Electrical + Photometric + Features + Remark 四列 -->
        <div class="spec-row4">
          <table class="spec-quad-table">
            <tr>
              <th>Electrical</th>
              <th>Photometric</th>
              <th>Features</th>
              <th>Remark</th>
            </tr>
            <tr>
              <td>
                <div>Category&nbsp;&nbsp;LumStrip</div>
                <div>Level&nbsp;&nbsp;&nbsp;&nbsp;Core</div>
              </td>
              <td>
                <div>Category&nbsp;&nbsp;LumStrip</div>
                <div>Level&nbsp;&nbsp;&nbsp;&nbsp;Core</div>
                <div>Spectrum&nbsp;White</div>
                <div>Category&nbsp;&nbsp;LumStrip</div>
                <div>Level&nbsp;&nbsp;&nbsp;&nbsp;Core</div>
                <div>Spectrum&nbsp;White</div>
              </td>
              <td>
                <div>Category&nbsp;&nbsp;LumStrip</div>
                <div>Level&nbsp;&nbsp;&nbsp;&nbsp;Core</div>
                <div>Spectrum&nbsp;White</div>
              </td>
              <td></td>
            </tr>
          </table>
        </div>
        
        <!-- 第4行：Photometric大表格 -->
        <div class="spec-row5">
          <div class="photometric-title">Photometric</div>
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
              <tr>
                <td colspan="6" style="background:#ff0">DEBUG: 数据行数 = {{ photometricData.length }}</td>
              </tr>
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
    <el-dialog v-model="customDialogVisible" title="自定义规格书" width="700px">
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
        
        <el-form-item label="产品图片">
          <div class="logo-upload">
            <el-upload
              class="logo-uploader"
              :show-file-list="false"
              :before-upload="beforeLogoUpload"
              :http-request="handleProductImageUpload"
              accept="image/*"
            >
              <img v-if="customSettingsForm.productImage" :src="customSettingsForm.productImage" class="logo-preview" />
              <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="logo-tip">
              <span>点击上传产品图片</span>
              <el-button v-if="customSettingsForm.productImage" type="danger" size="small" text @click="removeProductImage">移除</el-button>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="尺寸图片">
          <div class="logo-upload">
            <el-upload
              class="logo-uploader"
              :show-file-list="false"
              :before-upload="beforeLogoUpload"
              :http-request="handleDimensionImageUpload"
              accept="image/*"
            >
              <img v-if="customSettingsForm.dimensionImage" :src="customSettingsForm.dimensionImage" class="logo-preview" />
              <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="logo-tip">
              <span>点击上传尺寸图片</span>
              <el-button v-if="customSettingsForm.dimensionImage" type="danger" size="small" text @click="removeDimensionImage">移除</el-button>
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
  productImage?: string
  dimensionImage?: string
  certifications?: Array<{ name: string; image?: string }>
  footer?: string
} | null>(null)

// 自定义对话框
const customDialogVisible = ref(false)
const customSettingsForm = reactive({
  logoUrl: '',
  productImage: '',
  dimensionImage: '',
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

// Photometric表格数据 - 按照原图24行数据
const photometricData = computed(() => {
  // 原图24行数据
  return [
    { model: 'LS-SW28N120-2790-2408-100', power: '9.6W/m', cct: '2700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '9.6W/m', cct: '3000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '9.6W/m', cct: '3500K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '9.6W/m', cct: '4000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '9.6W/m', cct: '5000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '9.6W/m', cct: '5700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '9.6W/m', cct: '2700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '2700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '3000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '3500K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '4000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '5000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '5700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '2700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '3000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '3500K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '4000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '5000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '5700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '2700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '3000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '3500K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '4000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '5000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { model: 'LS-SW28N120-2790-2408-100', power: '15W/m', cct: '5700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' }
  ]
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
    productImage: '',
    dimensionImage: '',
    certifications: [],
    footer: ''
  }
  specDialogVisible.value = true
}

const showCustomDialog = () => {
  customSettingsForm.logoUrl = customSettings.value?.logoUrl || ''
  customSettingsForm.productImage = customSettings.value?.productImage || ''
  customSettingsForm.dimensionImage = customSettings.value?.dimensionImage || ''
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

const handleProductImageUpload = (options: { file: File }) => {
  const file = options.file
  const reader = new FileReader()
  reader.onload = (e) => {
    customSettingsForm.productImage = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const handleDimensionImageUpload = (options: { file: File }) => {
  const file = options.file
  const reader = new FileReader()
  reader.onload = (e) => {
    customSettingsForm.dimensionImage = e.target?.result as string
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

const removeProductImage = () => {
  customSettingsForm.productImage = ''
}

const removeDimensionImage = () => {
  customSettingsForm.dimensionImage = ''
}

const applyCustomSettings = () => {
  customSettings.value = {
    logoUrl: customSettingsForm.logoUrl || '/logo.jpg',
    productImage: customSettingsForm.productImage,
    dimensionImage: customSettingsForm.dimensionImage,
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
  
  // A4尺寸比例 210:297 ≈ 1:1.414
  const pageWidth = 800
  const pageHeight = 1130 // A4比例
  
  canvas.width = pageWidth
  canvas.height = pageHeight
  
  // 白色背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, pageWidth, pageHeight)
  
  // 边框
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, pageWidth, pageHeight)
  
  let y = 0
  
  // ========== 顶部标题区 ==========
  
  // 产品图片区域
  const imgW = 180
  const imgH = 100
  
  ctx.fillStyle = '#f8f8f8'
  ctx.fillRect(10, 10, imgW, imgH)
  ctx.strokeRect(10, 10, imgW, imgH)
  
  // 如果有上传的产品图片
  if (customSettings.value?.productImage) {
    const prodImg = new Image()
    prodImg.crossOrigin = 'anonymous'
    prodImg.src = customSettings.value.productImage
    prodImg.onload = () => {
      ctx.drawImage(prodImg, 10, 10, imgW, imgH)
    }
  } else {
    // LED灯带示意图
    ctx.fillStyle = '#e0e0e0'
    ctx.fillRect(15, 25, 170, 60)
    
    // LED灯珠
    ctx.fillStyle = '#ff8c00'
    for (let i = 0; i < 14; i++) {
      ctx.fillRect(20 + i * 12, 35, 8, 40)
    }
  }
  
  // LED密度标签
  ctx.fillStyle = '#333'
  ctx.fillRect(imgW - 55, imgH - 15, 50, 18)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 8px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('120 LED/M', imgW - 30, imgH - 2)
  
  // Logo（放在产品图片右侧）
  const logoUrl = customSettings.value?.logoUrl || '/logo.jpg'
  try {
    const logoImg = new Image()
    logoImg.crossOrigin = 'anonymous'
    logoImg.src = logoUrl
    logoImg.onload = () => {
      ctx.drawImage(logoImg, imgW + 25, 10, 100, 35)
    }
  } catch (e) {
    ctx.fillStyle = '#ff6b00'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('LUMIMORE', imgW + 25, 32)
  }
  
  // 标题文字
  ctx.fillStyle = '#000'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('White 14.4W 2835 120LED 10MM', imgW + 25, 55)
  
  ctx.font = '11px Arial'
  ctx.fillText('Model: LS-SW28N120-10', imgW + 25, 72)
  
  // 5个认证图标框
  for (let i = 0; i < 5; i++) {
    const row = Math.floor(i / 3)
    const col = i % 3
    const certX = 620 + col * 35
    const certY = 15 + row * 40
    ctx.strokeStyle = '#999'
    ctx.strokeRect(certX, certY, 30, 30)
  }
  
  y = imgH + 15
  
  // 分隔线
  ctx.strokeStyle = '#999'
  ctx.beginPath()
  ctx.moveTo(10, y)
  ctx.lineTo(pageWidth - 10, y)
  ctx.stroke()
  
  y += 10
  
  // ========== Features + Dimension ==========
  
  const cellW = 390
  const cellH = 75
  
  // Features
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(10, y, cellW, 18)
  ctx.strokeRect(10, y, cellW, 18)
  ctx.fillStyle = '#000'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Features', 10 + cellW / 2, y + 13)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(10, y + 18, cellW, cellH - 18)
  ctx.strokeRect(10, y + 18, cellW, cellH - 18)
  
  ctx.fillStyle = '#000'
  ctx.font = '9px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('Super High CRI Ra98', 15, y + 35)
  ctx.fillText('Ra9>98, Ra12>98', 15, y + 48)
  ctx.fillText('120LED/M | 15W/m', 15, y + 61)
  ctx.fillText('2835', 15, y + 74)
  
  // Dimension
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(10 + cellW, y, cellW, 18)
  ctx.strokeRect(10 + cellW, y, cellW, 18)
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.fillText('Dimension', 10 + cellW + cellW / 2, y + 13)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(10 + cellW, y + 18, cellW, cellH - 18)
  ctx.strokeRect(10 + cellW, y + 18, cellW, cellH - 18)
  
  // 如果有尺寸图片
  if (customSettings.value?.dimensionImage) {
    const dimImg = new Image()
    dimImg.crossOrigin = 'anonymous'
    dimImg.src = customSettings.value.dimensionImage
    dimImg.onload = () => {
      ctx.drawImage(dimImg, 10 + cellW + 50, y + 25, cellW - 100, cellH - 35)
    }
  } else {
    // 默认尺寸示意图
    ctx.fillStyle = '#000'
    ctx.fillRect(10 + cellW + 50, y + 35, 280, 3)
    ctx.fillRect(10 + cellW + 50, y + 30, 140, 3)
    ctx.fillRect(10 + cellW + 60, y + 35, 2, 15)
    ctx.fillRect(10 + cellW + 200, y + 35, 2, 15)
    
    ctx.font = '8px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('50mm', 10 + cellW + 100, y + 42)
    ctx.fillText('12mm', 10 + cellW + 160, y + 55)
    ctx.fillText('16.6mm', 10 + cellW + 130, y + 68)
  }
  
  y += cellH + 5
  
  // 分隔线
  ctx.strokeStyle = '#999'
  ctx.beginPath()
  ctx.moveTo(10, y)
  ctx.lineTo(pageWidth - 10, y)
  ctx.stroke()
  
  y += 10
  
  // ========== Product Setup + Light Engine ==========
  
  // Product Setup
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(10, y, cellW, 18)
  ctx.strokeRect(10, y, cellW, 18)
  ctx.fillStyle = '#000'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Product Setup', 10 + cellW / 2, y + 13)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(10, y + 18, cellW, cellH - 18)
  ctx.strokeRect(10, y + 18, cellW, cellH - 18)
  
  ctx.fillStyle = '#000'
  ctx.font = '9px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('Category: LumStrip', 15, y + 35)
  ctx.fillText('Level: Core', 15, y + 48)
  ctx.fillText('Spectrum: White', 15, y + 61)
  
  // Light Engine
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(10 + cellW, y, cellW, 18)
  ctx.strokeRect(10 + cellW, y, cellW, 18)
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.fillText('Light Engine', 10 + cellW + cellW / 2, y + 13)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(10 + cellW, y + 18, cellW, cellH - 18)
  ctx.strokeRect(10 + cellW, y + 18, cellW, cellH - 18)
  
  ctx.fillStyle = '#000'
  ctx.font = '9px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('Category: LumStrip', 10 + cellW + 5, y + 35)
  ctx.fillText('Level: Core', 10 + cellW + 5, y + 48)
  ctx.fillText('Spectrum: White', 10 + cellW + 5, y + 61)
  
  y += cellH + 5
  
  // 分隔线
  ctx.strokeStyle = '#999'
  ctx.beginPath()
  ctx.moveTo(10, y)
  ctx.lineTo(pageWidth - 10, y)
  ctx.stroke()
  
  y += 10
  
  // ========== 四列参数：Electrical + Photometric + Features + Remark ==========
  
  const quadW = 195
  
  // 表头
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(10, y, quadW * 4, 18)
  ctx.strokeRect(10, y, quadW * 4, 18)
  
  // 竖线
  ctx.beginPath()
  for (let i = 1; i < 4; i++) {
    ctx.moveTo(10 + quadW * i, y)
    ctx.lineTo(10 + quadW * i, y + 95)
  }
  ctx.stroke()
  
  ctx.fillStyle = '#000'
  ctx.font = 'bold 9px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Electrical', 10 + quadW * 0.5, y + 13)
  ctx.fillText('Photometric', 10 + quadW * 1.5, y + 13)
  ctx.fillText('Features', 10 + quadW * 2.5, y + 13)
  ctx.fillText('Remark', 10 + quadW * 3.5, y + 13)
  
  // 内容
  ctx.fillStyle = '#fff'
  ctx.fillRect(10, y + 18, quadW * 4, 77)
  ctx.strokeRect(10, y + 18, quadW * 4, 77)
  
  // 竖线
  ctx.beginPath()
  for (let i = 1; i < 4; i++) {
    ctx.moveTo(10 + quadW * i, y + 18)
    ctx.lineTo(10 + quadW * i, y + 95)
  }
  ctx.stroke()
  
  ctx.fillStyle = '#000'
  ctx.font = '8px Arial'
  ctx.textAlign = 'left'
  
  // Electrical
  ctx.fillText('Category: LumStrip', 15, y + 35)
  ctx.fillText('Level: Core', 15, y + 50)
  
  // Photometric - 6行
  ctx.fillText('Category: LumStrip', 10 + quadW + 5, y + 30)
  ctx.fillText('Level: Core', 10 + quadW + 5, y + 45)
  ctx.fillText('Spectrum: White', 10 + quadW + 5, y + 60)
  ctx.fillText('Category: LumStrip', 10 + quadW + 5, y + 75)
  ctx.fillText('Level: Core', 10 + quadW + 5, y + 90)
  
  // Features - 3行
  ctx.fillText('Category: LumStrip', 10 + quadW * 2 + 5, y + 35)
  ctx.fillText('Level: Core', 10 + quadW * 2 + 5, y + 50)
  ctx.fillText('Spectrum: White', 10 + quadW * 2 + 5, y + 65)
  
  // Remark
  ctx.fillText('Category: LumStrip', 10 + quadW * 3 + 5, y + 35)
  ctx.fillText('Level: Core', 10 + quadW * 3 + 5, y + 50)
  ctx.fillText('Spectrum: White', 10 + quadW * 3 + 5, y + 65)
  
  y += 95
  
  // 分隔线
  ctx.strokeStyle = '#999'
  ctx.beginPath()
  ctx.moveTo(10, y)
  ctx.lineTo(pageWidth - 10, y)
  ctx.stroke()
  
  y += 10
  
  // ========== Photometric标题 + 数据表格（24行） ==========
  
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(10, y, pageWidth - 20, 18)
  ctx.strokeRect(10, y, pageWidth - 20, 18)
  ctx.fillStyle = '#000'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('Photometric', 15, y + 13)
  
  y += 18
  
  // 表头
  ctx.fillStyle = '#333'
  ctx.fillRect(10, y, pageWidth - 20, 20)
  
  // 列宽比例: Model:Power:CCT:CRI:Lumen:Efficacy = 35:12:10:10:15:18
  const colWidths = [
    { title: 'Model', w: Math.floor((pageWidth - 20) * 0.35) },
    { title: 'Power', w: Math.floor((pageWidth - 20) * 0.12) },
    { title: 'CCT', w: Math.floor((pageWidth - 20) * 0.10) },
    { title: 'CRI', w: Math.floor((pageWidth - 20) * 0.10) },
    { title: 'Lumen', w: Math.floor((pageWidth - 20) * 0.15) },
    { title: 'Efficacy', w: (pageWidth - 20) - Math.floor((pageWidth - 20) * 0.35) - Math.floor((pageWidth - 20) * 0.12) - Math.floor((pageWidth - 20) * 0.10) - Math.floor((pageWidth - 20) * 0.10) - Math.floor((pageWidth - 20) * 0.15) }
  ]
  
  let colX = 10
  colWidths.forEach((col) => {
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(col.title, colX + col.w / 2, y + 14)
    colX += col.w
  })
  
  // 竖线
  ctx.strokeStyle = '#555'
  colX = 10
  ctx.beginPath()
  colWidths.forEach((col, idx) => {
    if (idx < colWidths.length - 1) {
      ctx.moveTo(colX + col.w, y)
      ctx.lineTo(colX + col.w, y + 20)
    }
    colX += col.w
  })
  ctx.stroke()
  
  y += 20
  
  // 数据行 - 24行（原图数据）
  const rowHeight = 18
  
  // 计算每列位置
  const cols = [
    { x: 10, w: colWidths[0].w },
    { x: 10 + colWidths[0].w, w: colWidths[1].w },
    { x: 10 + colWidths[0].w + colWidths[1].w, w: colWidths[2].w },
    { x: 10 + colWidths[0].w + colWidths[1].w + colWidths[2].w, w: colWidths[3].w },
    { x: 10 + colWidths[0].w + colWidths[1].w + colWidths[2].w + colWidths[3].w, w: colWidths[4].w },
    { x: 10 + colWidths[0].w + colWidths[1].w + colWidths[2].w + colWidths[3].w + colWidths[4].w, w: colWidths[5].w }
  ]
  
  // 原图24行数据
  const dataRows = [
    { power: '9.6W/m', cct: '2700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '9.6W/m', cct: '3000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '9.6W/m', cct: '3500K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '9.6W/m', cct: '4000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '9.6W/m', cct: '5000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '9.6W/m', cct: '5700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '9.6W/m', cct: '2700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '2700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '3000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '3500K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '4000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '5000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '5700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '2700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '3000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '3500K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '4000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '5000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '5700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '2700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '3000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '3500K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '4000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '5000K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' },
    { power: '15W/m', cct: '5700K', cri: 'Ra90+', lumen: '1200lm/m', efficacy: '80lm/W' }
  ]
  
  dataRows.forEach((row) => {
    ctx.fillStyle = '#fff'
    ctx.fillRect(10, y, pageWidth - 20, rowHeight)
    ctx.strokeStyle = '#555'
    ctx.strokeRect(10, y, pageWidth - 20, rowHeight)
    
    // 竖线
    ctx.beginPath()
    cols.forEach((col, i) => {
      if (i < cols.length - 1) {
        ctx.moveTo(col.x + col.w, y)
        ctx.lineTo(col.x + col.w, y + rowHeight)
      }
    })
    ctx.stroke()
    
    ctx.fillStyle = '#000'
    ctx.font = '8px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('LS-SW28N120-2790-2408-100', cols[0].x + cols[0].w / 2, y + 12)
    ctx.fillText(row.power, cols[1].x + cols[1].w / 2, y + 12)
    ctx.fillText(row.cct, cols[2].x + cols[2].w / 2, y + 12)
    ctx.fillText(row.cri, cols[3].x + cols[3].w / 2, y + 12)
    ctx.fillText(row.lumen, cols[4].x + cols[4].w / 2, y + 12)
    ctx.fillText(row.efficacy, cols[5].x + cols[5].w / 2, y + 12)
    
    y += rowHeight
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

/* ========== 规格书样式 - 按照原图排版 A4比例 ========== */
.spec-document {
  background: white;
  padding: 0;
  font-family: Arial, sans-serif;
  width: 800px;
  min-height: 1130px;
  border: 1px solid #333;
}

/* 顶部标题区 */
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
  width: 190px;
  height: 90px;
  background: repeating-linear-gradient(
    90deg,
    #ff8c00 0px,
    #ff8c00 8px,
    #e0e0e0 8px,
    #e0e0e0 12px
  );
  background-size: 12px 90px;
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

/* 第2行：产品图片 + Features + Dimension + Product Setup + Light Engine */
.spec-row2 {
  display: flex;
  border-bottom: 1px solid #999;
}

.spec-row2 .spec-product-img {
  width: 180px;
  height: 110px;
  background: #f8f8f8;
  border: 1px solid #333;
  border-top: none;
  flex-shrink: 0;
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
  color: #000;
  border: 1px solid #333;
  border-bottom: none;
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
</style>
