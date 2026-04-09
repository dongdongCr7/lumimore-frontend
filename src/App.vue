<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'

const userStore = useUserStore()

onMounted(() => {
  userStore.loadFromStorage()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

/* Element Plus 主题覆盖 - LUMIMORE 橙色 */
:root {
  --el-color-primary: #ff6b00;
  --el-color-primary-light-3: #ff8533;
  --el-color-primary-light-5: #ffa366;
  --el-color-primary-light-7: #ffbf99;
  --el-color-primary-light-8: #ffd1b3;
  --el-color-primary-light-9: #ffe6cc;
  --el-color-primary-dark-2: #e65c00;
}
</style>
