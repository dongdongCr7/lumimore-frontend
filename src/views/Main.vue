<template>
  <div class="main-container">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="header-left">
        <h2>产品管理系统</h2>
      </div>
      <div class="header-right">
        <span class="role-tag" :type="roleType">
          {{ userStore.user?.roleName }}
        </span>
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-icon><User /></el-icon>
            {{ userStore.user?.username }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Tab 导航 -->
    <div class="tab-nav">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="仪表盘" name="dashboard"></el-tab-pane>
        <el-tab-pane label="产品管理" name="product"></el-tab-pane>
        <el-tab-pane label="用户管理" name="user" v-if="userStore.canManageUsers()"></el-tab-pane>
      </el-tabs>
    </div>

    <!-- 内容区域 -->
    <div class="content">
      <!-- 仪表盘 -->
      <Dashboard v-if="activeTab === 'dashboard'" />
      
      <!-- 产品管理 -->
      <ProductManage v-else-if="activeTab === 'product'" />
      
      <!-- 用户管理 -->
      <UserManage v-else-if="activeTab === 'user'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import Dashboard from '../components/Dashboard.vue'
import ProductManage from '../components/ProductManage.vue'
import UserManage from '../components/UserManage.vue'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('dashboard')

const roleType = computed(() => {
  const role = userStore.user?.role
  if (role === 3) return 'danger'
  if (role === 2) return 'warning'
  return 'info'
})

const handleTabChange = (tab: string) => {
  console.log('切换到:', tab)
}

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<style scoped>
.main-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.header {
  height: 60px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left h2 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.role-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #606266;
}

.user-info:hover {
  color: #409eff;
}

.tab-nav {
  background: white;
  padding: 0 24px;
  border-bottom: 1px solid #e4e7ed;
}

.tab-nav :deep(.el-tabs__header) {
  margin: 0;
}

.content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}
</style>
