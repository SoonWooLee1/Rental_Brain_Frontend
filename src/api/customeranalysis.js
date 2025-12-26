import api from "@/api/axios";

/**
 * ===========================
 * 고객 요약 분석 (Summary)
 * ===========================
 */

/**
 * 고객 요약 KPI (스냅샷)
 * @param {string} month - 기준 월 (YYYY-MM)
 */
export const getCustomerSummaryKpi = (month) =>
  api.get("/customerSummaryAnalysis/kpi", {
    params: { month },
  });

/**
 * 월별 이탈 위험률 트렌드
 * @param {string} from - 시작 월 (YYYY-MM)
 * @param {string} to   - 종료 월 (YYYY-MM)
 */
export const getMonthlyRiskRate = (from, to) =>
  api.get("/customerSummaryAnalysis/risk-monthly-rate", {
    params: { from, to },
  });

/**
 * 만족도 분포 (1~5점)
 */
export const getSatisfactionDist = () =>
  api.get("/customerSummaryAnalysis/satisfaction");

/**
 * 고객 세그먼트 분포 (도넛 차트)
 */
export const getSegmentDistribution = () =>
  api.get("/customerSummaryAnalysis/segment-distribution");

/**
 * 만족도 별 고객 목록
 * @param {number} star
 * @param {number} page
 * @param {number} size
 */
export const getSatisfactionCustomers = (star, page = 1, size = 10) =>
  api.get(`/customerSummaryAnalysis/satisfaction/${star}/customers`, {
    params: { page, size },
  });

/**
 * ===========================
 * 고객 응대 분석 (Support)
 * ===========================
 */

/**
 * 고객 응대 KPI (스냅샷)
 * @param {string} month - 기준 월 (YYYY-MM)
 */
export const getCustomerSupportKpi = (month) =>
  api.get("/customerSupportAnalysis/kpi", {
    params: { month },
  });

/**
 * 고객 응대 월별 트렌드
 * @param {number} year - 조회 연도 (선택)
 */
export const getMonthlyTrend = (year) =>
  api.get("/customerSupportAnalysis/monthly-trend", {
    params: year ? { year } : {},
  });

/**
 * 이탈 위험 고객 비중 KPI
 * @param {string} month - 기준 월 (YYYY-MM)
 */
export const getRiskKpi = (month) =>
  api.get("/customersegmentanalysis/riskKpi", {
    params: { month },
  });

/**
 * 이탈 위험 사유 분포
 * @param {string} month - 기준 월 (YYYY-MM)
 */
export const getRiskReasonKpi = (month) =>
  api.get("/customersegmentanalysis/riskReasonKpi", {
    params: { month },
  });

/**
 * 고객 세그먼트별 거래 차트
 * @param {string} month - 기준 월 (YYYY-MM)
 */
export const getSegmentTradeChart = (month) =>
  api.get("/customersegmentanalysis/segmentTradeChart", {
    params: { month },
  });

/**
 * 고객 세그먼트 상세 카드
 * @param {number} segmentId
 */
export const getCustomerSegmentDetailCard = (segmentId) =>
  api.get("/customersegmentanalysis/segmentCard", {
    params: { segmentId },
  });

/**
 * 월별 견적/상담 데이터를 기반으로 AI 인사이트 JSON을 생성
 * @param {string} month - 기준 월 (YYYY-MM)
 * @param {number} windowDays - 성공 판정 윈도우(견적일 이후 N일 내 계약 시작일 존재 시 성공)
 * @param {number} sampleEach - 성공/실패 각각 샘플링할 최대 건수
 */
export const getQuoteAnalyze = (month, windowDays = 60, sampleEach = 50) =>
  api.post("/insight/quoteAnalyze", null, {
    params: { month, windowDays, sampleEach },
  });