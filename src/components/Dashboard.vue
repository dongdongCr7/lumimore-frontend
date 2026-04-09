<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="chart-card">
          <h3>各分类产品数量统计</h3>
          <div class="chart-container">
            <v-chart :option="chartOption" autoresize style="height: 400px" />
          </div>
        </div>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="8" v-for="cat in productStore.categories" :key="cat.id">
        <el-card shadow="hover" class="category-card" @click="goToProduct(cat.id)">
          <template #header>
            <div class="card-header">
              <span>{{ cat.name }}</span>
              <el-tag type="primary">{{ productStore.getProductCountByCategory(cat.id) }} 个</el-tag>
            </div>
          </template>
          <div class="category-info">
            <p class="description">{{ cat.description }}</p>
            <el-divider />
            <p class="series-count">
              <el-icon><Collection /></el-icon>
              包含 {{ getSeriesCount(cat.id) }} 个系列
            </p>
            <p class="click-tip">点击查看该分类产品</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useProductStore } from '../stores/product'

const emit = defineEmits<{
  (e: 'go-to-product', categoryId: number): void
}>()

use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent])

const productStore = useProductStore()

const goToProduct = (categoryId: number) => {
  emit('go-to-product', categoryId)
}

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: '产品数量',
      type: 'pie',
      radius: '60%',
      data: productStore.chartData,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      label: {
        formatter: '{b}: {c}'
      }
    }
  ],
  color: ['#ff6b00', '#ff8c00', '#ffa500', '#ffb84d', '#e65c00', '#cc5200', '#ff9933', '#804000']
}))

const getSeriesCount = (categoryId: number) => {
  return productStore.seriesList.filter(s => s.categoryId === categoryId).length
}
</script>

<style scoped>
.dashboard {
  height: 100%;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #333;
}

.chart-container {
  display: flex;
  justify-content: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-info {
  color: #666;
}

.description {
  font-size: 14px;
  margin: 0;
}

.series-count {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.category-card {
  cursor: pointer;
  transition: all 0.3s;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(255, 107, 0, 0.2);
}

.click-tip {
  text-align: center;
  color: #ff6b00;
  font-size: 12px;
  margin: 10px 0 0 0;
}
</style>
