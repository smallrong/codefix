<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { LoginFormData } from './components/types'
import { fetchCaptchaImg, fetchSendSms, fetchLoginByPhone } from './components/api'
import { fetchQRSceneStr, fetchQRCode, checkLoginStatus } from '../api/wechat'
import { createUserBybindOpenidAPI } from './components/api'
import { useMessage } from 'naive-ui'
// Props定义
const props = defineProps({
  theme: {
    type: String,
    default: 'light'
  }
})
const ms = useMessage()
// Emits定义
const emit = defineEmits(['login-success', 'login-error'])

// 响应式数据
const loading = ref(false)
const captchaSvg = ref('')
const isSendCaptcha = ref(false)
const lastSendPhoneCodeTime = ref(0)

const loginForm = ref<LoginFormData>({
  phone: '',
  phoneCode: '',
  captchaCode: '',
  captchaId: null,
})

// 计算主题样式
const inputStyle = computed(() => {
  return props.theme === 'dark' 
    ? {
        backgroundColor: '#363f4f',
        color: '#ffffff',
        borderColor: '#505a6b'
      }
    : {
        backgroundColor: '#f2f5f9',
        color: '#000000',
        borderColor: '#e5e7eb'
      }
})

// 获取验证码图片
async function getCaptchaImg() {
  try {
    const color = props.theme === 'dark' ? '#363f4f' : '#fff'
    const res = await fetchCaptchaImg({ color })
    
    if (!res.data) {
      throw new Error('Failed to get captcha')
    }
    
    captchaSvg.value = res.data.svgCode
    loginForm.value.captchaId = res.data.code
  } catch (error) {
    console.error('获取验证码失败:', error)
    ms.error('获取验证码失败，请重试')
  }
}

// 添加错误消息状态
const errorMsg = ref('')

// 显示错误消息的函数
const showError = (message: string) => {
  errorMsg.value = message;
  // 3秒后自动清除错误消息
  setTimeout(() => {
    errorMsg.value = '';
  }, 3000);
}

// 添加发送中状态
const sendingCode = ref(false)

// 修改发送验证码函数
async function handleSendCaptcha() {
  if (!loginForm.value.phone) {
    ms.error('请输入手机号');
    return;
  }
  if (!loginForm.value.captchaCode) {
    ms.error('请输入图形验证码');
    return;
  }
  if (!loginForm.value.captchaId) return;
  
  // 立即设置发送中状态
  sendingCode.value = true;
  
  try {
    const { phone, captchaCode, captchaId } = loginForm.value;
    const res = await fetchSendSms({ phone, captchaCode, captchaId });
    
    if (res.success) {
      isSendCaptcha.value = true;
      lastSendPhoneCodeTime.value = 60;
      startCountdown();
    } else {
      ms.error(res.message);
      isSendCaptcha.value = false;
      if (res.code === 400) {
        getCaptchaImg();
      }
    }
  } catch (error: any) {
    ms.error(error.message || '发送验证码失败');
    getCaptchaImg();
  } finally {
    // 无论成功失败，都重置发送中状态
    sendingCode.value = false;
  }
}

// 倒计时
function startCountdown() {
  if (lastSendPhoneCodeTime.value > 0) {
    setTimeout(() => {
      lastSendPhoneCodeTime.value--
      startCountdown()
    }, 1000)
  }
}

// 登录提交
async function handleSubmit() {
  if (!loginForm.value.phone) {
    ms.error('请输入手机号');
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(loginForm.value.phone)) {
    ms.error('请输入正确的手机号');
    return;
  }
  if (!loginForm.value.captchaCode) {
    ms.error('请输入图形验证码');
    return;
  }
  if (!loginForm.value.phoneCode) {
    ms.error('请输入短信验证码');
    return;
  }
  if (!loginForm.value.captchaId) {
    ms.error('验证码已失效，请重新获取');
    return;
  }

  try {
    loading.value = true;
    const res = await fetchLoginByPhone(loginForm.value);
    
    if (res.success) {
      emit('login-success', res.data);
    } else {
      ms.error(res.message || '登录失败');
      if (res.code === 400) {
        getCaptchaImg();
      }
    }
  } catch (error: any) {
    ms.error(error.message || '登录失败，请重试');
  } finally {
    loading.value = false;
  }
}

// 添加回车键监听
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !loading.value) {
    handleSubmit();
  }
}

// 登录方式
const loginType = ref<'wechat' | 'phone'>('wechat')
const qrCodeUrl = ref('')
const sceneStr = ref('')
const polling = ref<number | null>(null)

// 获取微信二维码
async function getWechatQRCode() {
  try {
    // 获取场景值
    const sceneStrRes = await fetchQRSceneStr()
    if (sceneStrRes.success) {
      sceneStr.value = sceneStrRes.data
      // 获取二维码
      const qrCodeRes = await fetchQRCode(sceneStr.value)
      if (qrCodeRes.success) {
        qrCodeUrl.value = qrCodeRes.data
        startPolling()
      }
    }
  } catch (error) {
    console.error('获取二维码失败:', error)
    ms.error('获取二维码失败，请重试')
  }
}

