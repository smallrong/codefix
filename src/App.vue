<template>
    <n-message-provider>
  <div class="app-container-custom">
    <header class="header-custom">
      <div class="run-button-custom">
        <div class="run-controls-wrapper">
          <button @click="handleCodeCheck" :disabled="loading">
            {{ loading ? '正在分析中...' : '一键代码智能纠错' }}
          </button>
          <select
            v-model="selectedModel"
            class="model-selector"
            :disabled="loading"
          >
            <option value="normal">普通模型</option>
            <option value="advanced">高级模型</option>
          </select>
        </div>
      </div>

      <div class="user-menu-custom">
        <!-- 未登录时显示普通按钮 -->
        <n-button
          v-if="!userState.userInfo"
          type="primary"
          ghost
          @click="showLogin = true"
        >
          用户中心
        </n-button>
        <!-- 已登录时显示下拉菜单 -->
        <n-dropdown
          v-else
          trigger="click"
          :options="dropdownOptions"
          @select="handleSelect"
          :theme="darkTheme"
        >
          <n-text
            class="user-center-custom"
            :style="getUsernameStyle(userState.userInfo.usePermission)"
          >
            {{ userState.userInfo.username }}
          </n-text>
        </n-dropdown>
      </div>
    </header>

    <div class="container-custom">
      <div class="left-panel-custom">
        <codeEdit
          :code="code"
          :language="'cpp'"
          @update:code="code = $event"
        />
        <div class="error-input-custom">
          <label for="error-info">附加信息（可选）</label>
          <textarea
            id="error-info"
            v-model="errorInfo"
            placeholder="在此可以输入报错信息、算法题要求或输入输出说明等。例如：&#10;1、'索引超出范围'或具体的报错日志。&#10;2、请生成一个python冒泡排序算法&#10;3、输入为一个整数数组，输出为排序后的数组。"
          ></textarea>
        </div>
      </div>

      <div class="right-panel-custom">
        <TabPanel
          :error-location="errorLocation"
          :correct-code="correctCode"
          :related-knowledge="relatedKnowledge"
        />

      </div>

    </div>

    <!-- 登录弹窗 -->
    <NModal
      v-model:show="showLogin"
      :mask-closable="true"
      :close-on-esc="true"
      transform-origin="center"
    >
      <div class="login-modal-custom">
        <div class="login-modal-header">
          <span class="login-modal-title">用户登录</span>
          <button class="login-modal-close" @click="showLogin = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <PhoneLogin
          theme="dark"
          @login-success="handleLoginSuccess"
          @login-error="handleLoginError"
          @close="showLogin = false"
        />
      </div>
    </NModal>

    <!-- 商品和支付弹窗 -->
    <GoodsDialog :visible="paymentStore.goodsDialog" />
    <PayDialog v-model:visible="paymentStore.payDialog" />

    <!-- 错误提示弹窗 -->
    <NModal
      v-model:show="error.show"
      :mask-closable="false"
      :close-on-esc="false"
      transform-origin="center"
    >
      <div class="error-modal-custom">
        <div class="error-icon-wrapper">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" class="w-12 h-12">
              <path
                fill="currentColor"
                d="M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z"
              />
            </svg>
          </div>
        </div>
        <h3 class="error-title">{{ error.message }}</h3>
        <button
          class="error-button"
          @click="closeError"
        >
          确定
        </button>
      </div>
    </NModal>

    <!-- 加载框 -->
    <NModal
      v-model:show="loading"
      :mask-closable="false"
      :close-on-esc="false"
      transform-origin="center"
    >
      <div class="p-8 bg-gray-900 rounded-lg">
        <NSpin size="large">
          <template #description>
            <span class="mt-3 text-gray-300">正在分析代码...</span>
          </template>
        </NSpin>
      </div>
    </NModal>

    <!-- 修改历史记录抽屉 -->
    <NDrawer
      v-model:show="showHistory"
      style="width: 100%; max-width: 500px;"
      placement="right"
    >
      <NDrawerContent
        title="历史记录"
        closable
      >
        <div class="history-content">
        </div>
      </NDrawerContent>
    </NDrawer>

    <!-- 修改 footer 部分 -->
    <footer class="footer-custom">
      <div class="icp-container">
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          class="icp-link"
        >
          鄂ICP备2024077520号-2
        </a>
      </div>
    </footer>
    </div>
  </n-message-provider>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { userState, clearUserState } from './store/user'
import { usePaymentStore } from './store/payment'
import GoodsDialog from './components/GoodsDialog/index.vue'
import PayDialog from './components/PayDialog/index.vue'
import codeEdit from './components/codeEdit.vue'
import TabPanel from './components/TabPanel.vue'
import { correctCode as checkCode } from './api'
import PhoneLogin from './Login/index.vue'
import { fetchUserInfo } from './Login/components/api'
import { NModal, NSpin, NDrawer, NDrawerContent, NButton, NDropdown, NText } from 'naive-ui'
import './styles/app.css'
import { NMessageProvider, NConfigProvider, darkTheme } from 'naive-ui'

const showLogin = ref(false)
const code = ref('')
const errorInfo = ref('')
const errorLocation = ref('')
const correctCode = ref('')
const relatedKnowledge = ref('')
const loading = ref(false)
const showHistory = ref(false)
const selectedModel = ref('normal')

const paymentStore = usePaymentStore()

const error = ref({
  show: false,
  message: ''
})

