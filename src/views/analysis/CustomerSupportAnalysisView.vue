<template>
  <div class="page-container">
    <!-- 헤더 -->
    <div class="header-row">
      <div class="title-area">
        <h2 class="page-title">고객 응대 분석</h2>
        <p class="page-subtitle">
          견적, 문의, 피드백 데이터를 기반으로 고객 응대 효율과 품질을 분석합니다.
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

        <div class="month-badge">{{ kpi?.targetMonth ?? month }} 기준</div>
      </div>
    </div>

    <!-- KPI 3개 -->
    <div class="kpi-row-3">
      <!-- 1) 총 응대 건수 -->
      <div class="card kpi-card">
        <div class="kpi-head">
          <div>
            <div class="kpi-title">{{ kpi?.totalResponseCard?.title ?? "총 응대 건수" }}</div>
            <div class="kpi-value">{{ fmt(ytdTotal) }}건</div>
          </div>
        </div>

        <div class="kpi-subtitle">
          {{ kpi?.totalResponseCard?.subtitle ?? "전월 대비 변화 (유형별)" }}
        </div>

        <div class="type-list">
          <div v-for="t in mergedTypeRows" :key="t.type" class="type-row">
            <span class="type-left">
              <span class="type-label">{{ typeLabel(t.type) }}</span>
              <span class="type-total">{{ fmt(t.ytdCount) }}건</span>
            </span>

            <span class="type-delta">
              <span class="count" :class="t.deltaCount >= 0 ? 'up' : 'down'">
                {{ t.deltaCount >= 0 ? "+" : "" }}{{ t.deltaCount }}건
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- 2) 응대 처리 효율 -->
      <div class="card kpi-card">
        <div class="kpi-head">
          <div>
            <div class="kpi-title">응대 처리 완료율</div>
            <div class="kpi-value">{{ round1(kpi?.efficiency?.completionRate) }}%</div>
          </div>
        </div>

        <div class="split-line"></div>

        <div class="metric-row">
          <span class="metric-label">평균 응대 시간</span>
          <span class="metric-value">{{ fmtHours(kpi?.efficiency?.avgResponseTime) }}</span>
        </div>

        <div class="metric-sub">
          <span :class="(kpi?.efficiency?.avgResponseTimeMomPercent ?? 0) <= 0 ? 'up' : 'down'">
            전월 대비 {{ Math.abs(round1(kpi?.efficiency?.avgResponseTimeMomPercent)) }}%
            {{ (kpi?.efficiency?.avgResponseTimeMomPercent ?? 0) <= 0 ? "단축" : "증가" }}
          </span>
        </div>
      </div>

      <!-- 3) 고객 만족도 지수 -->
      <div class="card kpi-card">
        <div class="kpi-head">
          <div>
            <div class="kpi-title">고객 만족도 지수</div>
            <div class="kpi-value">{{ round1(kpi?.satisfaction?.avgScore) }}점</div>
          </div>
        </div>

        <div class="metric-sub">
          <span :class="(kpi?.satisfaction?.avgScoreMom ?? 0) >= 0 ? 'up' : 'down'">
            전월 대비 {{ (kpi?.satisfaction?.avgScoreMom ?? 0) >= 0 ? "+" : "" }}
            {{ round1(kpi?.satisfaction?.avgScoreMom) }}점
          </span>
        </div>

        <div class="small-box">
          <div class="metric-row">
            <span class="metric-label">저평점(≤2.5) 비중</span>
            <span class="metric-value">{{ round1(kpi?.satisfaction?.lowScoreRatio) }}%</span>
          </div>
          <div class="metric-sub">
            <span :class="(kpi?.satisfaction?.lowScoreRatioMomP ?? 0) <= 0 ? 'up' : 'down'">
              전월 대비 {{ (kpi?.satisfaction?.lowScoreRatioMomP ?? 0) >= 0 ? "+" : "" }}
              {{ round1(kpi?.satisfaction?.lowScoreRatioMomP) }}%p
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 차트 영역 -->
    <div class="grid-2">
      <SupportMonthlyTrend />
    </div>

    <!-- 하단  -->
    <QuoteInsightPanel />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getCustomerSupportKpi } from "@/api/customeranalysis";
import SupportMonthlyTrend from "@/components/analysis/SupportMonthlyTrend.vue";
import QuoteInsightPanel from "@/components/analysis/QuoteInsightPanel.vue";

const route = useRoute();
const router = useRouter();

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
   API
========================= */
const kpi = ref(null);

const fetchKpi = async () => {
  const res = await getCustomerSupportKpi(month.value);
  kpi.value = res.data;
};

onMounted(fetchKpi);
watch(month, fetchKpi);

/** typeStats */
const typeRows = computed(() => (kpi.value?.totalResponseCard?.typeStats ?? []).filter((x) => x && x.type));

/** 누적(YTD) + 증감(typeStats) 합치기 */
const mergedTypeRows = computed(() => {
  const c = kpi.value?.totalResponseCard;
  if (!c) return [];

  const ytdMap = {
    QUOTE: Number(c.ytdQuote ?? 0) || 0,
    INQUIRY: Number(c.ytdInquiry ?? 0) || 0,
    FEEDBACK: Number(c.ytdFeedback ?? 0) || 0,
  };

  const stats = typeRows.value.length ? typeRows.value : [{ type: "QUOTE" }, { type: "INQUIRY" }, { type: "FEEDBACK" }];

  return stats.map((s) => ({
    type: s.type,
    ytdCount: ytdMap[s.type] ?? 0,
    currentCount: Number(s.currentCount ?? 0) || 0,
    previousCount: Number(s.previousCount ?? 0) || 0,
    deltaCount: Number(s.deltaCount ?? 0) || 0,
    momPercent: Number(s.momPercent ?? 0) || 0,
  }));
});

/** ✅ 총 응대 건수는 누적(ytdTotal) */
const ytdTotal = computed(() => Number(kpi.value?.totalResponseCard?.ytdTotal ?? 0) || 0);

const fmt = (n) => (Number(n) || 0).toLocaleString();
const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

const fmtHours = (minutesLike) => {
  const v = Number(minutesLike) || 0;
  if (v <= 24) return `${round1(v)}시간`;
  return `${round1(v / 60)}시간`;
};

const typeLabel = (t) => {
  if (t === "QUOTE") return "견적";
  if (t === "INQUIRY") return "문의";
  if (t === "FEEDBACK") return "피드백";
  return t;
};
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
.kpi-row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 15px;
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
  margin-bottom: 12px;
}

.kpi-title {
  font-size: 12px;
  color: #666;
  font-weight: 600;
}

.kpi-value {
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  margin-top: 4px;
}

.kpi-subtitle {
  margin-top: 12px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
}

/* 유형별 리스트 */
.type-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.type-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type-label {
  color: #374151;
  font-weight: 800;
}

.type-total {
  font-weight: 900;
  color: #111827;
}

.type-delta .count {
  font-weight: 800;
}

.up {
  color: #16a34a;
  font-weight: 900;
}

.down {
  color: #ef4444;
  font-weight: 900;
}

/* 기타 */
.split-line {
  height: 1px;
  background: #eee;
  margin: 12px 0;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.metric-label {
  color: #6b7280;
  font-weight: 700;
}

.metric-value {
  color: #111827;
  font-weight: 900;
}

.metric-sub {
  margin-top: 8px;
  font-size: 12px;
}

.small-box {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f1f1;
}

/* 차트 영역 */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

/* 반응형 */
@media (max-width: 1200px) {
  .kpi-row-3 {
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
</style>
