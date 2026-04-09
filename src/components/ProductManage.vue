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
        <!-- 顶部区域：产品图片 + 产品信息 + 认证图标 -->
        <div class="spec-header-new">
          <!-- 左侧产品图片 -->
          <div class="spec-product-image">
            <div class="product-img-placeholder">
              <div class="led-strip-visual">
                <div class="led-strip-body"></div>
              </div>
            </div>
            <div class="led-density-badge">120 LED/M</div>
          </div>
          
          <!-- 中间产品信息 -->
          <div class="spec-product-info-new">
            <div class="spec-product-title-new">{{ currentProduct?.name }}</div>
            <div class="spec-product-model-new">Model: {{ currentProduct?.name?.split(' ').pop() || 'N/A' }}</div>
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

        <!-- 中上区域三组表格 -->
        <div class="spec-mid-section">
          <!-- 左侧 Features + Dimension -->
          <div class="spec-left-tables">
            <!-- Features表格 -->
            <table class="spec-mini-table features-table">
              <tr>
                <td class="mini-table-title">Features</td>
              </tr>
              <tr>
                <td class="mini-table-content">
                  <div class="feature-item">Super High CRI {{ currentProduct?.specs['显色指数'] || 'Ra98+' }}</div>
                  <div class="feature-item">Ra9 {{ currentProduct?.specs['R9值'] || '>98' }}, Rg12 {{ currentProduct?.specs['R12值'] || '>98' }}</div>
                  <div class="feature-item">{{ currentProduct?.specs['LED密度'] || '120LED/M' }} | {{ currentProduct?.specs['功率'] || '15W/m' }}</div>
                  <div class="feature-item">{{ currentProduct?.specs['LED类型'] || '2835' }}</div>
                  <div class="feature-item">输入电压: {{ currentProduct?.specs['输入电压'] || '24V DC' }}</div>
                  <div class="feature-item">裁剪单元: {{ currentProduct?.specs['裁剪单元'] || '50mm' }}</div>
                  <div class="feature-item">IP等级: {{ currentProduct?.specs['IP等级'] || 'IP20' }}</div>
                </td>
              </tr>
            </table>
            
            <!-- Dimension尺寸图 -->
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
                    <div class="dimension-label">总宽: {{ currentProduct?.specs['总宽度'] || '16.6mm' }}</div>
                    <div class="dimension-label base-label">基板: {{ currentProduct?.specs['基板宽度'] || '12mm' }}</div>
                    <div class="dimension-label led-label">间距: {{ currentProduct?.specs['裁剪单元'] || '50mm' }}</div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- 右侧参数组 -->
          <div class="spec-right-tables">
            <!-- Product Setup -->
            <table class="spec-mini-table setup-table">
              <tr>
                <td class="mini-table-title">Product Setup</td>
              </tr>
              <tr>
                <td class="mini-table-content">
                  <div class="param-row"><span class="param-label">Category</span><span class="param-value">{{ getCategoryName(currentProduct?.categoryId || 0) }}</span></div>
                  <div class="param-row"><span class="param-label">Level</span><span class="param-value">Core</span></div>
                  <div class="param-row"><span class="param-label">Spectrum</span><span class="param-value">White</span></div>
                </td>
              </tr>
            </table>
            
            <!-- Light Engine -->
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
            
            <!-- Electrical / Photometric / Features -->
            <table class="spec-mini-table combined-table">
              <tr>
                <td class="mini-table-title">Electrical</td>
                <td class="mini-table-title">Photometric</td>
                <td class="mini-table-title">Features</td>
                <td class="mini-table-title">Remark</td>
              </tr>
              <tr>
                <td class="mini-table-content">
                  <div class="param-row"><span class="param-label">Category</span><span class="param-value">LumStrip</span></div>
                  <div class="param-row"><span class="param-label">Level</span><span class="param-value">Core</span></div>
                </td>
                <td class="mini-table-content">
                  <div class="param-row"><span class="param-label">Category</span><span class="param-value">LumStrip</span></div>
                  <div class="param-row"><span class="param-label">Level</span><span class="param-value">Core</span></div>
                  <div class="param-row"><span class="param-label">Spectrum</span><span class="param-value">White</span></div>
                </td>
                <td class="mini-table-content">
                  <div class="param-row"><span class="param-label">Category</span><span class="param-value">LumStrip</span></div>
                  <div class="param-row"><span class="param-label">Level</span><span class="param-value">Core</span></div>
                </td>
                <td class="mini-table-content"></td>
              </tr>
            </table>
          </div>
        </div>

        <!-- 底部Photometric参数表格 -->
        <div class="spec-photometric-section">
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
              <!-- 9.6W/m Section -->
              <tr class="section-header">
                <td colspan="6">9.6W/m</td>
              </tr>
              <tr v-for="cct in ['2200K', '2400K', '2700K', '3000K', '3500K', '4000K', '5000K', '5700K', '6500K']" :key="'96-'+cct">
                <td>LS-SW28N60-{{cct.replace('K','')}}-2408-100</td>
                <td>9.6W/m</td>
                <td>{{cct}}</td>
                <td>{{ currentProduct?.specs['显色指数'] || 'Ra90+' }}</td>
                <td>{{ currentProduct?.specs['光通量'] || '960lm/m' }}</td>
                <td>{{ currentProduct?.specs['能效'] || '100lm/W' }}</td>
              </tr>
              <!-- 15W/m Section -->
              <tr class="section-header">
                <td colspan="6">15W/m</td>
              </tr>
              <tr v-for="cct in ['2200K', '2400K', '2700K', '3000K', '3500K', '4000K', '5000K', '5700K', '6500K']" :key="'15-'+cct">
                <td>LS-SW28N120-{{cct.replace('K','')}}-2408-100</td>
                <td>15W/m</td>
                <td>{{cct}}</td>
                <td>{{ currentProduct?.specs['显色指数'] || 'Ra90+' }}</td>
                <td>{{ currentProduct?.specs['光通量'] || '1500lm/m' }}</td>
                <td>{{ currentProduct?.specs['能效'] || '100lm/W' }}</td>
              </tr>
              <!-- 20W/m Section -->
              <tr class="section-header">
                <td colspan="6">20W/m</td>
              </tr>
              <tr v-for="cct in ['2200K', '2400K', '2700K', '3000K', '3500K', '4000K', '5000K', '5700K', '6500K']" :key="'20-'+cct">
                <td>LS-SW28N160-{{cct.replace('K','')}}-2408-100</td>
                <td>20W/m</td>
                <td>{{cct}}</td>
                <td>{{ currentProduct?.specs['显色指数'] || 'Ra90+' }}</td>
                <td>{{ currentProduct?.specs['光通量'] || '2000lm/m' }}</td>
                <td>{{ currentProduct?.specs['能效'] || '100lm/W' }}</td>
              </tr>
            </tbody>
          </table>
          
          <!-- Additional Specs Section -->
          <div class="spec-details">
            <h4>Additional Specifications</h4>
            <div class="spec-grid">
              <div class="spec-item"><span class="spec-label">LED Type</span><span class="spec-value">{{ currentProduct?.specs['LED类型'] || '2835 SMD' }}</span></div>
              <div class="spec-item"><span class="spec-label">Input Voltage</span><span class="spec-value">{{ currentProduct?.specs['输入电压'] || '24V DC' }}</span></div>
              <div class="spec-item"><span class="spec-label">Cut Unit</span><span class="spec-value">{{ currentProduct?.specs['裁剪单元'] || '50mm' }}</span></div>
              <div class="spec-item"><span class="spec-label">IP Rating</span><span class="spec-value">{{ currentProduct?.specs['IP等级'] || 'IP20' }}</span></div>
              <div class="spec-item"><span class="spec-label">Beam Angle</span><span class="spec-value">{{ currentProduct?.specs['发光角度'] || '120°' }}</span></div>
              <div class="spec-item"><span class="spec-label">Operating Temp</span><span class="spec-value">{{ currentProduct?.specs['工作温度'] || '-20°C ~ +45°C' }}</span></div>
              <div class="spec-item"><span class="spec-label">Storage Temp</span><span class="spec-value">{{ currentProduct?.specs['储存温度'] || '-30°C ~ +70°C' }}</span></div>
              <div class="spec-item"><span class="spec-label">Lifespan</span><span class="spec-value">{{ currentProduct?.specs['寿命'] || '>50,000 hrs' }}</span></div>
              <div class="spec-item full-width"><span class="spec-label">Certifications</span><span class="spec-value">{{ currentProduct?.specs['认证'] || 'CE, RoHS' }}</span></div>
            </div>
          </div>
        </div>

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
  
  // 获取产品规格
  const specs = currentProduct.value?.specs || {}
  
  // 设置画布尺寸
  canvas.width = 850
  canvas.height = 1100
  
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  let y = 20
  
  // === 顶部区域 ===
  
  // 左侧产品图片区域
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(20, y, 130, 130)
  ctx.strokeStyle = '#ddd'
  ctx.strokeRect(20, y, 130, 130)
  
  // LED灯带示意图
  ctx.fillStyle = '#ff6b00'
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(35 + i * 14, y + 55, 10, 30)
    if (i < 7) {
      ctx.fillStyle = '#fff'
      ctx.fillRect(45 + i * 14, y + 55, 4, 30)
      ctx.fillStyle = '#ff6b00'
    }
  }
  
  // LED密度标签
  ctx.fillStyle = '#ff6b00'
  ctx.fillRect(100, y + 105, 45, 18)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 9px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(specs['LED密度'] || '120 LED/M', 122, y + 118)
  
  // 中间产品信息
  ctx.fillStyle = '#333'
  ctx.textAlign = 'left'
  ctx.font = 'bold 20px Arial'
  ctx.fillText(currentProduct.value?.name || 'LED Strip Light', 165, y + 50)
  
  ctx.font = '13px Arial'
  ctx.fillStyle = '#666'
  ctx.fillText(`Model: ${currentProduct.value?.name?.split(' ').pop() || 'N/A'}`, 165, y + 75)
  
  // 右侧认证图标框
  const certs = customSettings.value?.certifications || []
  for (let i = 0; i < 5; i++) {
    const certX = 580 + i * 50
    ctx.strokeStyle = '#ccc'
    ctx.setLineDash([3, 3])
    ctx.strokeRect(certX, y + 15, 40, 40)
    ctx.setLineDash([])
    
    if (certs[i]?.image) {
      const certImg = new Image()
      certImg.crossOrigin = 'anonymous'
      certImg.src = certs[i].image
      ctx.drawImage(certImg, certX + 2, y + 17, 36, 36)
    }
  }
  
  y += 155
  
  // === 分隔线 ===
  ctx.strokeStyle = '#ddd'
  ctx.beginPath()
  ctx.moveTo(20, y)
  ctx.lineTo(830, y)
  ctx.stroke()
  
  y += 20
  
  // === Features表格 ===
  const leftWidth = 280
  
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(20, y, leftWidth, 25)
  ctx.strokeStyle = '#ddd'
  ctx.strokeRect(20, y, leftWidth, 25)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 11px Arial'
  ctx.fillText('Features', 25, y + 17)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(20, y + 25, leftWidth, 100)
  ctx.strokeRect(20, y + 25, leftWidth, 100)
  ctx.fillStyle = '#333'
  ctx.font = '11px Arial'
  
  const features = [
    `Super High CRI ${specs['显色指数'] || 'Ra98+'}`,
    `Ra9 ${specs['R9值'] || '>98'}, Rg12 ${specs['R12值'] || '>98'}`,
    `${specs['LED密度'] || '120LED/M'} | ${specs['功率'] || '15W/m'}`,
    specs['LED类型'] || '2835',
    `Input: ${specs['输入电压'] || '24V DC'}`,
    `Cut Unit: ${specs['裁剪单元'] || '50mm'}`,
    `IP Rating: ${specs['IP等级'] || 'IP20'}`,
    `Angle: ${specs['发光角度'] || '120°'}`
  ]
  
  features.forEach((text, i) => {
    ctx.fillText(text, 25, y + 42 + i * 12)
  })
  
  y += 130
  
  // Dimension表格
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(20, y, leftWidth, 25)
  ctx.strokeStyle = '#ddd'
  ctx.strokeRect(20, y, leftWidth, 25)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 11px Arial'
  ctx.fillText('Dimension', 25, y + 17)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(20, y + 25, leftWidth, 70)
  ctx.strokeRect(20, y + 25, leftWidth, 70)
  
  // 尺寸示意图
  ctx.fillStyle = '#333'
  ctx.fillRect(30, y + 50, 220, 2)
  ctx.fillRect(30, y + 65, 165, 2)
  ctx.fillRect(80, y + 45, 2, 15)
  
  ctx.fillStyle = '#666'
  ctx.font = '9px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`Total: ${specs['总宽度'] || '16.6mm'}`, 140, y + 47)
  ctx.fillText(`Base: ${specs['基板宽度'] || '12mm'}`, 112, y + 62)
  ctx.fillText(`Space: ${specs['裁剪单元'] || '50mm'}`, 82, y + 75)
  ctx.textAlign = 'left'
  
  y -= 110
  
  // === Product Setup & Light Engine ===
  const rightX = 320
  
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(rightX, y, 235, 25)
  ctx.strokeStyle = '#ddd'
  ctx.strokeRect(rightX, y, 235, 25)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 11px Arial'
  ctx.fillText('Product Setup', rightX + 5, y + 17)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(rightX, y + 25, 235, 60)
  ctx.strokeRect(rightX, y + 25, 235, 60)
  ctx.fillStyle = '#333'
  ctx.font = '11px Arial'
  ctx.fillText('Category:', rightX + 5, y + 45)
  ctx.fillText('LumStrip', rightX + 80, y + 45)
  ctx.fillText('Level:', rightX + 5, y + 60)
  ctx.fillText('Core', rightX + 80, y + 60)
  ctx.fillText('Spectrum:', rightX + 5, y + 75)
  ctx.fillText('White', rightX + 80, y + 75)
  
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(rightX + 240, y, 235, 25)
  ctx.strokeStyle = '#ddd'
  ctx.strokeRect(rightX + 240, y, 235, 25)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 11px Arial'
  ctx.fillText('Light Engine', rightX + 245, y + 17)
  
  ctx.fillStyle = '#fff'
  ctx.fillRect(rightX + 240, y + 25, 235, 60)
  ctx.strokeRect(rightX + 240, y + 25, 235, 60)
  ctx.fillStyle = '#333'
  ctx.font = '11px Arial'
  ctx.fillText('Category:', rightX + 245, y + 45)
  ctx.fillText('LumStrip', rightX + 320, y + 45)
  ctx.fillText('Level:', rightX + 245, y + 60)
  ctx.fillText('Core', rightX + 320, y + 60)
  ctx.fillText('Spectrum:', rightX + 245, y + 75)
  ctx.fillText('White', rightX + 320, y + 75)
  
  y += 100
  
  // === Photometric参数表格 ===
  ctx.fillStyle = '#333'
  ctx.fillRect(20, y, 810, 28)
  
  const columns = [
    { title: 'Model', x: 20, w: 240 },
    { title: 'Power', x: 260, w: 100 },
    { title: 'CCT', x: 360, w: 90 },
    { title: 'CRI', x: 450, w: 90 },
    { title: 'Lumen', x: 540, w: 130 },
    { title: 'Efficacy', x: 670, w: 160 }
  ]
  
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 11px Arial'
  ctx.textAlign = 'center'
  columns.forEach(col => {
    ctx.fillText(col.title, col.x + col.w / 2, y + 18)
  })
  
  ctx.strokeStyle = '#555'
  columns.forEach(col => {
    ctx.beginPath()
    ctx.moveTo(col.x + col.w, y)
    ctx.lineTo(col.x + col.w, y + 28)
    ctx.stroke()
  })
  
  y += 28
  
  // 数据行生成函数
  const drawPhotometricSection = (power: string, ledDensity: string, startY: number) => {
    let currentY = startY
    
    // 分组标题
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(20, currentY, 810, 22)
    ctx.strokeStyle = '#ddd'
    ctx.strokeRect(20, currentY, 810, 22)
    ctx.fillStyle = '#333'
    ctx.font = 'bold 11px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(power, 425, currentY + 15)
    currentY += 22
    
    const ccts = ['2200K', '2400K', '2700K', '3000K', '3500K', '4000', '5000K', '5700K', '6500K']
    
    ccts.forEach((cct, i) => {
      const model = `LS-SW28N${ledDensity}-${cct.replace('K','')}-2408-100`
      const lumen = power === '9.6W/m' ? '960lm/m' : power === '15W/m' ? '1500lm/m' : '2000lm/m'
      
      if (i % 2 === 1) {
        ctx.fillStyle = '#fafafa'
        ctx.fillRect(20, currentY, 810, 20)
      }
      ctx.strokeStyle = '#ddd'
      ctx.strokeRect(20, currentY, 810, 20)
      
      // 画竖线
      ctx.beginPath()
      columns.forEach((col, j) => {
        if (j < columns.length - 1) {
          ctx.moveTo(col.x + col.w, currentY)
          ctx.lineTo(col.x + col.w, currentY + 20)
        }
      })
      ctx.stroke()
      
      ctx.fillStyle = '#333'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(model, 140, currentY + 14)
      ctx.fillText(power, 310, currentY + 14)
      ctx.fillText(cct, 405, currentY + 14)
      ctx.fillText(specs['显色指数'] || 'Ra90+', 495, currentY + 14)
      ctx.fillText(lumen, 605, currentY + 14)
      ctx.fillText(specs['能效'] || '100lm/W', 750, currentY + 14)
      
      currentY += 20
    })
    
    return currentY
  }
  
  // 绘制三个功率段
  y = drawPhotometricSection('9.6W/m', '60', y)
  y = drawPhotometricSection('15W/m', '120', y)
  y = drawPhotometricSection('20W/m', '160', y)
  
  // === Additional Specifications ===
  y += 15
  
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(20, y, 810, 25)
  ctx.strokeStyle = '#ddd'
  ctx.strokeRect(20, y, 810, 25)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('Additional Specifications', 25, y + 17)
  
  y += 25
  
  const addSpecs = [
    ['LED Type', specs['LED类型'] || '2835 SMD'],
    ['Input Voltage', specs['输入电压'] || '24V DC'],
    ['Cut Unit', specs['裁剪单元'] || '50mm'],
    ['IP Rating', specs['IP等级'] || 'IP20'],
    ['Beam Angle', specs['发光角度'] || '120°'],
    ['Operating Temp', specs['工作温度'] || '-20°C ~ +45°C'],
    ['Storage Temp', specs['储存温度'] || '-30°C ~ +70°C'],
    ['Lifespan', specs['寿命'] || '>50,000 hrs']
  ]
  
  // 第一行
  for (let i = 0; i < 4; i++) {
    const x = 20 + i * 200
    ctx.fillStyle = '#fff'
    ctx.fillRect(x, y, 195, 45)
    ctx.strokeStyle = '#eee'
    ctx.strokeRect(x, y, 195, 45)
    
    ctx.fillStyle = '#666'
    ctx.font = '9px Arial'
    ctx.fillText(addSpecs[i][0], x + 10, y + 18)
    ctx.fillStyle = '#333'
    ctx.font = '11px Arial'
    ctx.fillText(addSpecs[i][1], x + 10, y + 35)
  }
  
  y += 50
  
  // 第二行
  for (let i = 4; i < 8; i++) {
    const x = 20 + (i - 4) * 200
    ctx.fillStyle = '#fff'
    ctx.fillRect(x, y, 195, 45)
    ctx.strokeStyle = '#eee'
    ctx.strokeRect(x, y, 195, 45)
    
    ctx.fillStyle = '#666'
    ctx.font = '9px Arial'
    ctx.fillText(addSpecs[i][0], x + 10, y + 18)
    ctx.fillStyle = '#333'
    ctx.font = '11px Arial'
    ctx.fillText(addSpecs[i][1], x + 10, y + 35)
  }
  
  y += 50
  
  // Certifications
  ctx.fillStyle = '#fff'
  ctx.fillRect(20, y, 810, 45)
  ctx.strokeStyle = '#eee'
  ctx.strokeRect(20, y, 810, 45)
  
  ctx.fillStyle = '#666'
  ctx.font = '9px Arial'
  ctx.fillText('Certifications', 30, y + 18)
  ctx.fillStyle = '#333'
  ctx.font = '11px Arial'
  ctx.fillText(specs['认证'] || 'CE, RoHS', 30, y + 35)
  
  // 页脚
  ctx.fillStyle = '#999'
  ctx.font = '10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(customSettings.value?.footer || 'LUMIMORE Lighting Technology Co., Ltd.', 425, 1080)
  
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
}