// 下拉菜单选项
const dropdownOptions = [
  {
    label: '购买套餐',
    key: 'buy',
    icon: () => h('i', { class: 'bi bi-cart me-2' })
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h('i', { class: 'bi bi-box-arrow-right me-2' })
  }
]

// 处理下拉菜单选择
const handleSelect = (key) => {
  switch(key) {
    case 'buy':
      handleBuyPackage()
      break
    case 'logout':
      handleLogout()
      break
  }
}

const handleCodeCheck = async () => {
  if (!userState.value.userInfo) {
    showLogin.value = true
    return
  }

  if (selectedModel.value === 'advanced' &&   new Date(userState.value.userBalance?.codeExpirationDate) < new Date() ) {
    paymentStore.updateGoodsDialog(true)
    error.value = {
      show: true,
      message: '高级模型仅对VIP会员开放，请先升级会员'
    }
    return
  }

  if (loading.value) return

  loading.value = true
  try {
    const res = await checkCode({
      code: code.value,
      add_info: errorInfo.value,
      isAdvanced: selectedModel.value === 'advanced'
    })
    errorLocation.value = res.data.error_location
    correctCode.value = res.data.correct_code
    relatedKnowledge.value = res.data.related_knowledge
  } catch (error) {
    console.error('代码检查失败:', error)
    if (error.response?.status === 400) {
      error.value = {
        show: true,
        message: '代码格式错误，请检查后重试'
      }
    } else {
      error.value = {
        show: true,
        message: '服务异常，请稍后重试'
      }
    }
  } finally {
    loading.value = false
  }
}

const handleBuyPackage = () => {
  paymentStore.updateGoodsDialog(true)
}

const handleLogout = () => {
  localStorage.removeItem('token')
  clearUserState()
}

const handleLoginSuccess = (token) => {
  localStorage.setItem('token', token)
  showLogin.value = false
  checkLoginStatus()
}

const handleLoginError = (error) => {
  console.error('登录失败:', error)
}

const checkLoginStatus = async () => {
  try {
    const token = localStorage.getItem('token')
    if (token) {
      const res = await fetchUserInfo()
      if (res.success) {
        userState.value = res.data
      } else {
        localStorage.removeItem('token')
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    localStorage.removeItem('token')
  }
}

const closeError = () => {
  error.value.show = false
}

const handleHistory = () => {
  showHistory.value = true
}

const getUsernameStyle = (permission) => {
  
  if(!userState.value.userBalance?.codeExpirationDate)
  {
    return { color: '#8E8E8E' } // 普通用户 灰色
  }
  if ( new Date(userState.value.userBalance.codeExpirationDate) < new Date()) {
    return { color: '#8E8E8E' } // 普通用户 灰色
  } else {
    return { color: '#3B82F6' } // 会员 蓝色
  }
}

onMounted(() => {
  checkLoginStatus()
})
</script>

<style scoped>
.run-controls-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.model-selector {
  padding: 8px;
  border-radius: 4px;
  background-color: #2d2d2d;
  color: white;
  border: 1px solid #444;
  cursor: pointer;
}

.model-selector:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 添加以下媒体查询样式 */
@media screen and (min-width: 1024px) {
  .left-panel-custom {
    display: flex;
    flex-direction: column;
    height: 100%; /* 确保左侧面板占满高度 */
  }

  .left-panel-custom :deep(.code-editor) {
    flex: 0.6; /* 代码编辑器占60% */
  }

  .error-input-custom {
    flex: 0.4; /* 附加信息占40% */
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
  }

  .error-input-custom textarea {
    flex: 1; /* 让文本框填充剩余空间 */
    min-height: 150px; /* 设置最小高度 */
    resize: none; /* 禁用手动调整大小 */
  }

  .error-input-custom label {
    margin-bottom: 0.5rem;
  }
}

/* 修改 footer 样式 */
.footer-custom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px 0;  /* 减小上下内边距 */
  text-align: center;
  z-index: 100;
}

.icp-container {
  display: inline-block;  /* 使容器宽度适应内容 */
  padding: 2px 15px;  /* 减小上下内边距 */
  backdrop-filter: blur(5px);
}

.icp-link {
  color: #888;
  font-size: 11px;  /* 减小字体大小 */
  text-decoration: none;
  transition: color 0.2s ease;
  white-space: nowrap;
}

.icp-link:hover {
  color: #aaa;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .footer-custom {
    padding: 4px 0;
  }

  .icp-container {
    padding: 2px 12px;
  }

  .icp-link {
    font-size: 10px;
  }
}

/* 调整主容器底部边距 */
.app-container-custom {
  padding-bottom: 30px;  /* 为 footer 留出空间 */
}

.container-custom {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden; /* 防止双滚动条 */
}

.right-panel-custom {
  flex: 1;
  overflow-y: auto; /* 启用右侧面板的垂直滚动 */
}

@media screen and (max-width: 768px) {
  .app-container-custom {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .container-custom {
    flex: 1;
    flex-direction: column;
    overflow-y: auto; /* 移动端启用容器的垂直滚动 */
  }

  .left-panel-custom {
    min-height: auto;
  }

  .right-panel-custom {
    min-height: auto;
  }

  /* 确保标签页内容可以滚动 */
  :deep(.n-tabs-content) {
    overflow-y: auto;
    max-height: 60vh; /* 限制最大高度，确保可以滚动 */
  }
}
</style>
