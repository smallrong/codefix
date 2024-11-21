import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OrderInfo, PayPlatform } from '../types/payment'

export const usePaymentStore = defineStore('payment', () => {
  // 基础状态
  const payDialog = ref(false)
  const goodsDialog = ref(false)
  const orderInfo = ref<OrderInfo>({} as OrderInfo)
  
  // 用户配置状态
  const globalConfig = ref({
    payWechatStatus: 1,
    payAliStatus: 1,
  })

  // 计算属性
  const payPlatform = computed<PayPlatform[] | null>(() => {
    const { payWechatStatus, payAliStatus } = globalConfig.value
    const platforms: PayPlatform[] = []

    if (Number(payAliStatus) === 1)
      platforms.push('alipay')
    if (Number(payWechatStatus) === 1)
      platforms.push('wechat')

    return platforms.length > 0 ? platforms : null
  })

  // 方法
  function updatePayDialog(show: boolean) {
    payDialog.value = show
  }

  function updateGoodsDialog(show: boolean) {
    goodsDialog.value = show
  }

  function updateOrderInfo(info: OrderInfo) {
    orderInfo.value = info
  }

  function updateConfig(config: Partial<typeof globalConfig.value>) {
    globalConfig.value = { ...globalConfig.value, ...config }
  }

  return {
    payDialog,
    goodsDialog,
    orderInfo,
    globalConfig,
    payPlatform,
    updatePayDialog,
    updateGoodsDialog,
    updateOrderInfo,
    updateConfig
  }
}) 