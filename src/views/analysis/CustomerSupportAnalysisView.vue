<template>
  <div class="page-container">
    <!-- 헤더 -->
    <div class="header-row">
      <div class="title-area">
        <h2 class="page-title">고객 응대 분석</h2>
        <p class="page-subtitle">
          견적, 문의, 피드백 데이터를 기반으로 고객 응대 효율과 품질을 분석합니다
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
      <!-- 1) 총 응대 건수 (카드 전체는 클릭 X, row만 클릭) -->
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
          <div
            v-for="t in mergedTypeRows"
            :key="t.type"
            class="type-row type-row--clickable"
            role="button"
            tabindex="0"
            @click="goType(t.type)"
            @keydown.enter.prevent="goType(t.type)"
            @keydown.space.prevent="goType(t.type)"
          >
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

      <!-- 2) 응대 처리 효율 (카드 클릭으로 이동) -->
      <div
        class="card kpi-card clickable"
        role="button"
        tabindex="0"
        @click="goToKey('efficiency')"
        @keydown.enter.prevent="goToKey('efficiency')"
        @keydown.space.prevent="goToKey('efficiency')"
      >
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

      <!-- 3) 고객 만족도 지수 (카드 클릭으로 이동) -->
      <div
        class="card kpi-card clickable"
        role="button"
        tabindex="0"
        @click="goToKey('satisfaction')"
        @keydown.enter.prevent="goToKey('satisfaction')"
        @keydown.space.prevent="goToKey('satisfaction')"
      >
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
        <!-- ✅ 차트 월 클릭 → 페이지 전체(month) 갱신 -->
        <SupportMonthlyTrend @select-month="applyMonthFromTrend" />
      </div>

      <div class="ai-col">
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

    <InsightTopListCard :sections="insightSections" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getCustomerSupportKpi, getSatisfactionDist } from "@/api/customeranalysis";

import SupportMonthlyTrend from "@/components/analysis/SupportMonthlyTrend.vue";
import CustomerSatisfactionCard from "@/components/analysis/CustomerSatisfactionCard.vue";
import SatisfactionDetailModal from "@/components/analysis/SatisfactionDetailModal.vue";
import InsightTopListCard from "@/components/analysis/InsightTopListCard.vue";
import AnalysisSummary from "@/components/analysis/AnalysisSummary.vue";
import { getTopKeywords } from "@/api/customersupport";

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

// 템플릿에서 사용되는 topIssues 안전 처리
const topIssues = ref([]);

// 한줄 요약
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

