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

    <AnalysisSummary :text="supportSummary.text" :tone="supportSummary.tone" />

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

    <div class="trend-ai-row">
      <div class="trend-col">
        <SupportMonthlyTrend />
      </div>

      <div class="ai-col">
        <!-- ✅ 분포는 satDist를 내려줘야 막대가 뜸 -->
        <CustomerSatisfactionCard
          :satisfaction="satDist"
          :topIssues="topIssues"
          @open="openSatisfactionModal"
        />

        <SatisfactionDetailModal
          :open="satModalOpen"
          :star="satStar"
          @close="satModalOpen = false"
        />
      </div>
    </div>

    <!-- ✅ 핵심: sections 내려줘야 내용이 렌더링 됨 -->
    <InsightTopListCard :sections="insightSections" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getCustomerSupportKpi, getSatisfactionDist, getQuoteAnalyze } from "@/api/customeranalysis";

import SupportMonthlyTrend from "@/components/analysis/SupportMonthlyTrend.vue";
import CustomerSatisfactionCard from "@/components/analysis/CustomerSatisfactionCard.vue";
import SatisfactionDetailModal from "@/components/analysis/SatisfactionDetailModal.vue";
import InsightTopListCard from "@/components/analysis/InsightTopListCard.vue";
import AnalysisSummary from "@/components/analysis/AnalysisSummary.vue";

const route = useRoute();
const router = useRouter();

const now = new Date();
const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const month = computed(() => route.query.month ?? defaultMonth);

// KPI
const kpi = ref(null);

// 만족도 분포(별점 카운트용)
const satDist = ref({
  star5Count: 0,
  star4Count: 0,
  star3Count: 0,
  star2Count: 0,
  star1Count: 0,
  totalCount: 0,
});

// ✅ (추가) topIssues가 템플릿에서 사용되는데 선언이 없어서 에러났음
// 백엔드 붙이기 전까지는 빈 배열로 안전 처리
const topIssues = ref([]);

// 한줄로 정리해주는 것
const supportSummary = computed(() => {
  if (!kpi.value) return { text: "응대 지표를 불러오는 중입니다.", tone: "neutral" };

  const total = Number(kpi.value?.totalResponseCard?.ytdTotal ?? 0);
  const completion = Number(kpi.value?.efficiency?.completionRate ?? 0);
  const avgStar = Number(kpi.value?.satisfaction?.avgScore ?? 0);
  const lowRatio = Number(kpi.value?.satisfaction?.lowScoreRatio ?? 0);

  if (avgStar > 0 && avgStar <= 2.5 && lowRatio >= 50) {
    return {
      text: `응대 완료율 ${completion}%는 유지되지만, 만족도 ${avgStar}점·저평점 비중 ${lowRatio}%로 품질 악화가 뚜렷합니다.`,
      tone: "danger",
    };
  }

  if (avgStar > 0 && avgStar <= 3.2) {
    return {
      text: `총 응대 ${total}건 기준, 만족도 ${avgStar}점으로 품질 개선이 필요합니다.`,
      tone: "warn",
    };
  }

  return {
    text: `총 응대 ${total}건 기준, 응대 품질은 전반적으로 안정적인 흐름입니다.`,
    tone: "good",
  };
});

// 인사이트 TOP 리스트(InsightTopListCard용) -> 더미용
const DEFAULT_INSIGHT_SECTIONS = [
  {
    title: "견적 상담 성공/실패 요인",
    blocks: [
      {
        subtitle: "성공 요인 TOP 3",
        tone: "good",
        items: [
          { rank: 1, label: "맞춤형 제품 제안", count: 28 },
          { rank: 2, label: "경쟁력 있는 가격", count: 24 },
          { rank: 3, label: "빠른 견적 응답", count: 21 },
        ],
      },
      {
        subtitle: "실패 요인 TOP 3",
        tone: "bad",
        items: [
          { rank: 1, label: "예산 초과", count: 18 },
          { rank: 2, label: "경쟁사 선택", count: 15 },
          { rank: 3, label: "의사결정 지연", count: 12 },
        ],
      },
    ],
  },
  {
    title: "긍정 피드백 키워드",
    blocks: [
      {
        subtitle: "",
        tone: "good",
        items: [
          { rank: 1, label: "빠른 배송", count: 18 },
          { rank: 2, label: "친절한 상담", count: 15 },
          { rank: 3, label: "합리적 가격", count: 12 },
          { rank: 4, label: "제품 품질", count: 10 },
          { rank: 5, label: "전문성", count: 8 },
        ],
      },
    ],
  },
  {
    title: "컴플레인 원인 TOP 3",
    blocks: [
      {
        subtitle: "",
        tone: "bad",
        items: [
          { rank: 1, label: "AS 처리 지연", count: 12 },
          { rank: 2, label: "제품 불량/결함", count: 9 },
          { rank: 3, label: "계약 조건 불만", count: 7 },
        ],
      },
    ],
  },
];