const showBindPhoneModal = ref(false)

const user_openId = ref('')

// 开始轮询
function startPolling() {
  if (polling.value) return
  
  polling.value = window.setInterval(async () => {
    try {
      const res = await checkLoginStatus(sceneStr.value)
      if (res.success && res.data?.token) {
        // 登录成功
        clearInterval(polling.value!)
        emit('login-success', res.data.token)
      }else if(res.success && res.data && !res.data.token){
        // 需要绑定手机号
        user_openId.value = res.data?.openId || ''
        showModalPhone.value = true
      }
    } catch (error) {
      console.error('轮询失败:', error)
    }
  }, 2000)
}

// 切换登录方式
function switchLoginType(type: 'wechat' | 'phone') {
  loginType.value = type
  if (type === 'wechat') {
    getWechatQRCode()
  }
}

onMounted(() => {
  getCaptchaImg()
  if (loginType.value === 'wechat') {
    getWechatQRCode()
  }
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  if (polling.value) {
    clearInterval(polling.value)
  }
  window.removeEventListener('keydown', handleKeyDown)
})

// 修改验证码图片容器的样式
const captchaStyle = computed(() => ({
  backgroundColor: props.theme === 'dark' ? '#363f4f' : '#fff',
  minWidth: '100px',
  minHeight: '32px'
}))


const showModalPhone = ref(false);
async function updateUserPhoneInfo(options: { phone: string; phoneCode: string; openId: string }) {
  try {
    const res = await createUserBybindOpenidAPI<string>({
      phone: options.phone,
      phoneCode: options.phoneCode,
      openId: options.openId
    })
    
    if (!res.success) {
      ms.error(res.message || '绑定失败')
      return
    }
    
    // 绑定成功后关闭弹窗并触发登录成功事件
    showBindPhoneModal.value = false
    emit('login-success', res.data)
  } catch (error: any) {
    ms.error(error.message || '绑定失败，请重试')
  }
}

</script>

<template>
  <div class="login-container">
    <!-- 登录方式切换 -->
    <div class="login-type-switch">
      <button 
        :class="{ active: loginType === 'wechat' }"
        @click="switchLoginType('wechat')"
      >
        微信登录
      </button>
      <button 
        :class="{ active: loginType === 'phone' }"
        @click="switchLoginType('phone')"
      >
        手机号登录
      </button>
    </div>

    <!-- 微信登录 -->
    <div v-if="loginType === 'wechat'" class="wechat-login">
      <div class="qrcode-container">
        <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="微信二维码" />
        <div v-else class="loading">加载中...</div>
      </div>
      <p class="tip">请使用微信扫描二维码登录</p>
    </div>

    <!-- 手机号登录 -->
    <div v-else class="phone-login-custom">
      <!-- 错误提示弹窗 -->
      <Transition name="fade">
        <div v-if="errorMsg" class="error-toast-custom">
          <div class="error-content-custom">
            <span class="error-icon-custom">!</span>
            <span>{{ errorMsg }}</span>
          </div>
        </div>
      </Transition>

      <div class="login-form-custom">
        <!-- 手机号输入 -->
        <div class="input-group-custom">
          <div class="phone-prefix-custom">+86</div>
          <input
            v-model="loginForm.phone"
            type="text"
            placeholder="请输入手机号"
            class="input-custom"
            @keydown.enter="handleSubmit"
          />
        </div>

        <!-- 图形验证码 -->
        <div class="input-group-custom">
          <input
            v-model="loginForm.captchaCode"
            type="text"
            placeholder="填写图中验证码结果"
            class="input-custom"
            @keydown.enter="handleSubmit"
          />
          <div 
            v-if="captchaSvg" 
            class="captcha-img-custom"
            :style="captchaStyle"
            @click="getCaptchaImg"
          >
            <div v-html="captchaSvg" class="captcha-svg-wrapper"></div>
          </div>
        </div>

        <!-- 短信验证码 -->
        <div class="input-group-custom">
          <input
            v-model="loginForm.phoneCode"
            type="text"
            placeholder="请输入验证码"
            class="input-custom"
            @keydown.enter="handleSubmit"
          />
          <button 
            class="send-code-btn-custom"
            :disabled="lastSendPhoneCodeTime > 0 || sendingCode"
            @click="handleSendCaptcha"
          >
            {{ 
              sendingCode ? '发送中...' : 
              lastSendPhoneCodeTime > 0 ? `重新发送(${lastSendPhoneCodeTime}s)` : 
              '获取验证码' 
            }}
          </button>
        </div>

        <button
          @click="handleSubmit"
          :disabled="loading"
          class="submit-btn-custom"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </div>
    </div>
  </div>

  <n-modal v-model:show="showModalPhone" :mask-closable="false">
			<n-card
				style="width: 600px"
				title="绑定手机号"
				:bordered="false"
				class="w-full"
				role="dialog"
				aria-modal="true"
			>
				<div class="space-y-6">
					<!-- 手机号输入 -->
					<div>
						<label for="new-phone" class="block text-lg font-semibold mb-2">请输入您的手机号：</label>
						<n-input
							v-model:value="loginForm.phone"
							placeholder="请输入您的手机号"
							maxlength="11"
							show-count
							clearable
							class="w-full"
						/>
					</div>

					<!-- 图形验证码嵌入输入框 -->
					<div>
						<n-input
							v-model:value="loginForm.captchaCode"
							placeholder="请输入右侧图形验证码"
							class="w-full"
						>
							<template #suffix>
							<div v-if="captchaSvg" class="flex items-center">
							<span
							class="cursor-pointer"
							@click="getCaptchaImg"
							v-html="captchaSvg"
							/>
							</div>
							</template>
						</n-input>
					</div>

					<!-- 短信验证码 -->
					<div class="flex items-center space-x-4">
						<n-input
							v-model:value="loginForm.phoneCode"
							placeholder="请输入短信验证码"
							class="w-full"
						/>
						<n-button
							class="w-[120px]"
							type="primary"
							:disabled="lastSendPhoneCodeTime > 0"
							@click="handleSendCaptcha"
						>
							{{ lastSendPhoneCodeTime > 0 ? `重新发送(${lastSendPhoneCodeTime}S)` : '获取验证码' }}
						</n-button>
					</div>

					<!-- 提交按钮 -->
					<div class="flex justify-end mt-6">
						<n-button
							type="primary"
							@click="updateUserPhoneInfo({ phone: loginForm.phone, phoneCode: loginForm.phoneCode, openId: user_openId })"
						>
							提交
						</n-button>
					</div>
				</div>
			</n-card>
		</n-modal>


