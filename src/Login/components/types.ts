export interface LoginFormData {
    phone: string
    phoneCode: string
    captchaCode: string
    captchaId: string | null
  }
  
  export interface CaptchaResponse {
    svgCode: string
    code: string
  }
  
  export interface LoginResponse {
    success: boolean
    data?: any
    message?: string
  } 