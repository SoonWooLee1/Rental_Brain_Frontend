<template>
  <div class="page-container">
    <!-- 헤더 -->
    <div class="header-row">
      <div class="title-area">
        <h2 class="page-title">고객 세그먼트 분석</h2>
        <p class="page-subtitle">
          고객을 상태와 행동 기준으로 분류하여 이탈 위험과 관리 우선순위를 파악합니다.
        </p>
      </div>

      <div class="header-actions">
        <div class="seg-toggle">
          <button class="seg-btn" :class="{ active: mode === 'this' }" @click="setThisMonth">
            이번 달
          </button>
          <button class="seg-btn" :class="{ active: mode === 'prev' }" @click="setPrevMonth">
            전월
          </button>
          <button class="seg-btn" :class="{ active: mode === 'pick' }" @click="mode = 'pick'">
            선택 월
          </button>
        </div>

        <div v-if="mode === 'pick'" class="month-pick">
          <input type="month" v-model="pickedMonth" class="month-input" />
          <button class="apply-btn" @click="applyPickedMonth">적용</button>
        </div>

        <div class="month-badge">{{ risk?.snapshotMonth ?? month }} 기준</div>
      </div>
    </div>

    <!-- =========================
         KPI Summary
    ========================== -->

        <!-- 한 줄 요약 -->
    <AnalysisSummary :text="segmentSummary.text" :tone="segmentSummary.tone" />

    <div class="grid-2">
      <!-- 이탈 위험 고객 비중 -->
      <div class="card clickable" @click="openRiskSegmentModal">
        <div class="kpi-head">
          <div>
            <div class="kpi-title">이탈 위험 고객 비중</div>
            <div class="kpi-value">{{ round1(risk?.curRiskRate) }}%</div>
          </div>
        </div>

        <div class="kpi-subline">
          {{ fmt(risk?.curRiskCustomerCount) }}개사 관리 필요 / 전체 대비
        </div>

        <div class="kpi-sub">
          <span :class="(risk?.momDiffRate ?? 0) <= 0 ? 'up' : 'down'">
            전월 대비
            {{ (risk?.momDiffRate ?? 0) >= 0 ? "+" : "" }}{{ round1(risk?.momDiffRate) }}%p
            {{ (risk?.momDiffRate ?? 0) <= 0 ? "(위험 고객 감소 중)" : "(위험 고객 증가 중)" }}
          </span>
        </div>
      </div>

      <!-- 이탈 위험 사유 분포 -->
      <div class="card clickable" @click="openRiskReasonModal()">
        <div class="kpi-head">
          <div>
            <div class="kpi-title">이탈 위험 사유 분포</div>
            <div class="kpi-subtitle">원인별 비중</div>
          </div>
        </div>

        <div class="reason-list">
          <div
            v-for="r in reasons"
            :key="r.reasonCode"
            class="reason-row clickable-row"
            @click.stop="openRiskReasonModal(r.reasonCode)"
          >
            <span class="reason-label">{{ reasonLabel(r.reasonCode) }}</span>
            <span class="reason-value">{{ round1(r.ratio) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2 insight-charts">
      <RiskMonthlyRate @monthClick="openRiskCustomersModal" />
      <!-- 모달 컴포넌트 추가 -->
      <RiskCustomersModal v-model:open="riskModalOpen" :month="selectedMonth" />

      <SegmentDistribution @select-segment="openSegmentModal" />
    </div>

     <!-- 세그먼트 분석 차트 -->
    <SegmentAnalysisChart @select-segment="openSegmentModal" />

  
    <SegmentCustomersModal
      :open="segModalOpen"
      :segmentId="segModalSegmentId"
      @close="segModalOpen = false"
    />

    <RiskReasonCustomersModal
      :open="reasonModalOpen"
      :month="month"
      :defaultReasonCode="selectedReasonCode"
      :reasons="reasons"
      @close="reasonModalOpen = false"
    />
  </div>
</template>
<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getRiskKpi, getRiskReasonKpi } from "@/api/customeranalysis";

import SegmentAnalysisChart from "@/components/analysis/SegmentAnalysisChart.vue";
import SegmentDistribution from "@/components/analysis/SegmentDistribution.vue";
import RiskMonthlyRate from "@/components/analysis/RiskMonthlyRate.vue";
import RiskCustomersModal from "@/components/analysis/RiskCustomersModal.vue";
import SegmentCustomersModal from "@/components/analysis/SegmentCustomersModal.vue";
import RiskReasonCustomersModal from "@/components/analysis/RiskReasonCustomersModal.vue";
import AnalysisSummary from "@/components/analysis/AnalysisSummary.vue";

const route = useRoute();
const router = useRouter();

/* =========================
   ✅ 모달 상태 (정리)
========================= */
// ✅ 월별 위험고객 모달
const riskModalOpen = ref(false);
const selectedMonth = ref("");

// ✅ 세그먼트 고객 리스트 모달
const RISK_SEGMENT_ID = 4;
const segModalOpen = ref(false);
const segModalSegmentId = ref(RISK_SEGMENT_ID);

// ✅ 사유별 위험고객 모달
const reasonModalOpen = ref(false);
const selectedReasonCode = ref("OVERDUE");

const emit = defineEmits(["select-segment"]);


/* =========================
   ✅ 차트 클릭 -> 위험고객 모달 오픈 (핵심 연결)
========================= */
const openRiskCustomersModal = (m) => {
  if (!m) return;
  selectedMonth.value = m;     // YYYY-MM
  riskModalOpen.value = true;  // ✅ 이것만으로 모달이 열리고,
                               //    모달 내부 watch에서 fetch함
};

/* =========================
   KPI 클릭
========================= */
const openRiskSegmentModal = () => {
  segModalSegmentId.value = RISK_SEGMENT_ID;
  segModalOpen.value = true;
};

const openRiskReasonModal = (code = "OVERDUE") => {
  selectedReasonCode.value = code;
  reasonModalOpen.value = true;
};

// 세그먼트 차트/카드 클릭 모달
const openSegmentModal = (segmentId) => {
  segModalSegmentId.value = Number(segmentId);
  segModalOpen.value = true;
};

/* =========================
   Month (route.query.month)
========================= */
const now = new Date();
const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const month = computed(() => route.query.month ?? defaultMonth);

/** 토글 모드 */
const mode = ref("this");
/** 선택월 input 값 */
const pickedMonth = ref("");

/** YYYY-MM */
const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const addMonths = (baseYM, diff) => {
  const [y, m] = String(baseYM).split("-").map(Number);
  const d = new Date(y, m - 1 + diff, 1);
  return ym(d);
};

const setMonthQuery = (m) => {
  router.replace({ query: { ...route.query, month: m } });
};

const setThisMonth = () => {
  mode.value = "this";
  const m = ym(new Date());
  pickedMonth.value = m;
  setMonthQuery(m);
};

const setPrevMonth = () => {
  mode.value = "prev";
  const m = addMonths(ym(new Date()), -1);
  pickedMonth.value = m;
  setMonthQuery(m);
};

const applyPickedMonth = () => {
  mode.value = "pick";
  if (!pickedMonth.value) return;
  setMonthQuery(pickedMonth.value);
};

/** month 기준 mode 자동 정렬 */
watch(
  month,
  (m) => {
    const thisM = ym(new Date());
    const prevM = addMonths(thisM, -1);

    if (m === thisM) mode.value = "this";
    else if (m === prevM) mode.value = "prev";
    else mode.value = "pick";

    pickedMonth.value = m;
  },
  { immediate: true }
);

/* =========================
   API
========================= */
const risk = ref(null);
const reasons = ref([]);

const fetchAll = async () => {
  const [a, b] = await Promise.all([getRiskKpi(month.value), getRiskReasonKpi(month.value)]);
  risk.value = a.data;
  reasons.value = b.data ?? [];
};

onMounted(fetchAll);
watch(month, fetchAll);

/* =========================
   One-line summary
========================= */
const segmentSummary = computed(() => {
  const r = risk.value;
  if (!r) return { text: "세그먼트 지표를 불러오는 중입니다.", tone: "neutral", icon: "ℹ️" };

  const riskRate = Number(r?.curRiskRate ?? 0);
  const momP = Number(r?.momDiffRate ?? r?.momDiffP ?? 0);
  const riskCnt = Number(r?.curRiskCustomerCount ?? 0);

  if (riskRate >= 8 || momP >= 3) {
    return {
      text: `이탈 위험 고객 비중 ${round1(riskRate)}%(${fmt(riskCnt)}개사)로 증가 중입니다. 우선순위 케어 액션이 필요합니다.`,
      tone: "danger",
      icon: "🔴",
    };
  }

  if (riskRate >= 4) {
    return {
      text: `이탈 위험 고객 ${round1(riskRate)}%가 감지됩니다. 조기 케어/재계약 유도 액션을 추천합니다.`,
      tone: "warn",
      icon: "🟡",
    };
  }

  return {
    text: `현재 이탈 위험 고객 세그먼트 비중은 낮고, 고객 분포는 전반적으로 안정적입니다.`,
    tone: "good",
    icon: "🟢",
  };
});

/* =========================
   Utils
========================= */
const fmt = (n) => (Number(n) || 0).toLocaleString();
const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

const reasonLabel = (code) => {
  switch (code) {
    case "EXPIRING":
      return "계약 만료 임박형";
    case "LOW_SAT":
      return "저만족(≤2.5)형";
    case "OVERDUE":
      return "연체형";
    case "NO_RENEWAL":
      return "만료+무재계약";
    default:
      return code;
  }
};
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;

  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 헤더 */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}
