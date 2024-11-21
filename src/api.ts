import axios from 'axios'
import { userState } from './store/user'

const API_URL2 = 'https://ai.wtc.edu.cn/api/codefix/fix' // 免费
const API_URL1 = 'https://ai.wtc.edu.cn/api/codefix/fixOfVIP' // 付费

interface CorrectionRequest {
  code: string
  add_info: string
  isAdvanced?: boolean
  language?: string
}

interface CorrectionResponse {
  error_location: string
  correct_code: string
  related_knowledge: string
}

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

export async function correctCode(data: CorrectionRequest): Promise<CorrectionResponse> {
  try {
    // 根据用户权限和选择的模型决定使用哪个 API
    const useAdvancedApi = userState.value.userBalance?.codeExpirationDate && new Date(userState.value.userBalance?.codeExpirationDate) > new Date() && data.isAdvanced
    const apiUrl = useAdvancedApi ? API_URL1 : API_URL2
    
    const response = await axios.post<CorrectionResponse>(apiUrl, {
      code: data.code,
      add_info: data.add_info,
    }, {
      headers: getHeaders()
    })
    console.log("response", response);
    
    return response.data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}