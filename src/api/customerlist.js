import axios from '@/api/axios'; // axios 인스턴스 경로 확인

// 고객 목록 조회
export const getCustomerList = (params) => {
    return axios.get('/customers/all', { params });
};

// 고객 KPI 조회
export const getCustomerKpi = () => {
    return axios.get('/customers/kpi');
};

// 고객 상세 조회
export const getCustomerDetail = (id) => {
    return axios.get(`/customers/${id}`);
};

// 고객 신규 등록
export const createCustomer = (data) => {
    return axios.post('/customers/insertCustomer', data);
};

// 고객 정보 수정
export const updateCustomer = (id, data) => {
    return axios.put(`/customers/updateCustomer/${id}`, data);
};

// 고객 삭제(소프트 딜리트)
export const deleteCustomer = (id) => {
    return axios.delete(`/customers/deleteCustomer/${id}`);
};

// 고객 복구 (Restore)
export const restoreCustomer = (id) => {
    return axios.put(`/customers/restoreCustomer/${id}`);
};