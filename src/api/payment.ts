import type { PaymentConfig, PaymentResponse } from '../types/payment'
import { request } from '../utils/request'

/**
 * 创建订单
 */
export function fetchOrderBuyAPI(params: {
  goodsId: number | string
  payType: string
  payEnv?: string
}) {
  return request<PaymentResponse>('/order/buy', {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

/**
 * 查询订单状态
 */
export function fetchOrderQueryAPI(params: { orderId: string }) {
  return request<PaymentResponse>('/order/queryByOrderId', {
    method: 'GET',
    params: {
      orderId: params.orderId
    }
  })
}

/**
 * 获取套餐列表
 */
export function fetchPackageList() {
  return request<{
    rows: Array<{
      id: number
      name: string | number
      des: string
      price: string
      originalPrice: string
      days: number
      status: number
      coverImg: string | null
      createdAt: string
      updatedAt: string
      deletedAt: string | null
    }>
    count: number
  }>('/crami/queryAllPackage', {
    method: 'GET',
    params: {
      status: 1,
      size: 30
    }
  })
}
