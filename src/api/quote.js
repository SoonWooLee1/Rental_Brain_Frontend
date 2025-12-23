// 변수명을 axios -> api 로 변경
import api from '@/api/axios';


// 견적 상담 목록 조회
export const getQuoteList = (params) => {
    return api.get('/quote/all', { params });
};

// 견적 상담 KPI 조회
export const getQuoteKpi = (params) => {
    return api.get('/quote/kpi', { params });
};

// 견적 상담 상세 조회
export const getQuoteDetail = (quoteId) => {
    return api.get(`/quote/${quoteId}`);
};

// 견적 상담 신규 등록
export const createQuote = (data) => {
    return api.post('/quote/insert', data);
};

// 견적 상담 수정
export const updateQuote = (quoteId, data) => {
    return api.put(`/quote/update/${quoteId}`, data);
};

// 견적 상담 삭제
export const deleteQuote = (quoteId) => {
    return api.delete(`/quote/delete/${quoteId}`);
};

// 채널 조회
export const selectChannelList = () => api.get('/channel/list');