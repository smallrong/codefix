<script setup lang="ts">
import { NButton, NCard, NGrid, NGridItem, NIcon, NModal, NSkeleton, NSpace } from 'naive-ui'
import { CloseOutline, CartOutline, CheckmarkCircleOutline } from '@vicons/ionicons5'
import { computed, onMounted, ref, watch } from 'vue'
import { usePaymentStore } from '../../store/payment'
import type { Package } from '../../types/payment'
import { fetchPackageList } from '../../api/payment'
import { userState } from '../../store/user'

const props = defineProps<{
  visible: boolean
}>()

const paymentStore = usePaymentStore()
const loading = ref(true)
const error = ref('')
const packageList = ref<Package[]>([])

// 获取套餐列表
const getPackageList = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const res = await fetchPackageList()
    if (res.success && res.data?.rows) {
      packageList.value = res.data.rows.map(item => ({
        id: item.id,
        name: String(item.name),
        des: item.des,
        price: Number(item.price),
        originalPrice: Number(item.originalPrice),
        days: item.days,
        extraReward: 0
      }))
    } else {
      error.value = '获取套餐列表失败'
    }
  } catch (err) {
    console.error('获取套餐列表失败:', err)
    error.value = '获取套餐列表失败，请稍后重试'
  } finally {
    loading.value = false
  }
}




function handleCloseDialog() {
  loading.value = true
  error.value = ''
}

function handleBuyGoods(pkg: Package) {
  paymentStore.updateOrderInfo({ pkgInfo: pkg })
  paymentStore.updateGoodsDialog(false)
  paymentStore.updatePayDialog(true)
}

const formatLines = (des: string) => {
  return des.split('\n')
}

onMounted(() => {
  getPackageList()
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    getPackageList()
  }
})
</script>

<template>
  <NModal 
    :show="visible" 
    class="goods-dialog-custom"
    :mask-closable="false"
    :close-on-esc="false"
  >
    <div class="goods-modal-content">
      <!-- 头部 -->
      <div class="modal-header">
        <div class="flex items-center gap-2">
          <NIcon size="24" color="#3B82F6">
            <CartOutline />
          </NIcon>
          <span class="text-xl text-gray-200 font-medium">会员套餐</span>
        </div>
        <NIcon 
          size="20" 
          color="#CBD5E1" 
          class="cursor-pointer hover:opacity-80 transition-opacity" 
          @click="paymentStore.updateGoodsDialog(false)"
        >
          <CloseOutline />
        </NIcon>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error-message">
        <span>{{ error }}</span>
        <button 
          class="retry-button"
          @click="getPackageList"
        >
          重试
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <NGrid :x-gap="20" :y-gap="20" :cols="2">
          <NGridItem v-for="index in 2" :key="index">
            <NSkeleton class="skeleton-card" :height="420" />
          </NGridItem>
        </NGrid>
      </div>

      <!-- 套餐列表 -->
      <div v-else-if="packageList.length > 0" class="package-list">
        <div class="package-grid">
          <div 
            v-for="(item, index) in packageList.filter(item => item.name === '4')" 
            :key="index"
            class="package-card"
            :class="{ 'popular': true }"
          >
          <!-- {{ item }} -->
            <!-- 热门标签 -->
            <!-- <div v-if="item.name === '4'" class="popular-tag">
              <span>热门套餐</span>
            </div> -->
            
            <!-- 套餐标题 -->
            <div class="package-header">
              <h3>解锁超强算法大模型，解决更复杂的编程难题!</h3>
              <div class="package-duration">{{ item.days }}天会员</div>
            </div>

            <!-- 套餐价格 -->
            <div class="package-price">
              <div class="original-price">
                原价: ￥{{ item.originalPrice }}
              </div>
              <div class="current-price">
                ￥{{ item.price }}
              </div>
            </div>

            <!-- 套餐特权 -->
            <div class="package-features">
              <div 
                v-for="(line, lineIndex) in formatLines(item.des)" 
                :key="lineIndex"
                class="feature-item"
              >
                <NIcon size="16" color="#3B82F6">
                  <CheckmarkCircleOutline />
                </NIcon>
                <span>{{ line }}</span>
              </div>
            </div>

            <!-- 购买按钮 -->
            <button
              class="buy-button"
              @click="handleBuyGoods(item)"
              :disabled="Boolean(userState.userBalance?.codeExpirationDate && new Date(userState.userBalance?.codeExpirationDate) > new Date())"
              >
              {{ userState.userBalance?.codeExpirationDate ? (new Date(userState.userBalance.codeExpirationDate) > new Date() ? '您已是会员' : '立即购买') : '立即购买' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 无数据提示 -->
      <div v-else class="empty-message">
        暂无可用套餐
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.goods-dialog-custom {
  --dialog-width: min(90vw, 1000px);
}

.goods-modal-content {
  background-color: #1E293B;
  border-radius: 16px;
  padding: 24px;
  width: var(--dialog-width);
  border: 1px solid #374151;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #374151;
}

.error-message {
  text-align: center;
  color: #EF4444;
  margin-bottom: 16px;
  padding: 12px;
  background-color: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: fadeIn 0.3s ease;
}

.retry-button {
  color: #3B82F6;
  background: none;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.retry-button:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.loading-container {
  padding: 20px;
}

.skeleton-card {
  border-radius: 12px;
  background: #111827;
}

.package-list {
  padding: 20px 0;
}

.package-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 460px));
  gap: 24px;
  justify-content: center;
}

