import api from './axios';

// 문의 목록 조회 (Query Controller 경로 유지 /customersupports/all)
export const getSupportList = (params) => {
  return api.get('/customersupports/all', { params });
};

// 문의 상세 조회
export const getSupportDetail = (id) => {
  return api.get(`/customersupports/${id}`);
};

// [수정] 문의 등록 (Controller: /insertSupport)
export const createSupport = (data) => {
  return api.post('/customersupports/insertSupport', data);
};

// [수정] 문의 수정 (Controller: /updateSupport/{id})
export const updateSupport = (id, data) => {
  return api.put(`/customersupports/updateSupport/${id}`, data);
};

// [수정] 문의 삭제 (Controller: /deleteSupport/{id})
export const deleteSupport = (id) => {
  return api.delete(`/customersupports/deleteSupport/${id}`);
};

// KPI 조회
export const getSupportKpi = () => {
  return api.get('/customersupports/kpi');
};

// 담당자 목록 조회
export const getInChargeList = () => {
  return api.get('/customersupports/in-charge');
};