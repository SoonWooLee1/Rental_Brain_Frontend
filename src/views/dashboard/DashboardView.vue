<template>
  <div class="page-container">
    <div class="dashboard-grid">
      <!-- KPI 카드 -->
      <div class="row-full">
        <DashboardKpi />
      </div>
      
        <!-- 3열 -->
        <div class="row-3">
          <PriorityAlert />
          <AiInsight />
          <ProductStatusChart />
        </div>

      
      <!-- 2열 -->
      <div class="row-2">
        <SegmentAnalysisChart />
          <QuarterCustomerChart />

      </div>
    </div>
  </div>
</template>

<script setup>
import DashboardKpi from "@/components/dashboard/DashboardKpi.vue";
import SegmentAnalysisChart from "@/components/analysis/SegmentAnalysisChart.vue";
import PriorityAlert from "@/components/dashboard/PriorityAlert.vue";
import QuarterCustomerChart from "@/components/dashboard/QuarterCustomerChart.vue";
import AiInsight from "@/components/dashboard/AiInsight.vue";
import ProductStatusChart from "@/components/dashboard/ProductStatusChart.vue";
</script>

<style scoped>
/* 고객분석 페이지와 동일한 컨테이너 톤 */
.page-container {
  padding: 24px;              /* 20 -> 24 */
  max-width: 1440px;          /* 1400 -> 1440 (스크린샷 느낌) */
  margin: 0 auto;

  display: flex;              /* ✅ 섹션 간 간격 통일 */
  flex-direction: column;
  gap: 20px;                  /* ✅ 전체 세로 간격 기준 */
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 16px; /* 고객분석(15~16) 톤 */
}

.row-full {
  width: 100%;
}

.row-2 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

.row-3 {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 16px;
}

/* 반응형 */
@media (max-width: 1200px) {
  .row-2 { grid-template-columns: 1fr; }
  .row-3 { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 992px) {
  .row-3 { grid-template-columns: 1fr; }
}
</style>
