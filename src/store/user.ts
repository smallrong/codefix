import { ref } from 'vue'

export interface UserInfo {
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

export interface UserBalance {
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
  codeExpirationDate: string | null
}

export interface UserState {
  userInfo: UserInfo | null
  userBalance: UserBalance | null
}

// 创建全局状态
export const userState = ref<UserState>({
  userInfo: null,
  userBalance: null
})

// 更新用户信息
export function updateUserState(data: { userInfo: UserInfo; userBalance: UserBalance }) {
  userState.value = data
}

// 清除用户信息
export function clearUserState() {
  userState.value = {
    userInfo: null,
    userBalance: null
  }
} 