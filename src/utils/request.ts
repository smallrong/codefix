// 基础响应类型
export interface BaseResponse<T = any> {
  code: number
  success: boolean
  message: string
  data: T
}

const BASE_URL = 'https://ai.wtc.edu.cn/api'  // API基础路径
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
}

// 通用请求方法
export async function request<T>(url: string, options: RequestInit & { params?: Record<string, any> }): Promise<BaseResponse<T>> {
  const token = localStorage.getItem('token')
  const headers = {
    ...DEFAULT_HEADERS,
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }

  // 处理 GET 请求参数
  let finalUrl = BASE_URL + url
  if (options.params) {
    const searchParams = new URLSearchParams()
    Object.entries(options.params).forEach(([key, value]) => {
      searchParams.append(key, value)
    })
    finalUrl += `?${searchParams.toString()}`
  }

  const { params, ...restOptions } = options
  const response = await fetch(finalUrl, {
    ...restOptions,
    headers
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    return {
      code: response.status,
      success: false,
      message: data.message || `请求失败: ${response.status}`,
      data: null
    } as BaseResponse<T>
  }
  
  return data as BaseResponse<T>
} 