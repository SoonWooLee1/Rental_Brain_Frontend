// src/api/customeranalysis.js
import api from '@/api/axios';

// 고객 요약 분석 (Summary)

// 1) KPI (상단 5개 카드)
export const getCustomerSummaryKpi = (month) =>
  api.get('/customerSummaryAnalysis/kpi', { params: { month } });

// 2) 월별 이탈 위험률 차트
export const getMonthlyRiskRate = (from, to) =>
  api.get('/customerSummaryAnalysis/risk-monthly-rate', {
    params: { from, to },
  });

// 3) 만족도 분포 (1~5점)
export const getSatisfactionDist = () =>
  api.get('/customerSummaryAnalysis/satisfaction');

// 4) 고객 세그먼트 분포 (도넛 차트)
export const getSegmentDistribution = () =>
  api.get('/customerSummaryAnalysis/segment-distribution');

// 5) 만족도 별 고객 목록 (선택)
export const getSatisfactionCustomers = (star, page = 1, size = 10) =>
  api.get(`/customerSummaryAnalysis/satisfaction/${star}/customers`, {
    params: { page, size },
  });


// 고객 응대 분석 (Support)

// 응대 KPI
export const getCustomerSupportKpi = (month) =>
  api.get('/customerSupportAnalysis/kpi', {
    params: { month },
  });


// 월별 응대 트렌드
export const getMonthlyTrend = (year) =>
  api.get("/customerSupportAnalysis/monthly-trend", { params: { year } });

// 고객 세그먼트 분석 (Segment)

// 이탈 위험 고객 비중 KPI
export const getRiskKpi = (month) =>
  api.get('/customersegmentanalysis/riskKpi', {
    params: { month },
  });

// 이탈 위험 사유 분포
export const getRiskReasonKpi = (month) =>
  api.get('/customersegmentanalysis/riskReasonKpi', {
    params: { month },
  });
