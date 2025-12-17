import api from './axios'

// 피드백 목록 조회
export const getFeedbackList = (params) => {
  return api.get('/feedbacks/all', { params })
}

// 피드백 상세 조회
export const getFeedbackDetail = (id) => {
  return api.get(`/feedbacks/${id}`)
}