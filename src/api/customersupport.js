import api from './axios'

// 문의 목록 조회
export const getSupportList = (params) => {
  return api.get('/customersupports/all', { params })
}

// 문의 상세 조회
export const getSupportDetail = (id) => {
  return api.get(`/customersupports/${id}`)
}