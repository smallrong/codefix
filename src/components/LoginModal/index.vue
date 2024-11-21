<template>
  <NModal
    :show="show"
    :mask-closable="false"
    :close-on-esc="false"
    transform-origin="center"
    class="login-modal-custom"
    @update:show="$emit('update:show', $event)"
  >
    <div class="login-wrapper-custom">
      <div class="login-header-custom">
        <h2>用户登录</h2>
        <button class="close-button-custom" @click="$emit('update:show', false)">×</button>
      </div>
      <div class="login-content-custom">
        <PhoneLogin
          theme="dark"
          @login-success="handleLoginSuccess"
          @login-error="$emit('login-error', $event)"
        />
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { NModal } from 'naive-ui'
import PhoneLogin from '@/Login/index.vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'login-success', token: string): void
  (e: 'login-error', error: any): void
}>()

const handleLoginSuccess = (token: string) => {
  emit('login-success', token)
  emit('update:show', false)
}
</script>

<style scoped>
.login-modal-custom {
  --dialog-width: min(90vw, 420px);
}

/* 其他样式保持不变... */
</style> 