</template>

<style scoped>
.phone-login-custom {
  padding: 24px;
}

.login-form-custom {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group-custom {
  position: relative;
  display: flex;
  align-items: center;
  background-color: #383f4e;
  border: 1px solid #374151;
  border-radius: 8px;
  height: 48px;
}

.phone-prefix-custom {
  padding: 0 12px;
  color: #CBD5E1;
  border-right: 1px solid #374151;
}

.input-custom {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0 12px;
  color: #CBD5E1;
  font-size: 14px;
  outline: none;
  width: 100%;
}

.input-custom::placeholder {
  color: #6B7280;
}

.captcha-img-custom {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  overflow: hidden;
}

.captcha-svg-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}

.send-code-btn-custom {
  padding: 0 12px;
  color: #3B82F6;
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  font-size: 14px;
}

.send-code-btn-custom:disabled {
  color: #6B7280;
  cursor: not-allowed;
  opacity: 0.7;
}

.submit-btn-custom {
  background-color: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  transform: scale(1);
  transition: all 0.2s ease;
}

.submit-btn-custom:hover {
  background-color: #2563EB;
}

.submit-btn-custom:disabled {
  background-color: #6B7280;
  cursor: not-allowed;
}

.submit-btn-custom:active:not(:disabled) {
  transform: scale(0.98);
}

:deep(svg) {
  max-width: 100%;
  height: 100%;
}

/* 添加输入框焦点样式 */
.input-group-custom:focus-within {
  border-color: #3B82F6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  background-color: #383f4e;
}

/* 错误提示弹窗样式 */
.error-toast-custom {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  padding: 10px 20px;
  background-color: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  min-width: 280px;
}

.error-content-custom {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #FEE2E2;
  font-size: 14px;
}

.error-icon-custom {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background-color: rgba(220, 38, 38, 0.2);
  border: 1px solid rgba(220, 38, 38, 0.4);
  border-radius: 50%;
  font-size: 12px;
  color: #FCA5A5;
}

/* 错误提示动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -15px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translate(-50%, 0);
}

/* 添加输入框错误状态样式 */
.input-group-custom.error {
  border-color: rgba(220, 38, 38, 0.4);
  background-color: #383f4e;
}

.input-group-custom.error:focus-within {
  border-color: rgba(220, 38, 38, 0.6);
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
  background-color: #383f4e;
}

/* 添加新样式 */
.login-container {
  width: 100%;
}

.login-type-switch {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.login-type-switch button {
  padding: 8px 16px;
  border: none;
  background: none;
  color: #CBD5E1;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.login-type-switch button.active {
  color: #3B82F6;
  background-color: rgba(59, 130, 246, 0.1);
}

.wechat-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.qrcode-container {
  width: 200px;
  height: 200px;
  background-color: #fff;
  padding: 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qrcode-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.loading {
  color: #6B7280;
}

.tip {
  color: #CBD5E1;
  font-size: 14px;
}
</style> 