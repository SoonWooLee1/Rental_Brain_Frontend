<template>
  <div class="page-container">
    <!-- 헤더 -->
    <div class="header-row">
      <div class="title-area">
        <h2 class="page-title">고객 세그먼트 분석</h2>
        <p class="page-subtitle">고객을 상태와 행동 기준으로 분류하여 이탈 위험과 관리 우선순위를 파악합니다.</p>
      </div>
    </div>

    <div class="grid-2">
      <!-- (1) 이탈 위험 고객 비중 -->
      <div class="card">
        <div class="kpi-head">
          <div class="icon warn">⚠️</div>
          <div>
            <div class="kpi-title">이탈 위험 고객 비중</div>
            <div class="kpi-value">{{ round1(risk?.currentRiskRate) }}%</div>
          </div>
        </div>

        <div class="kpi-subline">
          {{ fmt(risk?.currentRiskCustomerCount) }}개사 관리 필요 / 전체 대비
        </div>

        <div class="kpi-sub">
          <span :class="(risk?.momDiffRate ?? 0) <= 0 ? 'up' : 'down'">
            전월 대비 {{ (risk?.momDiffRate ?? 0) >= 0 ? "+" : "" }}{{ round1(risk?.momDiffRate) }}%p
            {{ (risk?.momDiffRate ?? 0) <= 0 ? "(위험 고객 감소 중)" : "(위험 고객 증가 중)" }}
          </span>
        </div>
      </div>

      <!-- (2) 이탈 위험 사유 분포 -->
      <div class="card">
        <div class="kpi-head">
          <div class="icon purple">△</div>
          <div>
            <div class="kpi-title">이탈 위험 사유 분포</div>
            <div class="kpi-subtitle">원인별 비중</div>
          </div>
        </div>

        <div class="reason-list">
          <div v-for="r in reasons" :key="r.reasonCode" class="reason-row">
            <span class="reason-label">{{ reasonLabel(r.reasonCode) }}</span>
            <span class="reason-value">{{ round1(r.ratio) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { getRiskKpi, getRiskReasonKpi } from "@/api/customeranalysis";

const route = useRoute();
const isActive = (path) => route.path === path;

// 두 API month를 다르게 호출하길래(너 예시처럼) 일단 각각 query로 분리 가능하게 처리
const monthRisk = computed(() => route.query.month ?? "2025-12");
const monthReason = computed(() => route.query.reasonMonth ?? route.query.month ?? "2025-08");

const risk = ref(null);
const reasons = ref([]);

const fetchAll = async () => {
  const [a, b] = await Promise.all([
    getRiskKpi(monthRisk.value),
    getRiskReasonKpi(monthReason.value),
  ]);
  risk.value = a.data;
  reasons.value = b.data ?? [];
};

onMounted(fetchAll);

const fmt = (n) => (Number(n) || 0).toLocaleString();
const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

const reasonLabel = (code) => {
  switch (code) {
    case "EXPIRING": return "계약 만료 임박형";
    case "LOW_SAT": return "저만족(≤2.5)형";
    case "OVERDUE": return "연체형";
    case "NO_RENEWAL": return "만료+무재계약";
    default: return code;
  }
};
</script>

<style scoped>
/* QuoteListView 톤 */
.page-container { padding: 20px; max-width: 1400px; margin: 0 auto; }
.header-row { margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: 700; color:#333; margin:0; }
.page-subtitle { margin: 6px 0 0; color:#6b7280; font-size: 13px; }

.tab-row { display:flex; gap:16px; padding: 10px 0 16px; border-bottom:1px solid #eee; margin-bottom:20px; }
.tab { text-decoration:none; color:#6b7280; font-weight:700; padding:10px 4px; }
.tab.active { color:#2563eb; border-bottom:2px solid #2563eb; }

.grid-2 { display:grid; grid-template-columns: 1fr 1fr; gap: 15px; }

.card { background:#fff; border:1px solid #eee; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }

.kpi-head { display:flex; gap:12px; align-items:center; }
.icon { width:42px; height:42px; border-radius: 12px; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:900; }
.icon.warn { background:#fff7ed; color:#9a3412; }
.icon.purple { background:#f5f3ff; color:#6d28d9; }

.kpi-title { font-size: 12px; color:#666; font-weight:600; }
.kpi-subtitle { margin-top: 4px; font-size: 12px; color:#6b7280; font-weight:700; }
.kpi-value { font-size: 26px; font-weight: 800; color:#111827; margin-top:4px; }

.kpi-subline { margin-top: 10px; font-size: 12px; color:#6b7280; font-weight:700; }
.kpi-sub { margin-top: 8px; font-size: 12px; }

.up { color:#16a34a; font-weight:800; }
.down { color:#ef4444; font-weight:800; }

.reason-list { margin-top: 14px; display:flex; flex-direction:column; gap: 10px; }
.reason-row { display:flex; justify-content:space-between; font-size: 12px; }
.reason-label { color:#374151; font-weight:800; }
.reason-value { color:#111827; font-weight:900; }

@media (max-width: 1200px) {
  .grid-2 { grid-template-columns: 1fr; }
}
</style>
