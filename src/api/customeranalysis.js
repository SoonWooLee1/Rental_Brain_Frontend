import api from "@/api/axios";

/**
 * ===========================
 * 고객 요약 분석 (Summary)
 * ===========================
 */

/** 고객 요약 KPI */
export const getCustomerSummaryKpi = (month) =>
  api.get("/customerSummaryAnalysis/kpi", {
    params: { month },
  });

// 이제 안씀
// /**  고객 요약 - 이탈 위험 KPI */
// export const getCustomerSummaryRiskKpi = (month) =>
//   api.get("/customerSummaryAnalysis/riskKpi", {
//     params: { month },
//   });

/** 월별 이탈 위험률 트렌드 */
// 기존: /customerSummaryAnalysis/risk-monthly-rate (스냅샷 기반)
// 변경: /customerSegmentAnalysis/risk-monthly-rate (월말 기준 history 기반)
export const getMonthlyRiskRate = (from, to) =>
  api.get("/customerSegmentAnalysis/risk-monthly-rate", {
    params: { from, to },
  });

/** 만족도 분포 (1~5점) - 요약분석 */
export const getSatisfactionDist = (month) =>
  api.get("/customerSummaryAnalysis/satisfaction", {
    params: month ? { month } : {},
  });

/** 고객 세그먼트 분포 (도넛 차트) */
export const getSegmentDistribution = () =>
  api.get("/customerSummaryAnalysis/segment-distribution");

/** 세그먼트 상세(고객 리스트 포함) */
export const getSegmentDetailWithCustomers = (segmentId) =>
  api.get(`/segment/list/${segmentId}`);

/**
 * 만족도(별점)별 고객 목록 조회
 * GET /customerSummaryAnalysis/satisfaction/{star}/customers?page=1&size=10
 */
export const getSatisfactionCustomersByStar = (star, page = 1, size = 10) => {
  return api.get(`/customerSummaryAnalysis/satisfaction/${star}/customers`, {
    params: { page, size },
  });
};

/**
 * ===========================
 * 고객 응대 분석 (Support)
 * ===========================
 */

/** 고객 응대 KPI */
export const getCustomerSupportKpi = (month) => {
  return api.get("/customerSupportAnalysis/kpi", {
    params: month ? { month } : {},
  });
};

/** 고객 응대 월별 트렌드 */
export const getMonthlyTrend = (year) =>
  api.get("/customerSupportAnalysis/monthly-trend", {
    params: year ? { year } : {},
  });

export const getMonthlyDetail = ({ month, type, page = 1, size = 10 }) =>
  api.get("/customerSupportAnalysis/monthly-detail", {
    params: { month, type, page, size },
  });

/**
 * ===========================
 * 고객 세그먼트 분석 (Segment)
 * ===========================
 */

export const getRiskKpi = (month) =>
  api.get("/customerSegmentAnalysis/riskKpi", {
    params: { month },
  });

export const getRiskReasonKpi = (month) =>
  api.get("/customerSegmentAnalysis/riskReasonKpi", {
    params: { month },
  });

export const getSegmentTradeChart = (month) =>
  api.get("/customerSegmentAnalysis/segmentTradeChart", {
    params: { month },
  });

export const getCustomerSegmentDetailCard = (segmentId) =>
  api.get("/customerSegmentAnalysis/segmentCard", {
    params: { segmentId },
  });

export const getRiskReasonCustomers = (month, reasonCode) =>
  api.get("/customerSegmentAnalysis/riskReasonCustomers", {
    params: { month, reasonCode },
  });

  
export const getRiskCustomersByMonth = (month, page = 1, size = 20) =>
  api.get("/customerSegmentAnalysis/risk-customers", {
    params: { month, page, size },
  });
