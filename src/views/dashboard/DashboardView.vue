<template>
  <div class="page-container">
    <div class="dashboard-grid">
      <!-- 1단: KPI -->
      <section class="row-full">
        <DashboardKpi />
      </section>

      <!-- 2단: SNAPSHOT (3열) -->
      <section class="grid-3 snapshot-row">
        
        <div
          class="panel clickable"
          role="button"
          tabindex="0"
          @click="goTo('segment')"
          @keydown.enter.prevent="goTo('segment')"
          @keydown.space.prevent="goTo('segment')"
        >
          <SegmentDistribution />
        </div>

        <div
          class="panel clickable"
          role="button"
          tabindex="0"
          @click="goTo('acquisition')"
          @keydown.enter.prevent="goTo('acquisition')"
          @keydown.space.prevent="goTo('acquisition')"
          >
          <QuarterCustomerChart />
        </div>
        <div
          class="panel clickable"
          role="button"
          tabindex="0"
          @click="goTo('product')"
          @keydown.enter.prevent="goTo('product')"
          @keydown.space.prevent="goTo('product')"
        >
          <ProductStatusChart />
        </div>
      </section>

      <!-- 3단: WORKBENCH (2열) -->
      <section class="grid-2 workbench-row">
        <div
          class="panel clickable"
          role="button"
          tabindex="0"
          @click="goTo('segment')"
          @keydown.enter.prevent="goTo('segment')"
          @keydown.space.prevent="goTo('segment')"
        >
          <SegmentAnalysisChart />
        </div>
        <div>
          <CampaignWorkbenchMock />
        </div>

      </section>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

import DashboardKpi from "@/components/dashboard/DashboardKpi.vue";
import ProductStatusChart from "@/components/dashboard/ProductStatusChart.vue";
import SegmentAnalysisChart from "@/components/analysis/SegmentAnalysisChart.vue";
import QuarterCustomerChart from "@/components/dashboard/QuarterCustomerChart.vue";
import SegmentDistribution from "@/components/analysis/SegmentDistribution.vue";
import CampaignWorkbenchMock from "@/components/dashboard/CampaignWorkbenchMock.vue";

const router = useRouter();

function goTo(key) {
  const map = {
    overdue: { name: "customer-risklist" },
    insight: { name: "promotion-list" },      // 캠페인/프로모션 관리
    product: { name: "asset-list" },          // 자산/제품
    segment: { name: "analysis-summary" },    // 고객분석 요약
    acquisition: { name: "~~" },              // 유입 탭(미정)
  };

  const target = map[key];
  if (!target) return;
  router.push(target);
}
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;

  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.row-full {
  width: 100%;
}

/* =========================
   ✅ 그리드 클래스 분리
========================= */

/* 2단: 3열 (균등) */
.grid-3 {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr;
  gap: 16px;
  align-items: stretch;
}

/* 3단: 2열 (워크벤치가 더 넓게) */
.grid-2 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  align-items: stretch;
}

/* 패널이 row 높이를 꽉 채우도록 */
.panel {
  width: 100%;
  height: 100%;
  display: flex;
}

.panel > * {
  width: 100%;
  height: 100%;
}

/* 클릭 공통 */
.clickable {
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
  will-change: transform;
  border-radius: 14px;
}

.clickable:hover {
  transform: translateY(-3px);
  filter: drop-shadow(0 10px 24px rgba(17, 24, 39, 0.10));
}

.clickable:active {
  transform: translateY(-1px) scale(0.99);
  filter: drop-shadow(0 6px 14px rgba(17, 24, 39, 0.08));
}

.clickable:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.25);
  outline-offset: 2px;
}

/* 섹션 간 간격 */
.snapshot-row { margin-top: 2px; }
.workbench-row { margin-top: 6px; }

/* =========================
   Responsive
========================= */
@media (max-width: 1200px) {
  .grid-3 { grid-template-columns: 1fr 1fr; }
  .grid-2 { grid-template-columns: 1fr; }
}

@media (max-width: 900px) {
  .grid-3 { grid-template-columns: 1fr; }
}
</style>