.page-subtitle {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
}

/* 토글 UI */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.seg-toggle {
  display: inline-flex;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}
.seg-btn {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 800;
  color: #374151;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.seg-btn + .seg-btn {
  border-left: 1px solid #e5e7eb;
}
.seg-btn.active {
  background: #111827;
  color: #fff;
}
.month-pick {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.month-input {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 700;
}
.apply-btn {
  border: 1px solid #111827;
  background: #111827;
  color: #fff;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.month-badge {
  font-size: 12px;
  font-weight: 900;
  color: #111827;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 8px 10px;
  border-radius: 999px;
}

/* 컨텐츠 */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 22px 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.kpi-head {
  display: flex;
  gap: 12px;
  align-items: center;
}

.icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 900;
}
.icon.warn {
  background: #fff7ed;
  color: #9a3412;
}
.icon.purple {
  background: #f5f3ff;
  color: #6d28d9;
}

.kpi-title {
  font-size: 12px;
  color: #666;
  font-weight: 600;
}
.kpi-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
}
.kpi-value {
  font-size: 26px;
  font-weight: 800;
  color: #111827;
  margin-top: 4px;
}

.kpi-subline {
  margin-top: 10px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
}
.kpi-sub {
  margin-top: 8px;
  font-size: 12px;
}

