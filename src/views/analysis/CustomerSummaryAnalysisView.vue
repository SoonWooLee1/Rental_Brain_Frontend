<template>
  <div class="page-container">
    <!-- 헤더 -->
    <div class="header-row">
      <div class="title-area">
        <h2 class="page-title">고객 요약 분석</h2>
        <p class="page-subtitle">전체 고객 현황을 기반으로 규모, 위험도, 만족도를 종합적으로 분석합니다.</p>
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
      <div class="col col-2">
        <SupportMonthlyTrend />
      </div>

      <div class="col col-2">
        <RiskMonthlyRate />
      </div>
    </div>

    <!-- 2열 레이아웃 -->
    <div class="grid-2">
      <div class="card">
        <SegmentDistribution
          title="고객 세그먼트 분석"
          :segments="segmentDist.segments"
          :total="segmentDist.totalCustomerCount"
          :showMiniList="false"
        />
      </div>

      <div class="card">
        <div class="card-title">고객 만족도 분포</div>

        <div class="rating-row">
          <div class="rating-item" v-for="r in ratingRows" :key="r.star">
            <div class="label">⭐ {{ r.star }}점</div>
            <div class="bar">
              <div class="fill" :style="{ width: r.percent + '%' }"></div>
            </div>
            <div class="count">{{ r.count }}개사</div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="card-title small">불만족 원인 TOP 3</div>
        <div class="top3">
          <div class="top3-item" v-for="(x, idx) in topIssues" :key="idx">
            <span class="name">{{ idx + 1 }}. {{ x.name }}</span>
            <span class="count">{{ x.count }}건</span>
          </div>
        </div>
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

const route = useRoute();
const router = useRouter();
const loading = ref(false);

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

const ratingRows = computed(() => [
  { star: 5, count: satisfaction.value.star5Count, percent: satisfaction.value.star5Percent },
  { star: 4, count: satisfaction.value.star4Count, percent: satisfaction.value.star4Percent },
  { star: 3, count: satisfaction.value.star3Count, percent: satisfaction.value.star3Percent },
  { star: 2, count: satisfaction.value.star2Count, percent: satisfaction.value.star2Percent },
  { star: 1, count: satisfaction.value.star1Count, percent: satisfaction.value.star1Percent },
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
}

/* 헤더 */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
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

/* ===== 기존 스타일 유지(하단은 원본 파일 스타일) ===== */
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 18px;
}

.col-1 {
  grid-column: span 2;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.card-title {
  font-size: 14px;
  font-weight: 900;
  margin-bottom: 12px;
  color: #111827;
}

.card-title.small {
  font-size: 12px;
  margin-top: 6px;
}

.rating-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rating-item {
  display: grid;
  grid-template-columns: 80px 1fr 70px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.bar {
  height: 8px;
  border-radius: 999px;
  background: #f3f4f6;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: #2563eb;
  border-radius: 999px;
}

.divider {
  height: 1px;
  background: #eee;
  margin: 14px 0;
}

.top3 {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 12px;
}

.top3-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.top3-item .name {
  font-weight: 800;
  color: #374151;
}

.top3-item .count {
  font-weight: 900;
  color: #111827;
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
  .col-1 {
    grid-column: span 1;
  }
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