// ✅ structuredClone이 없는 환경도 있어서 안전하게
const clone = (v) => {
  try {
    return structuredClone(v);
  } catch {
    return JSON.parse(JSON.stringify(v));
  }
};

const insightSections = ref(clone(DEFAULT_INSIGHT_SECTIONS));

// 모달 상태
const satModalOpen = ref(false);
const satStar = ref(null);

const openSatisfactionModal = (star) => {
  satStar.value = star;
  satModalOpen.value = true;
};

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
const fetchKpi = async () => {
  const res = await getCustomerSupportKpi(month.value);
  kpi.value = res.data;
};

/** ✅ 만족도 분포 normalize (응답이 배열/객체/문자열 등 섞여도 안전하게) */
const normalizeSatDist = (raw) => {
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;

  // 1) 배열 형태: [{star:5,count:10}, ...]
  if (Array.isArray(data)) {
    const map = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const it of data) {
      const s = Number(it?.star ?? it?.score ?? it?.rating);
      const c = Number(it?.count ?? it?.value ?? it?.cnt ?? 0) || 0;
      if (s >= 1 && s <= 5) map[s] += c;
    }
    const total = map[1] + map[2] + map[3] + map[4] + map[5];
    return {
      star5Count: map[5],
      star4Count: map[4],
      star3Count: map[3],
      star2Count: map[2],
      star1Count: map[1],
      totalCount: total,
    };
  }

  // 2) 객체 형태
  const d = data?.distribution ?? data?.data ?? data ?? {};
  const n = (v) => Number(v) || 0;

  const s5 = n(d.star5Count ?? d.star5 ?? d.five ?? d.count5);
  const s4 = n(d.star4Count ?? d.star4 ?? d.four ?? d.count4);
  const s3 = n(d.star3Count ?? d.star3 ?? d.three ?? d.count3);
  const s2 = n(d.star2Count ?? d.star2 ?? d.two ?? d.count2);
  const s1 = n(d.star1Count ?? d.star1 ?? d.one ?? d.count1);
  const total = n(d.totalCount ?? d.total ?? d.count ?? s5 + s4 + s3 + s2 + s1);

  return { star5Count: s5, star4Count: s4, star3Count: s3, star2Count: s2, star1Count: s1, totalCount: total };
};

const fetchSatisfactionDist = async () => {
  try {
    const res = await getSatisfactionDist(month.value);
    satDist.value = normalizeSatDist(res.data);
    return;
  } catch (e) {
    // fallback
  }

  try {
    const res2 = await getSatisfactionDist();
    satDist.value = normalizeSatDist(res2.data);
  } catch (e) {
    satDist.value = { star5Count: 0, star4Count: 0, star3Count: 0, star2Count: 0, star1Count: 0, totalCount: 0 };
  }
};

// ✅ (추가) normalizeInsight 정의 안 돼있어서 에러났음
// 백엔드 응답 형태가 달라도 최대한 sections 형태로 맞춰줌.
const normalizeInsight = (raw) => {
  if (!raw) return clone(DEFAULT_INSIGHT_SECTIONS);

  const data = typeof raw === "string" ? JSON.parse(raw) : raw;

  // 이미 sections 배열이면 그대로
  if (Array.isArray(data) && data.length && data[0]?.title && data[0]?.blocks) return data;

  // { sections: [...] }
  if (Array.isArray(data?.sections)) return data.sections;

  // 그 외 형태면 일단 더미 유지
  return clone(DEFAULT_INSIGHT_SECTIONS);
};

const fetchInsightTopList = async () => {
  try {
    const res = await getQuoteAnalyze(month.value, 60, 50);
    insightSections.value = normalizeInsight(res.data);
  } catch (e) {
    // ✅ 비어버리면 컴포넌트가 아무것도 안 나와서, 차라리 더미를 유지
    insightSections.value = clone(DEFAULT_INSIGHT_SECTIONS);
  }
};

const fetchAll = async () => {
  await Promise.all([fetchKpi(), fetchSatisfactionDist(), fetchInsightTopList()]);
};

onMounted(fetchAll);
watch(month, fetchAll);

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
  // 기존 로직 유지(네 백엔드가 "시간" 단위로 주는지 "분"으로 주는지 애매해서)
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
/* (스타일은 네 파일 유지) */
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

/* 차트/카드 영역 */
.trend-ai-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 18px;
  align-items: start;
}

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
  .trend-ai-row {
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
