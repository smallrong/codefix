// 微信登录相关接口
interface WechatLoginResponse {
  code: number
  success: boolean
  message: string
  data: {
    token?: string
    openId?: string
  }
}

// 获取场景值
export async function fetchQRSceneStr() {
  const response = await fetch('https://ai.wtc.edu.cn/api/official/getQRSceneStr', {
    method: 'POST'
  })
  return response.json()
}

// 获取二维码
export async function fetchQRCode(sceneStr: string) {
  const response = await fetch(`https://ai.wtc.edu.cn/api/official/getQRCode?sceneStr=${sceneStr}`)
  return response.json()
}

// 轮询登录状态
export async function checkLoginStatus(sceneStr: string): Promise<WechatLoginResponse> {
  const response = await fetch('https://ai.wtc.edu.cn/api/official/loginBySceneStr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sceneStr })
  })
  return response.json()
} 