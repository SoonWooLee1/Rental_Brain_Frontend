import api from './axios'

// 고객 목록 조회 (페이징 + 검색)
export const getCustomerList = (params) => {
  return api.get('/customers/all', { params })
}

// 고객 상세 조회 (전체 이력 포함)
export const getCustomerDetail = (id) => {
  return api.get(`/customers/${id}`)
}