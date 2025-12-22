// 변수명을 axios -> api 로 변경
import api from '@/api/axios'; 

// 고객 목록 조회
export const getCustomerList = (params) => {
    return api.get('/customers/all', { params });
};

// 고객 KPI 조회
export const getCustomerKpi = () => {
    return api.get('/customers/kpi');
};

// 고객 상세 조회
export const getCustomerDetail = (id) => {
    return api.get(`/customers/${id}`);
};

// 고객 신규 등록
export const createCustomer = (data) => {
    return api.post('/customers/insertCustomer', data);
};

// 고객 정보 수정
export const updateCustomer = (id, data) => {
    return api.put(`/customers/updateCustomer/${id}`, data);
};

// 고객 삭제(소프트 딜리트)
export const deleteCustomer = (id) => {
    return api.delete(`/customers/deleteCustomer/${id}`);
};

// 고객 복구 (Restore)
export const restoreCustomer = (id) => {
    return api.put(`/customers/restoreCustomer/${id}`);
};