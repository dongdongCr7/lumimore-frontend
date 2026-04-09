<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="title">产品管理系统</h1>
      <el-form ref="formRef" :model="form" :rules="rules" class="login-form">
        <el-form-item prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="密码"
            prefix-icon="Lock"
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            :loading="loading" 
            class="login-btn"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="demo-account">
        <p>测试账号：</p>
        <el-tag>admin / 123456 (权限3)</el-tag>
        <el-tag type="success">manager / 123456 (权限2)</el-tag>
        <el-tag type="info">user / 123456 (权限1)</el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore, type User } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

// 模拟用户数据
const mockUsers: Record<string, User & { password: string }> = {
  admin: { id: 1, username: 'admin', password: '123456', role: 3, roleName: '系统管理员' },
  manager: { id: 2, username: 'manager', password: '123456', role: 2, roleName: '产品管理员' },
  user: { id: 3, username: 'user', password: '123456', role: 1, roleName: '普通员工' }
}

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    
    // 模拟登录验证
    setTimeout(() => {
      const userData = mockUsers[form.username]
      
      if (userData && userData.password === form.password) {
        const { password, ...user } = userData
        userStore.setUser(user, 'mock-token-' + Date.now())
        ElMessage.success(`欢迎，${user.roleName}！`)
        router.push('/main')
      } else {
        ElMessage.error('用户名或密码错误')
      }
      
      loading.value = false
    }, 500)
  })
}
</script>

<style scoped>
.login-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
}

.login-form {
  margin-top: 20px;
}

.login-btn {
  width: 100%;
}

.demo-account {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: center;
}

.demo-account p {
  color: #666;
  font-size: 12px;
  margin-bottom: 10px;
}

.demo-account .el-tag {
  margin: 4px;
}
</style>
