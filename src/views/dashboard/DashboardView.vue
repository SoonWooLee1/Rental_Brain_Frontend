<template>
  <div class="page-container">
<!-- ❌ 권한 없음 -->
    <div v-if="!canViewDashboard" class="no-permission">
      <el-icon class="lock-icon"><Lock /></el-icon>
      <h2>대시보드 접근 권한이 없습니다</h2>
      <p>
        이 페이지를 이용하려면 관리자에게<br />
        권한 요청을 해주세요.
      </p>
    </div>
    <div v-else class="dashboard-grid">
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

        <!-- 미가동 자산 추정 매출 기회 -->
        <div
          class="panel clickable"
          role="button"
          tabindex="0"
          @click="goTo('product')"
          @keydown.enter.prevent="goTo('product')"
          @keydown.space.prevent="goTo('product')"
        >
          <ProductStatus />
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
          <CouponWorkbenchMock />
        </div>

      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from "vue-router";
import { Lock } from '@element-plus/icons-vue'


import DashboardKpi from "@/components/dashboard/DashboardKpi.vue";
import ProductStatus from "@/components/dashboard/ProductStatus.vue";
import SegmentAnalysisChart from "@/components/analysis/SegmentAnalysisChart.vue";
import QuarterCustomerChart from "@/components/dashboard/QuarterCustomerChart.vue";
import SegmentDistribution from "@/components/analysis/SegmentDistribution.vue";
import CampaignWorkbenchMock from "@/components/dashboard/CampaignWorkbenchMock.vue";
import CouponWorkbenchMock from "@/components/dashboard/CouponWorkbenchMock.vue";

const authStore = useAuthStore();
const router = useRouter();

const canViewDashboard = computed(() =>
  authStore.hasAuth('DASHBOARD_READ')
)

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
  .no-permission {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  background: #f9fafb;
  border-radius: 16px;
  border: 1px dashed #e5e7eb;

  text-align: center;
}

.lock-icon {
  font-size: 56px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.no-permission h2 {
  font-size: 20px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 8px;
}

.no-permission p {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}

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

/* 2단: 3열 (균등) */
.grid-3 {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr; /* ✅ 여기만 3fr → 2fr */
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
  min-width: 0;          /* ✅ 핵심: 그리드/플렉스 overflow 튐 방지 */
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

