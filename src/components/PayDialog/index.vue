<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { NButton, NCountdown, NIcon, NModal, NRadio, NRadioGroup, NSpin, NSpace } from 'naive-ui'
import { CloseOutline, PaperPlaneOutline } from '@vicons/ionicons5'
import { usePaymentStore } from '../../store/payment'
import { fetchOrderBuyAPI, fetchOrderQueryAPI } from '../../api/payment'
import QRCode from './QRCode.vue'
import type { PayType, PayChannel, PayPlatform } from '@/types/payment'
import { fetchUserInfo } from '../../Login/components/api'
import { userState } from '../../store/user'


const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits(['update:visible'])

const paymentStore = usePaymentStore()
const POLL_INTERVAL = 1000
const active = ref(true)
const payType = ref('wxpay')
const orderId = ref('')
let timer: any
const url_qrcode = ref('')
const qrCodeloading = ref(true)
const is_phone = ref(window.innerWidth <= 768)

// 查询订单状态
const queryOrderStatus = async () => {
  console.log("orderId.value",orderId.value)
  if (!orderId.value) return

  try {
    const result = await fetchOrderQueryAPI({ orderId: orderId.value })
    // console.log("result", result)
    if (result.success && result.data?.status === 1) {
      clearInterval(timer)
      checkLoginStatus()
      paymentStore.updatePayDialog(false)
    }
  } catch (error) {
    console.error('查询订单状态失败:', error)
  }
}

// 获取支付二维码
async function getQrCode() {
  qrCodeloading.value = true
  console.log(1)
  try {console.log(2)
    const res = await fetchOrderBuyAPI({
      goodsId: paymentStore.orderInfo.pkgInfo.id,
      payType: payType.value,
      payEnv: is_phone.value ? 'Phone' : 'PC'
    })
    if (res.success && res.data) {
      url_qrcode.value = res.data.url_qrcode ?? ''
      orderId.value = res.data.orderId ?? ''
    }
  } catch (error) {
    console.error('获取支付二维码失败:', error)
  } finally {
    qrCodeloading.value = false
  }
}

// 处理窗口关闭
const handleClose = () => {
  emit('update:visible', false)
  paymentStore.updatePayDialog(false)

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

// 处理窗口打开
function handleOpenDialog() {
  getQrCode()
  timer = setInterval(queryOrderStatus, POLL_INTERVAL)
}

// 处理支付超时
function handleFinish() {
  clearInterval(timer)
  paymentStore.updatePayDialog(false)
}

// 监听支付方式变化
watch(payType, () => {
  getQrCode()
})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    handleOpenDialog()
  } else {
    clearInterval(timer)
    timer = null
  }
})

// 检测屏幕尺寸
const checkScreenSize = () => {
  is_phone.value = window.innerWidth <= 768
}

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
  clearInterval(timer)
})

// 修复 payTypes 计算属性
const payTypes = computed<PayType[]>(() => {
  return [
    {
      label: '微信支付',
      value: 'wxpay' as PayChannel,
      payChannel: 'wechat' as PayPlatform
    },
    {
      label: '支付宝支付',
      value: 'alipay' as PayChannel,
      payChannel: 'alipay' as PayPlatform
    }
  ].filter(item =>
    paymentStore.payPlatform?.includes(item.payChannel)
  )
})
</script>

<template>
  <NModal
    :show="visible"
    :mask-closable="false"
    :close-on-esc="false"
    transform-origin="center"
    class="pay-dialog-custom"
    @update:show="emit('update:visible', $event)"
  >
    <div class="pay-modal-content">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-2">
          <NIcon size="24" color="#3B82F6">
            <PaperPlaneOutline />
          </NIcon>
          <span class="text-xl text-gray-200 font-medium">确认支付</span>
        </div>
        <NIcon
          size="20"
          color="#CBD5E1"
          class="cursor-pointer hover:opacity-80"
          @click="handleClose"
        >
          <CloseOutline />
        </NIcon>
      </div>

      <div class="pay-info-section">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-gray-400">支付金额：</span>
          <span class="text-3xl text-blue-500 font-bold">
            ￥{{ paymentStore.orderInfo.pkgInfo?.price }}
          </span>
        </div>
        <div class="text-gray-400 text-sm">
          {{ paymentStore.orderInfo.pkgInfo?.des }}
        </div>
      </div>

      <div class="qrcode-section">
        <div class="relative">
          <NSpin v-if="qrCodeloading" />
          <QRCode
            v-else-if="url_qrcode"
            :value="url_qrcode"
            :size="is_phone ? 200 : 240"
            class="mx-auto"
          />
        </div>
      </div>

      <div class="payment-options">
        <NRadioGroup v-model:value="payType" class="flex justify-center gap-6">
          <NRadio
            v-for="pay in payTypes"
            :key="pay.value"
            :value="pay.value"
            class="payment-radio"
          >
            <div class="flex items-center gap-2">
              <img
                :src="pay.value === 'wxpay' ? '/src/assets/wxpay.png' : '/src/assets/alipay.png'"
                :alt="pay.label"
                class="w-6 h-6"
              />
              <span class="text-white">{{ pay.label }}</span>
            </div>
          </NRadio>
        </NRadioGroup>

        <div class="countdown-section">
          请在
          <NCountdown
            :active="active"
            :duration="300000"
            :on-finish="handleFinish"
            class="text-blue-500 mx-1 font-medium"
          />
          内完成支付
        </div>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.pay-dialog-custom {
  --dialog-width: min(90vw, 460px);
}

.pay-modal-content {
  background-color: #1E293B;
  border-radius: 16px;
  padding: 24px;
  width: var(--dialog-width);
  border: 1px solid #374151;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.pay-info-section {
  background-color: #111827;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  border: 1px solid #374151;
}

.qrcode-section {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 280px;
}

.payment-options {
  padding: 16px;
  background-color: #111827;
  border-radius: 12px;
  border: 1px solid #374151;
}

.payment-radio {
  --n-text-color: #CBD5E1;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s;
}

.payment-radio:hover {
  background-color: #1E293B;
}

:deep(.n-radio.n-radio--checked) {
  background-color: #1E293B;
  --n-text-color: #3B82F6;
}

.countdown-section {
  text-align: center;
  color: #CBD5E1;
  margin-top: 16px;
  font-size: 0.875rem;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .pay-modal-content {
    padding: 20px;
  }

  .qrcode-section {
    padding: 16px;
    min-height: 240px;
  }

  .payment-options {
    padding: 12px;
  }

  .payment-radio {
    padding: 6px 12px;
    font-size: 0.875rem;
  }
}

/* 添加动画效果 */
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

/* 优化加载状态 */
:deep(.n-spin) {
  --n-color: #3B82F6;
  --n-text-color: #CBD5E1;
}

/* 优化单选框样式 */
:deep(.n-radio-input) {
  border-color: #4B5563;
}

:deep(.n-radio.n-radio--checked .n-radio-input) {
  border-color: #3B82F6;
  background-color: #3B82F6;
}
</style>
