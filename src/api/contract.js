import api from './axios'

//계약 리스트 조회
export const getContractList = (params) => {
  return api.get('/contract/list', { params })
}

//계약 페이지 상태 조회 
export const getContractStatus = () => {
  return api.get('/contract/status')
}

// 계약 기본 정보
export const getContractBasic = (contractId) => {
  return api.get(`/contract/${contractId}/basic-info`)
}

// 계약 자산
export const getContractItems = (contractId) => {
  return api.get(`/contract/${contractId}/items`)
}

// 계약 결제 내역
export const getContractPayments = (contractId) => {
  return api.get(`/contract/${contractId}/payments`)
}

// 결제 완료
export const patchCompletePayment = (paymentId, payload) => {
  return api.patch(
    `/payment-details/${paymentId}/complete`,
    payload
  )
}

// 계약 생성 (승인 요청)
export const createContract = (payload) => {
  return api.post('/contract', payload)
}

// 계약 생성용 고객 조회 (검색 / 페이징 겸용)
export const getContractCustomers = (params) => {
  return api.get('/contract/customer', { params })
}

// 계약용 프로모션 조회 (고객 세그먼트 기준)
export const getPromotionsForContract = (segmentId) => {
  return api.get(`/promotion/use-contract/${segmentId}`)
}

// 계약 생성 시 사용 가능한 쿠폰 조회 (세그먼트 기준)
export const getCouponsForContract = (segmentId) => {
  return api.get(`/coupon/use-contract/${segmentId}`)
}

// 계약 결재선용 직원 목록 조회
export const getContractApprovers = () => {
  return api.get('/contract/emp')
}

// 계약 해지 status변경
export const patchTerminateContract = (contractId) => {
  return api.patch(`/contract/${contractId}/terminate`)
}

// 계약 삭제 is_deleted변경
export const patchDeleteContract = (contractId) => {
  return api.patch(`/contract/${contractId}/delete`)
}