.package-card {
  width: 100%;
  background-color: #111827;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #374151;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.package-card:hover {
  transform: translateY(-4px);
  border-color: #3B82F6;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.3);
}

.popular {
  border: 2px solid #3B82F6;
}

.popular-tag {
  position: absolute;
  top: 12px;
  right: -32px;
  background-color: #3B82F6;
  padding: 6px 40px;
  transform: rotate(45deg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.popular-tag span {
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.package-header {
  text-align: center;
}

.package-header h3 {
  font-size: 1.5rem;
  color: #E5E7EB;
  font-weight: 600;
  margin-bottom: 8px;
}

.package-duration {
  color: #3B82F6;
  font-size: 0.875rem;
  font-weight: 500;
}

.package-price {
  text-align: center;
  padding: 16px;
  background-color: #1E293B;
  border-radius: 12px;
  border: 1px solid #374151;
}

.original-price {
  color: #6B7280;
  text-decoration: line-through;
  font-size: 0.875rem;
  margin-bottom: 4px;
}

.current-price {
  color: #3B82F6;
  font-size: 2rem;
  font-weight: 700;
}

.package-features {
  padding: 16px;
  background-color: #1E293B;
  border-radius: 12px;
  border: 1px solid #374151;
  flex: 1;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #CBD5E1;
  padding: 6px 0;
}

.feature-item:not(:last-child) {
  border-bottom: 1px solid #374151;
}

.buy-button {
  width: 100%;
  padding: 12px;
  background-color: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.buy-button:hover {
  background-color: #2563EB;
  transform: translateY(-2px);
}

.buy-button:active {
  transform: translateY(0);
}

.empty-message {
  text-align: center;
  color: #6B7280;
  padding: 40px;
  font-size: 1.125rem;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .goods-modal-content {
    padding: 16px;
    width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
  }

  .package-grid {
    grid-template-columns: minmax(0, 420px);
  }

  .package-card {
    padding: 20px;
  }

  .package-header h3 {
    font-size: 1.25rem;
  }

  .current-price {
    font-size: 1.5rem;
  }

  .goods-modal-content::-webkit-scrollbar {
    width: 4px;
  }

  .goods-modal-content::-webkit-scrollbar-track {
    background: #1E293B;
  }

  .goods-modal-content::-webkit-scrollbar-thumb {
    background: #4B5563;
    border-radius: 2px;
  }

  .goods-modal-content::-webkit-scrollbar-thumb:hover {
    background: #6B7280;
  }

  .popular-tag {
    font-size: 10px;
    padding: 4px 36px;
    right: -28px;
    top: 10px;
  }
}

/* 动画效果 */
:deep(.n-modal-mask) {
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(2px);
}

:deep(.n-modal-container) {
  animation: modalShow 0.3s ease-out;
}

@keyframes modalShow {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 修改单个卡片时的样式 */
@media screen and (min-width: 769px) {
  .package-grid:has(:only-child) {
    grid-template-columns: minmax(0, 420px);
  }
}
</style> 