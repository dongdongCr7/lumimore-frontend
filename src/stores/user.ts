import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  id: number
  username: string
  role: 1 | 2 | 3 // 1: 普通员工/客户, 2: 产品管理员, 3: 系统管理员
  roleName: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string>('')

  const rolePermissions = {
    1: ['view', 'spec'],
    2: ['view', 'spec', 'product_crud'],
    3: ['view', 'spec', 'product_crud', 'user_crud']
  }

  function setUser(userData: User, userToken: string) {
    user.value = userData
    token.value = userToken
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', userToken)
  }

  function loadFromStorage() {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')
    if (storedUser && storedToken) {
      user.value = JSON.parse(storedUser)
      token.value = storedToken
    }
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  function hasPermission(permission: string): boolean {
    if (!user.value) return false
    return rolePermissions[user.value.role]?.includes(permission) || false
  }

  function canManageProducts(): boolean {
    return hasPermission('product_crud')
  }

  function canManageUsers(): boolean {
    return hasPermission('user_crud')
  }

  function canCustomizeSpec(): boolean {
    return hasPermission('spec')
  }

  return {
    user,
    token,
    setUser,
    loadFromStorage,
    logout,
    hasPermission,
    canManageProducts,
    canManageUsers,
    canCustomizeSpec
  }
})
