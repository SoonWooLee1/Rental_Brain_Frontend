<template>
  <div class="dashboard">

    <!-- KPI 카드 -->
    <DashboardCards />

    <div class="middle-row">
      <CustomerSegmentChart />
      <PriorityAlert />
    </div>

    <div class="bottom-row">
      <QuarterCustomerChart />
      <AiInsight />
      <ProductStatusChart />
    </div>

  </div>
</template>

<script setup>
import DashboardCards from "@/components/dashboard/DashboardCards.vue";
import CustomerSegmentChart from "@/components/dashboard/CustomerSegmentChart.vue";
import PriorityAlert from "@/components/dashboard/PriorityAlert.vue";
import QuarterCustomerChart from "@/components/dashboard/QuarterCustomerChart.vue";
import AiInsight from "@/components/dashboard/AiInsight.vue";
import ProductStatusChart from "@/components/dashboard/ProductStatusChart.vue";
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 중간 컴포넌트 (2개) */
.middle-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 25px;
}

/* 하단 컴포넌트 (3개) */
.bottom-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 25px;
}

/* 1500px 이하 — 3개 → 2개로 재배치 */
@media (max-width: 1500px) {
  .bottom-row {
    grid-template-columns: 1fr 1fr;
  }
}

/* 1200px 이하 — 중간행도 1열로 변경 */
@media (max-width: 1200px) {
  .middle-row {
    grid-template-columns: 1fr;
  }

  .bottom-row {
    grid-template-columns: 1fr 1fr;
  }
}

/* 992px 이하 — 하단도 1열로 변경 */
@media (max-width: 992px) {
  .bottom-row {
    grid-template-columns: 1fr;
  }
}

/* 768px 이하 — 전체 대시보드 모바일 최적화 */
@media (max-width: 768px) {
  .dashboard {
    gap: 18px;
    padding: 0 10px;
  }

  .middle-row,
  .bottom-row {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}

/* KPI (위쪽 카드 4개) */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

/* 중간 카드 섹션 */
.middle-row {
  display: grid;
  grid-template-columns: minmax(500px, 2fr) minmax(300px, 1fr);
  gap: 24px;
}

/* 하단 카드 3개 */
.bottom-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

/* 모바일 감소 영역 */
@media (max-width: 1024px) {
  .middle-row {
    grid-template-columns: 1fr;
  }
}
</style>
