<template>
  <div class="page-container">
    <!-- 헤더 -->
    
    <div class="header-row">
      <div class="title-area">
        <h2 class="page-title">고객 요약 분석</h2>
        <p class="page-subtitle">
          전체 고객 현황을 기반으로 규모, 위험도, 만족도를 종합적으로 분석합니다.
        </p>
      </div>
      

      
      <!-- ✅ 토글 + 선택월 -->
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
        
        <div class="month-badge">{{ kpi?.currentMonth ?? month }} 기준</div>
      </div>
    </div>
    <div class="analysis-section">
      <AnalysisSummary
        :text="customerSummary.text"
        :tone="customerSummary.tone"
      />
    </div>
    
    <!-- KPI 5개 -->
    <div class="kpi-wrapper">
      <div class="kpi-box">
        <div class="kpi-title">거래중 고객 / 총 고객 수</div>
        <div class="kpi-value">{{ fmt(kpi.tradeCustomerCount) }}개사 / {{ fmt(kpi.totalCustomerCount) }}개사</div>
        <div class="kpi-sub">
          <span class="up">▲ {{ round1(kpi.tradeCustomerMomRate) }}%</span>
          <span class="muted">전월 대비(거래 고객 기준)</span>
        </div>
      </div>
      
      <div class="kpi-box">
        <div class="kpi-title">평균 거래액</div>
        <div class="kpi-value">{{ fmtManwon(kpi.avgTradeAmount) }}</div>
        <div class="kpi-sub">
          <span class="up">▲ {{ round1(kpi.avgTradeMomRate) }}%</span>
          <span class="muted">전월 대비</span>
        </div>
      </div>

      <div class="kpi-box">
        <div class="kpi-title">평균 만족도</div>
        <div class="kpi-value">{{ round1(kpi.avgStar) }}점</div>
        <div class="kpi-sub">
          <span :class="kpi.avgStarMomDiff >= 0 ? 'up' : 'down'">
            {{ kpi.avgStarMomDiff >= 0 ? '▲' : '▼' }} {{ round1(Math.abs(kpi.avgStarMomDiff)) }}점
          </span>
          <span class="muted">전월 대비</span>
        </div>
      </div>

      <div class="kpi-box">
        <div class="kpi-title">안정 고객 비율</div>
        <div class="kpi-value">{{ round1(kpi.stableCustomerRate) }}%</div>
        <div class="kpi-sub">
          <span class="muted">{{ fmt(kpi.stableCustomerCount) }}/{{ fmt(kpi.tradeCustomerCount) }}개사 안정</span>
        </div>
      </div>

      <div class="kpi-box">
        <div class="kpi-title">이탈 위험률</div>
        <div class="kpi-value danger">{{ round1(kpi.riskRate) }}%</div>
        <div class="kpi-sub">
          <span class="down">▲ {{ round1(kpi.riskMomDiffRate) }}%p</span>
          <span class="muted">이탈 위험 고객 {{ fmt(kpi.riskCustomerCount) }}개사</span>
        </div>
      </div>
    </div>

    <!-- 2열 레이아웃 -->
    <div class="summary-grid">
      <!-- ✅ 월별 응대 트렌드(문의/CS 탭으로 이동) -->
      <div
        class="col col-2 panel clickable"
        role="button"
        tabindex="0"
        @click="goTo('CustomerSupportAnalysisView')"
        @keydown.enter.prevent="goTo('CustomerSupportAnalysisView')"
        @keydown.space.prevent="goTo('CustomerSupportAnalysisView')"
      >
        <SupportMonthlyTrend />
      </div>

      <!-- ✅ 월별 이탈위험률(연체/위험관리 탭으로 이동) -->
      <div
        class="col col-2 panel clickable"
        role="button"
        tabindex="0"
        @click="goTo('CustomerSegmentAnalysisView')"
        @keydown.enter.prevent="goTo('CustomerSegmentAnalysisView')"
        @keydown.space.prevent="goTo('CustomerSegmentAnalysisView')"
      >
        <RiskMonthlyRate />
      </div>
    </div>

    <!-- 2열 레이아웃 -->
    <div class="grid-2">
          <CustomerSatisfactionCard
            :satisfaction="satisfaction"
            :topIssues="topIssues"
            @open="openSatisfactionModal"
          />

          <SatisfactionDetailModal
            :open="satModalOpen"
            :star="satStar"
            @close="satModalOpen = false"
          />

        <!--  고객 세그먼트(고객분석-세그먼트 탭으로 이동) -->
        <div
        class="col col-2 panel clickable"
        role="button"
        tabindex="0"
        @click="goTo('CustomerSegmentAnalysisView')"
        @keydown.enter.prevent="goTo('CustomerSegmentAnalysisView')"
        @keydown.space.prevent="goTo('CustomerSegmentAnalysisView')"
        >
        <SegmentDistribution />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  getCustomerSummaryKpi,
  getMonthlyRiskRate,
  getSatisfactionDist,
  getSegmentDistribution,
} from "@/api/customeranalysis";

