// src/api/customerlist.js
import api from './axios'

// 1. 고객 목록 조회 (페이징 + 검색)
export const getCustomerList = (params) => {
  return api.get('/customers/all', { params })
}

// 2. 고객 상세 조회 (전체 이력 포함)
export const getCustomerDetail = (id) => {
  return api.get(`/customers/${id}`)
}

// 3. 고객 정보 등록 (신규 추가)
export const createCustomer = (data) => {
  return api.post('/customers', data)
}

// 4. 고객 정보 수정 (★ 요청하신 함수 추가)
export const updateCustomer = (id, data) => {
  return api.put(`/customers/${id}`, data)
}

// 5. 고객 KPI 데이터 조회 (고객 목록 화면용)
export const getCustomerKpi = () => {
  return api.get('/customers/kpi')
}