// 인사이트(더미)
const DEFAULT_INSIGHT_SECTIONS = [
  {
    title: "견적 상담 성공/실패 요인",
    blocks: [
      {
        subtitle: "",
        tone: "neutral",
        items: [
          { rank: 1, label: "맞춤형 제품 제안", count: 28 },
          { rank: 2, label: "경쟁력 있는 가격", count: 24 },
          { rank: 3, label: "빠른 견적 응답", count: 21 },
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

const buildInsightSections = (data) => {
  const toItems = (arr = []) =>
    arr.map((it, idx) => ({
      rank: idx + 1,
      label: it.keyword,
      count: Number(it.count) || 0,
    }));

  return [
    {
      title: "문의 키워드 TOP",
      blocks: [
        {
          subtitle: "",
          tone: "neutral",
          items: toItems(data?.inquiryKeywords),
        },
      ],
    },
    {
      title: "긍정 피드백 키워드 TOP",
      blocks: [
        {
          subtitle: "",
          tone: "good",
          items: toItems(data?.positiveFeedbackKeywords),
        },
      ],
    },
    {
      title: "컴플레인 키워드 TOP",
      blocks: [
        {
          subtitle: "",
          tone: "bad",
          items: toItems(data?.complaintKeywords),
        },
      ],
    },
  ];
};

const clone = (v) => {
  try {
    return structuredClone(v);
  } catch {
    return JSON.parse(JSON.stringify(v));
  }
};

const insightSections = ref();

// 모달 상태
const satModalOpen = ref(false);
const satStar = ref(null);

const openSatisfactionModal = (star) => {
  satStar.value = star;
  satModalOpen.value = true;
};

/** =========================
 *  ✅ Navigation
 *  - KPI 카드/Row 클릭 시 이동
 *  - month 쿼리를 같이 넘겨서 리스트에서 필터링 가능하게
 ========================= */
const pushWithMonth = (to) => {
  router.push({
    ...to,
    query: {
      ...route.query,
      month: month.value,
      year: String(month.value).slice(0, 4),
    },
  });
};

const goToKey = (key) => {
  // ⚠️ 여기 라우트 name은 프로젝트에 맞게 조정
  const map = {
    // KPI 카드 2) 처리 효율: 문의 관리로 보내는 예시
    efficiency: { name: "cs-support-list" },

    // KPI 카드 3) 만족도: 피드백 관리로 보내는 예시
    satisfaction: { name: "cs-feedback-list" },
  };

  const target = map[key];
  if (!target) return;
  pushWithMonth(target);
};

const goType = (type) => {
  // ⚠️ type별 이동처(원하면 query로 type도 같이 넘겨서 필터 걸기)
  const map = {
    QUOTE: { name: "contract-list" },      // 견적 -> 계약/견적 리스트(프로젝트 기준에 맞게 수정)
    INQUIRY: { name: "cs-support-list" },  // 문의 -> 문의 관리
    FEEDBACK: { name: "cs-feedback-list" } // 피드백 -> 피드백 관리
  };

  const target = map[type];
  if (!target) return;

  router.push({
    ...target,
    query: {
      ...route.query,
      month: month.value,
      year: String(month.value).slice(0, 4),
      supportType: type, // (선택) 리스트에서 이 값으로 필터링
    },
  });
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

/** ✅ route query month 갱신(여기서 페이지 전체 갱신이 트리거됨) */
const setMonthQuery = (m) => {
  router.replace({
    query: {
      ...route.query,
      month: m,
      year: String(m).slice(0, 4),
    },
  });
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

/**  차트에서 월 클릭하면 여기로 들어옴 */
const applyMonthFromTrend = (selectedYm) => {
  if (!selectedYm) return;
  mode.value = "pick";
  pickedMonth.value = selectedYm;
  setMonthQuery(selectedYm);
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

/** 만족도 분포 normalize */
const normalizeSatDist = (raw) => {
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;

  // 배열 형태: [{star:5,count:10}, ...]
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

  // 객체 형태
  const d = data?.distribution ?? data?.data ?? data ?? {};
  const n = (v) => Number(v) || 0;

  const s5 = n(d.star5Count ?? d.star5 ?? d.five ?? d.count5);
  const s4 = n(d.star4Count ?? d.star4 ?? d.four ?? d.count4);
  const s3 = n(d.star3Count ?? d.star3 ?? d.three ?? d.count3);
  const s2 = n(d.star2Count ?? d.star2 ?? d.two ?? d.count2);
  const s1 = n(d.star1Count ?? d.star1 ?? d.one ?? d.count1);
  const total = n(d.totalCount ?? d.total ?? d.count ?? s5 + s4 + s3 + s2 + s1);

  return {
    star5Count: s5,
    star4Count: s4,
    star3Count: s3,
    star2Count: s2,
    star1Count: s1,
    totalCount: total,
  };
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
    satDist.value = {
      star5Count: 0,
      star4Count: 0,
      star3Count: 0,
      star2Count: 0,
      star1Count: 0,
      totalCount: 0,
    };
  }
};

const fetchTopKeywords = async ()=>{
  try{
    const res = await getTopKeywords(month.value);
    console.log(res);
    insightSections.value = buildInsightSections(res.data);
  } catch(e){
    console.error("인사이트 키워드 조회 실패", e);
  }
}

const fetchAll = async () => {
  await Promise.all([fetchKpi(), fetchSatisfactionDist(), fetchTopKeywords()]);
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

  const stats = typeRows.value.length
    ? typeRows.value
    : [{ type: "QUOTE" }, { type: "INQUIRY" }, { type: "FEEDBACK" }];

  return stats.map((s) => ({
    type: s.type,
    ytdCount: ytdMap[s.type] ?? 0,
    currentCount: Number(s.currentCount ?? 0) || 0,
    previousCount: Number(s.previousCount ?? 0) || 0,
    deltaCount: Number(s.deltaCount ?? 0) || 0,
    momPercent: Number(s.momPercent ?? 0) || 0,
  }));
});

/** 총 응대 건수는 누적(ytdTotal) */
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
/* (스타일은 네 파일 유지) */
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
}
.seg-btn {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  border: none;
  background: white;
  cursor: pointer;
  color: #111827;
}
.seg-btn.active {
  background: #111827;
  color: white;
}
.month-pick {
  display: flex;
  align-items: center;
  gap: 8px;
}
.month-input {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-size: 12px;
}
.apply-btn {
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  background: #111827;
  color: white;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.month-badge {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 12px;
  font-weight: 700;
  color: #111827;
}

/* KPI Row */
.kpi-row-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

/* trend + ai */
.trend-ai-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 14px;
}
.trend-col,
.ai-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 카드 공통 */
.card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  padding: 14px;
}

/* KPI 내부 */
.kpi-card .kpi-title {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
}
.kpi-card .kpi-value {
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  margin-top: 6px;
}
.kpi-subtitle {
  margin-top: 10px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
}
.type-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.type-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.type-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.type-label {
  font-size: 12px;
  font-weight: 800;
  color: #111827;
}
.type-total {
  font-size: 12px;
  font-weight: 700;
  color: #111827;
}
.count.up {
  color: #16a34a;
  font-weight: 800;
}
.count.down {
  color: #ef4444;
  font-weight: 800;
}

.split-line {
  height: 1px;
  background: #e5e7eb;
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
  font-weight: 800;
}
.metric-sub {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 800;
}
.metric-sub .up {
  color: #16a34a;
}
.metric-sub .down {
  color: #ef4444;
}
.small-box {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
}

/* ✅ 클릭 wrapper (KPI 카드 2,3에만 붙임) */
.clickable {
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  will-change: transform;
  border-radius: 14px;
}

.clickable:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(17, 24, 39, 0.1);
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

/* ✅ Row만 클릭 가능하게 */
.type-row--clickable {
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 10px;
  transition: background 160ms ease, transform 160ms ease;
}
.type-row--clickable:hover {
  background: #f9fafb;
}
.type-row--clickable:active {
  transform: scale(0.99);
}
.type-row--clickable:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.25);
  outline-offset: 2px;
}
</style>