import SegmentDistribution from "@/components/analysis/SegmentDistribution.vue";
import SupportMonthlyTrend from "@/components/analysis/SupportMonthlyTrend.vue";
import RiskMonthlyRate from "@/components/analysis/RiskMonthlyRate.vue";
import CustomerSatisfactionCard from "@/components/analysis/CustomerSatisfactionCard.vue";
import SatisfactionDetailModal from "@/components/analysis/SatisfactionDetailModal.vue";
import AnalysisSummary from "@/components/analysis/AnalysisSummary.vue";

const satModalOpen = ref(false);
const satStar = ref(5);

const openSatisfactionModal = (star) => {
  satStar.value = Number(star) || 5;
  satModalOpen.value = true;
};

const route = useRoute();
const router = useRouter();
const loading = ref(false);

// 한줄평
const customerSummary = computed(() => {
  if (!kpi.value) return { text: "고객 요약 지표를 불러오는 중입니다.", tone: "neutral" };

  const stableRate = Number(kpi.value?.stableCustomerRate ?? 0);
  const riskRate = Number(kpi.value?.riskRate ?? 0);
  const riskDiffP = Number(kpi.value?.riskMomDiffRate ?? 0);

  if (riskRate >= 15 || riskDiffP >= 3) {
    return {
      text: `이탈 위험 고객 비중 ${riskRate}%로 증가 추세입니다. 위험 고객 우선 케어가 필요합니다.`,
      tone: "danger",
    };
  }

  if (riskRate >= 10) {
    return {
      text: `안정 고객 비중은 유지되지만, 이탈 위험 고객 ${riskRate}%가 감지되어 선제 대응이 필요합니다.`,
      tone: "warn",
    };
  }
 if (riskRate < 10) {
  return {
    text: `안정 고객 비중 ${stableRate}%로 전반적인 고객 상태는 안정적입니다.`,
    tone: "good",
  };
};
});


/* =========================
   ✅ 카드 클릭 이동(사이드바 기준으로 name만 맞추면 끝)
========================= */
function goTo(key) {
  const map = {
    // 연체관리 탭
    overdue: { name: "OverdueManagement" },

    // 문의 관리 탭
    inquiry: { name: "cs-support-list" },

    // 고객분석 > 세그먼트 탭(이 페이지가 탭형이면 query로)
    // 1) 탭이 query 방식이면 아래처럼:
    segment: { name: "CustomerSummaryAnalysis", query: { tab: "segment" } },

    CustomerSegmentAnalysisView: { name: "analysis-segment" },

    CustomerSupportAnalysisView: { name: "analysis-support" },
  };

  const target = map[key];
  if (!target) return;
  router.push(target);
}

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
  const d = new Date(y, (m - 1) + diff, 1);
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
   State
