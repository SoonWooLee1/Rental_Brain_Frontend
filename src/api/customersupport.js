import api from './axios';

// 문의 목록 조회 (검색 파라미터 포함)
export const getSupportList = (params) => {
  return api.get('/customersupports/all', { params });
};

// 문의 상세 조회
export const getSupportDetail = (id) => {
  return api.get(`/customersupports/${id}`);
};

// 문의 등록
export const createSupport = (data) => {
  return api.post('/customersupports', data);
};

// KPI 통계 조회
export const getSupportKpi = () => {
  return api.get('/customersupports/kpi');
};