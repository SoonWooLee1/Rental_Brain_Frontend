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