========================= */
const kpi = ref({
  totalCustomerCount: 0,
  tradeCustomerCount: 0,
  tradeCustomerMomRate: 0,
  avgTradeAmount: 0,
  avgTradeMomRate: 0,
  avgStar: 0,
  avgStarMomDiff: 0,
  stableCustomerCount: 0,
  stableCustomerRate: 0,
  riskCustomerCount: 0,
  riskRate: 0,
  riskMomDiffRate: 0,
});

const segmentDist = ref({
  totalCustomerCount: 0,
  segments: [],
});

const satisfaction = ref({
  star5Count: 0,
  star4Count: 0,
  star3Count: 0,
  star2Count: 0,
  star1Count: 0,
  totalCount: 0,
  star5Percent: 0,
  star4Percent: 0,
  star3Percent: 0,
  star2Percent: 0,
  star1Percent: 0,
});

const riskMonthly = ref([]);

// TODO: 백엔드 엔드포인트 있으면 교체
const topIssues = ref([
  { name: "AS 처리 속도", count: 15 },
  { name: "제품 품질", count: 12 },
  { name: "가격 정책", count: 8 },
]);

/* =========================
   Fetch
========================= */
const last12MonthsRange = (toYM) => {
  const to = toYM;
  const from = addMonths(toYM, -11);
  return { from, to };
};

const fetchAll = async () => {
  loading.value = true;
  try {
    const { from, to } = last12MonthsRange(month.value);

    const [kpiRes, riskRes, satRes, segRes] = await Promise.all([
      getCustomerSummaryKpi(month.value),
      getMonthlyRiskRate(from, to),
      getSatisfactionDist(),
      getSegmentDistribution(),
    ]);

    kpi.value = kpiRes.data;
    riskMonthly.value = riskRes.data;
    satisfaction.value = satRes.data;
    segmentDist.value = segRes.data;
  } catch (e) {
    console.error(e);
    ElMessage.error("고객 요약 분석 데이터를 불러오는데 실패했습니다.");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchAll);
watch(month, fetchAll);

/* =========================
   Utils
========================= */
const fmt = (n) => (Number(n) || 0).toLocaleString();
const fmtManwon = (n) => {
  const v = Number(n) || 0;
  const inManwon = v >= 100000 ? v / 10000 : v;
  return `${inManwon.toLocaleString(undefined, { maximumFractionDigits: 1 })}만원`;
};
const round1 = (n) => (Number(n) || 0).toFixed(1);
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

/* 헤더 */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 0px;
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

/* KPI */
.kpi-wrapper {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.kpi-box {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.kpi-title {
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
}

.kpi-value {
  font-size: 18px;
  font-weight: 900;
  margin-top: 6px;
  color: #111827;
}

.kpi-value.danger {
  color: #ef4444;
}

.kpi-sub {
  margin-top: 10px;
  font-size: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.muted {
  color: #9ca3af;
  font-weight: 700;
}

.up {
  color: #16a34a;
  font-weight: 900;
}

.down {
  color: #ef4444;
  font-weight: 900;
}

/* 레이아웃 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 18px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

/* 기본 카드 */
.card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

/* ✅ 클릭 wrapper */
.panel {
  width: 100%;
}

/* ✅ Hover 애니메이션(대시보드 KPI 톤) */
.clickable {
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  will-change: transform;
  border-radius: 10px;
}

.clickable:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(17, 24, 39, 0.10);
  border-color: #dbeafe;
}

.clickable:active {
  transform: translateY(-1px) scale(0.99);
  box-shadow: 0 6px 14px rgba(17, 24, 39, 0.08);
}

.clickable:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.25);
  outline-offset: 2px;
}

/* 반응형 */
@media (max-width: 1200px) {
  .header-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    justify-content: flex-start;
  }
  .kpi-wrapper {
    grid-template-columns: 1fr;
  }
  .summary-grid {
    grid-template-columns: 1fr;
  }
  .grid-2 {
    grid-template-columns: 1fr;
  }
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
</style>
