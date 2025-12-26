import api from './axios';

// 피드백 목록 조회
export const getFeedbackList = (params) => {
  return api.get('/feedbacks/all', { params });
};

// 피드백 상세 조회
export const getFeedbackDetail = (id) => {
  return api.get(`/feedbacks/${id}`);
};

// [추가] 피드백 KPI 조회
export const getFeedbackKpi = () => {
  return api.get('/feedbacks/kpi');
};

// [추가] 피드백 등록
export const createFeedback = (data) => {
  return api.post('/feedbacks/insertFeedback', data);
};

// [추가] 피드백 수정
export const updateFeedback = (id, data) => {
  return api.put(`/feedbacks/updateFeedback/${id}`, data);
};

// [추가] 피드백 삭제
export const deleteFeedback = (id) => {
  return api.delete(`/feedbacks/deleteFeedback/${id}`);
};