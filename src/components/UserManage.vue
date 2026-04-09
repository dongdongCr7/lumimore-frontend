<template>
  <div class="user-manage">
    <el-card class="section-card">
      <template #header>
        <div class="section-header">
          <span>用户列表</span>
          <el-button type="primary" size="small" @click="showAddUserDialog">
            <el-icon><Plus /></el-icon> 添加用户
          </el-button>
        </div>
      </template>
      
      <el-table :data="users" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="roleName" label="角色">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">{{ row.roleName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限说明">
          <template #default="{ row }">
            <span class="permission-text">{{ getPermissionText(row.role) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="showEditUserDialog(row)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              text 
              @click="deleteUser(row.id)"
              :disabled="row.id === currentUserId"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog v-model="userDialogVisible" :title="editUser ? '编辑用户' : '添加用户'" width="500px">
      <el-form :model="userForm" label-width="100px" :rules="userRules" ref="formRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="!!editUser" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!editUser">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option :value="1" label="普通员工/客户">
              <div class="role-option">
                <span>普通员工/客户</span>
                <span class="role-desc">只读 + 定制规格书</span>
              </div>
            </el-option>
            <el-option :value="2" label="产品管理员">
              <div class="role-option">
                <span>产品管理员</span>
                <span class="role-desc">增删改产品</span>
              </div>
            </el-option>
            <el-option :value="3" label="系统管理员">
              <div class="role-option">
                <span>系统管理员</span>
                <span class="role-desc">增删改用户</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="角色名称">
          <el-input v-model="userForm.roleName" placeholder="请输入角色显示名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">{{ editUser ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore, type User } from '../stores/user'

const userStore = useUserStore()
const formRef = ref<FormInstance>()

const users = ref<User[]>([])
const userDialogVisible = ref(false)
const editUser = ref<User | null>(null)

const userForm = reactive({
  username: '',
  password: '',
  role: 1 as 1 | 2 | 3,
  roleName: ''
})

const userRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const roleNames: Record<number, string> = {
  1: '普通员工',
  2: '产品管理员',
  3: '系统管理员'
}

const currentUserId = computed(() => userStore.user?.id || 0)

// 模拟用户数据
const mockUserList: User[] = [
  { id: 1, username: 'admin', role: 3, roleName: '系统管理员' },
  { id: 2, username: 'manager', role: 2, roleName: '产品管理员' },
  { id: 3, username: 'user', role: 1, roleName: '普通员工' }
]

onMounted(() => {
  loadUsers()
})

const loadUsers = () => {
  // 模拟从后端加载用户列表
  users.value = [...mockUserList]
}

const getRoleType = (role: number) => {
  const types: Record<number, string> = {
    1: 'info',
    2: 'warning',
    3: 'danger'
  }
  return types[role] || 'info'
}

const getPermissionText = (role: number) => {
  const texts: Record<number, string> = {
    1: '查看产品、定制规格书',
    2: '增删改查产品、定制规格书',
    3: '增删改查用户、增删改查产品、定制规格书'
  }
  return texts[role] || ''
}

const showAddUserDialog = () => {
  editUser.value = null
  userForm.username = ''
  userForm.password = ''
  userForm.role = 1
  userForm.roleName = ''
  userDialogVisible.value = true
}

const showEditUserDialog = (user: User) => {
  editUser.value = user
  userForm.username = user.username
  userForm.password = ''
  userForm.role = user.role
  userForm.roleName = user.roleName
  userDialogVisible.value = true
}

const saveUser = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (!valid) return
    
    if (editUser.value) {
      // 编辑用户
      const index = users.value.findIndex(u => u.id === editUser.value!.id)
      if (index > -1) {
        users.value[index] = {
          ...users.value[index],
          role: userForm.role,
          roleName: userForm.roleName || roleNames[userForm.role]
        }
      }
      ElMessage.success('用户信息已更新')
    } else {
      // 添加用户
      const newUser: User = {
        id: Math.max(...users.value.map(u => u.id), 0) + 1,
        username: userForm.username,
        role: userForm.role,
        roleName: userForm.roleName || roleNames[userForm.role]
      }
      users.value.push(newUser)
      ElMessage.success('用户添加成功')
    }
    
    userDialogVisible.value = false
  })
}

const deleteUser = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定删除该用户吗？', '提示', {
      type: 'warning'
    })
    const index = users.value.findIndex(u => u.id === id)
    if (index > -1) {
      users.value.splice(index, 1)
    }
    ElMessage.success('删除成功')
  } catch {
    // 取消
  }
}
</script>

<style scoped>
.user-manage {
  max-width: 1200px;
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

.permission-text {
  font-size: 12px;
  color: #909399;
}

.role-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.role-desc {
  font-size: 12px;
  color: #909399;
}
</style>
