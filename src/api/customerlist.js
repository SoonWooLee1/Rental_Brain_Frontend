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

// ▼ 수정: 백엔드 경로(/customers/insertCustomer)에 맞춤
export const createCustomer = (data) => {
    return axios.post('/customers/insertCustomer', data);
};

// ▼ 수정: 백엔드 경로(/customers/updateCustomer/{id})에 맞춤
export const updateCustomer = (id, data) => {
    return axios.put(`/customers/updateCustomer/${id}`, data);
};

// ▼ 수정: 백엔드 경로(/customers/deleteCustomer/{id})에 맞춤
export const deleteCustomer = (id) => {
    return axios.delete(`/customers/deleteCustomer/${id}`);
};