.up {
  color: #16a34a;
  font-weight: 800;
}
.down {
  color: #ef4444;
  font-weight: 800;
}

.reason-list {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.reason-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.reason-label {
  color: #374151;
  font-weight: 800;
}
.reason-value {
  color: #111827;
  font-weight: 900;
}

/* 반응형 */
@media (max-width: 1200px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
  .header-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    justify-content: flex-start;
  }
}

/* 2열 그리드 (분석 차트용) */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
}

/* 이 섹션만 살짝 여백 */
.insight-charts {
  margin-top: 16px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: stretch;
}


/* ===== Analysis one-line summary ===== */
.analysis-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #374151;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.4;
}
.analysis-summary .icon {
  font-size: 14px;
}
.analysis-summary.tone-good {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #065f46;
}
.analysis-summary.tone-warn {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}
.analysis-summary.tone-danger {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

/*  한줄평 */
.kpi-card,
.card.kpi-card {
  cursor: pointer;
  transition:
    transform 0.14s ease,
    box-shadow 0.14s ease,
    border-color 0.14s ease,
    background-color 0.14s ease;
}

.kpi-card:hover,
.card.kpi-card:hover {
  transform: translateY(-2px);
  border-color: #d1d5db;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.08);
}

.kpi-card:active,
.card.kpi-card:active {
  transform: translateY(-1px);
}

.kpi-card:focus-visible,
.card.kpi-card:focus-visible {
  outline: 2px solid #111827;
  outline-offset: 2px;
}
/* ===== KPI card hover (fix) ===== */
.card.clickable {
  cursor: pointer;
  transition:
    transform 0.14s ease,
    box-shadow 0.14s ease,
    border-color 0.14s ease,
    background-color 0.14s ease;
}

.card.clickable:hover {
  transform: translateY(-2px);
  border-color: #d1d5db;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.08);
}

.card.clickable:active {
  transform: translateY(-1px);
}

.card.clickable:focus-visible {
  outline: 2px solid #111827;
  outline-offset: 2px;
}
</style>
