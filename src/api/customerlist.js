import api from './axios'

// 고객 목록 조회 (파라미터: pageNum, amount, keyword, segments)
export const getCustomerList = (params) => {
  return api.get('/customers/all', {
    params: { ...params },
    paramsSerializer: (params) => {
      const searchParams = new URLSearchParams()
      for (const key in params) {
        const value = params[key]
        if (Array.isArray(value)) {
          // 배열인 경우 (예: segments=['VIP', '신규']) -> segments=VIP&segments=신규
          value.forEach(v => searchParams.append(key, v))
        } else if (value !== undefined && value !== null && value !== '') {
          // 일반 값인 경우 (빈 문자열 제외)
          searchParams.append(key, value)
        }
      }
      return searchParams.toString()
    }
  })
}

// KPI 조회
export const getCustomerKpi = () => api.get('/customers/kpi')

// 상세 조회
export const getCustomerDetail = (id) => api.get(`/customers/${id}`)

// [Command] RPC 스타일 URL
export const createCustomer = (data) => api.post('/customers/insertCustomer', data)
export const updateCustomer = (id, data) => api.put(`/customers/updateCustomer/${id}`, data)
export const deleteCustomer = (id) => api.delete(`/customers/deleteCustomer/${id}`)
export const restoreCustomer = (id) => api.put(`/customers/restoreCustomer/${id}`)