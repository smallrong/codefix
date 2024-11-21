export interface PaymentConfig {
  goodsId: number | string
  payType: string
  payEnv?: string
}

export interface PaymentResponse {
  code: number
  success: boolean
  message: string
  data: {
    url_qrcode: string
    orderId: string
    redirectUrl?: string
    status: number
    [key: string]: any
  }
}

export interface Package {
  id: number
  name: string
  des: string
  price: number
  originalPrice: number
  days: number
  extraReward: number
}

export interface OrderInfo {
  pkgInfo: Package
}

export type PayPlatform = 'wechat' | 'alipay'
export type PayChannel = 'wxpay' | 'alipay'

export interface PayType {
  label: string
  value: PayChannel
  payChannel: PayPlatform
} 