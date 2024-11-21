// 基础响应类型
interface BaseResponse<T = any> {
  code: number
  success: boolean
  message: string
  data: T
}

// 验证码响应类型
interface CaptchaResult {
  svgCode: string  // svg格式的验证码图片
  code: string     // 验证码ID
}

// 发送短信参数类型
interface SendSmsParams {
  phone: string      // 手机号
  captchaCode: string  // 图形验证码
  captchaId: string | null    // 验证码ID,允许为null
}

// 登录参数类型 
interface LoginParams {
  phone: string      // 手机号
  phoneCode: string  // 短信验证码
  captchaCode: string  // 图形验证码
  captchaId: string | null    // 验证码ID,允许为null
}

// API 请求基础配置
const BASE_URL = 'https://ai.wtc.edu.cn/api/'  // 这里替换为你的实际API地址
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
}

// 添加手机号验证函数
function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 通用请求方法
async function request<T>(url: string, options: RequestInit): Promise<BaseResponse<T>> {
  const response = await fetch(BASE_URL + url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers
    }
  })
  
  const data = await response.json()
  
  // 确保返回的数据不为 null
  if (data.data === null) {
    throw new Error('Response data is null')
  }
  
  return data as BaseResponse<T>
}

// API 方法

/**
 * 获取图形验证码
 */
export async function fetchCaptchaImg(params: { color: string }) {
  return request<CaptchaResult>('auth/captcha', {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

/**
 * 发送短信验证码
 */
export async function fetchSendSms(params: SendSmsParams) {
  return request<void>('auth/sendPhoneCode', {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

/**
 * 手机号登录
 */
export async function fetchLoginByPhone(params: LoginParams): Promise<BaseResponse<string>> {
  const response = await request<string>('auth/loginByPhoneCapter', {
    method: 'POST',
    body: JSON.stringify(params)
  });
  
  // 确保返回的数据不为 null
  if (response.data === null) {
    return {
      ...response,
      data: '' // 如果为 null，返回空字符串
    };
  }
  
  return response as BaseResponse<string>;
}

// 添加获取用户信息的接口
interface GetInfoResponse {
  userInfo: {
    id: number
    username: string
    email: string
    phone: string
    avatar: string
    sign: string
    inviteCode: string
    role: string
    consecutiveDays: number
    isBindWx: boolean
    usePermission: number
  }
  userBalance: {
    model3Count: number
    model4Count: number
    drawMjCount: number
    packageId: number
    memberModel3Count: number
    memberModel4Count: number
    memberDrawMjCount: number
    useModel3Count: number | null
    useModel4Count: number | null
    useModel3Token: number | null
    useModel4Token: number | null
    useDrawMjToken: number | null
    expirationTime: string | null
    vipExpirationDate: string | null
    svipExpirationDate: string | null
    sumModel3Count: number
    sumModel4Count: number
    sumDrawMjCount: number
  }
}

export async function fetchUserInfo(): Promise<BaseResponse<GetInfoResponse>> {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('No token found')
  }

  const response = await request<GetInfoResponse>('auth/getInfo', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.data) {
    throw new Error('User info not found')
  }

  return response
}

// 修改登录响应类型
interface LoginResponse {
  code: number
  data: string // token
  success: boolean
  message: string
}

// 绑定手机号参数类型
interface BindPhoneParams {
  phone: string      // 手机号
  phoneCode: string  // 短信验证码
  openId: string     // 微信openId
}

/**
 * 绑定手机号并创建用户
 */
export function createUserBybindOpenidAPI<T>(data: BindPhoneParams): Promise<BaseResponse<T>> {
  return request<T>('auth/createUserBybindOpenid', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// 导出类型定义
export type {
  BaseResponse,
  CaptchaResult,
  SendSmsParams,
  LoginParams
}