import api from '@/api/axios';

/**
 * 직원(회원) 목록 조회
 */
export const getEmployeeList = (params) => {
    return api.get('/employee/list', { params });
};