/* 顶部区域：产品图片 + 产品信息 + 认证图标 */
.spec-header-new {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ddd;
  margin-bottom: 15px;
}

.spec-product-image {
  width: 140px;
  height: 140px;
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
  height: 40px;
  background: linear-gradient(to right, #ff6b00 25%, #fff 25%, #fff 50%, #ff6b00 50%, #ff6b00 75%, #fff 75%);
  background-size: 16px 40px;
  border-radius: 2px;
  border: 1px solid #ccc;
}

.led-density-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: #ff6b00;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
}

.spec-product-info-new {
  flex: 1;
  min-width: 0;
}

.spec-product-title-new {
  font-size: 22px;
  font-weight: bold;
  color: #333;
  line-height: 1.3;
}

.spec-product-model-new {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.spec-certifications-new {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.cert-box {
  width: 45px;
  height: 45px;
  border: 2px dashed #ccc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.cert-box.has-cert {
  border: 1px solid #ddd;
  background: white;
}

.cert-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 中上区域三组表格 */
.spec-mid-section {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.spec-left-tables {
  width: 35%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spec-right-tables {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spec-mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.mini-table-title {
  background: #f5f7fa;
  font-weight: bold;
  color: #333;
  padding: 6px 10px;
  border: 1px solid #ddd;
  text-align: left;
}

.mini-table-content {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-top: none;
  background: white;
  vertical-align: top;
}

.feature-item {
  color: #333;
  line-height: 1.6;
}

.param-row {
  display: flex;
  justify-content: space-between;
  line-height: 1.8;
}

.param-label {
  color: #666;
}

.param-value {
  color: #333;
  font-weight: 500;
}

/* Dimension尺寸图 */
.dimension-content {
  padding: 15px;
}

.dimension-diagram {
  position: relative;
  width: 100%;
  height: 80px;
}

.dimension-line {
  position: absolute;
  background: #333;
}

.dimension-width {
  width: 100%;
  height: 3px;
  top: 20px;
  left: 0;
}

.dimension-base {
  width: 75%;
  height: 3px;
  top: 35px;
  left: 0;
}

.dimension-leds {
  width: 2px;
  height: 15px;
  top: 28px;
  left: 20%;
}

.dimension-label {
  position: absolute;
  font-size: 9px;
  color: #666;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
}

.base-label {
  top: 38px;
  left: 38%;
}

.led-label {
  top: 48px;
  left: 22%;
}

.features-table {
  margin-bottom: 0;
}

.dimension-table {
  margin-bottom: 0;
}

.setup-table,
.engine-table {
  margin-bottom: 0;
}

.combined-table .mini-table-title,
.combined-table .mini-table-content {
  width: 25%;
  display: table-cell;
}

/* 底部Photometric表格 */
.spec-photometric-section {
  margin-bottom: 15px;
}

.photometric-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.photometric-table th,
.photometric-table td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: center;
}

.photometric-table th {
  background: #333;
  color: white;
  font-weight: bold;
}

.photometric-table .col-model {
  width: 30%;
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
  width: 17%;
}

.photometric-table .col-efficacy {
  width: 17%;
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

/* Additional Specifications Section */
.spec-details {
  margin-top: 20px;
  padding: 15px;
  background: #fafafa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.spec-details h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

.spec-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.spec-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background: white;
  border: 1px solid #eee;
  border-radius: 4px;
}

.spec-item.full-width {
  grid-column: span 4;
}

.spec-label {
  font-size: 10px;
  color: #666;
  margin-bottom: 4px;
}

.spec-value {
  font-size: 12px;
  color: #333;
  font-weight: 500;
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
