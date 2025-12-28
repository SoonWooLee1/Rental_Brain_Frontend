import api from "@/api/axios"; 
/**
 * ===========================
 * Dashboard Query APIs
 * ===========================
 */

/**
 * 분기별 고객 수 트렌드 조회
 * - 신규 고객: 해당 분기에 '첫 계약'이 발생한 고객
 * - 전체 고객: 분기말 기준 누적 고객
 *
 * @param {number} year - 조회 연도 (선택, 미지정 시 서버에서 현재 연도)
 */
export const getQuarterlyCustomerTrend = (year) => {
  return api.get("/dashboard/quarterly", {
    params: year ? { year } : {},
  });
};

/**
 * (추후 확장용) 로그인 대시보드 KPI 조회
 * 예: 만료 임박 / 연체 / 문의 대기 / 매출
 *
 * @param {string} month - 기준 월 (YYYY-MM)
 */
export const getDashboardKpi = (month) => {
  return api.get("/dashboard/kpi", {
    params: month ? { month } : {},
  });
};

/**
 * (추후 확장용) 우선순위 알림 조회
 */
export const getDashboardAlerts = () => {
  return api.get("/dashboard/alerts");
};

/**
 * (추후 확장용) 시스템 추천(AI 인사이트)
 */
export const getDashboardRecommendations = () => {
  return api.get("/dashboard/recommendations");
};

/**
 * AI 인사이트(추천/요약) 조회
 * - month(YYYY-MM) 옵션을 주면 해당 월 기준으로 조회
 */
export const getDashboardAiInsight = (month) => {
  return api.get("/dashboard/recommendations", {
    params: month ? { month } : {},
  });
};

/**
 * 만족도(별점)별 고객 목록 조회
 *
 * @param {number} star - 만족도 (1~5)
 * @param {number} page - 페이지 번호 (1-base)
 * @param {number} size - 페이지 사이즈
 */
export const getCustomersBySatisfaction = (star, page = 1, size = 10) => {
  return api.get(
    `/customerSummaryAnalysis/satisfaction/${star}/customers`,
    {
      params: { page, size },
    }
  );
};