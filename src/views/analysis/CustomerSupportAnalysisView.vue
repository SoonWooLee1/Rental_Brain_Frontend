<template>
  <div class="page-container">
    <!-- 헤더 -->
    <div class="header-row">
      <div class="title-area">
        <h2 class="page-title">고객 응대 분석</h2>
        <p class="page-subtitle">견적, 문의, 피드백 데이터를 기반으로 고객 응대 효율과 품질을 분석합니다.</p>
      </div>
    </div>

    <!-- KPI 3개 -->
    <div class="kpi-row-3">
      <!-- 1) 총 응대 건수 -->
      <div class="card kpi-card">
        <div class="kpi-head">
          <div class="icon bubble">💬</div>
          <div>
            <div class="kpi-title">{{ kpi?.totalResponseCard?.title ?? "총 응대 건수" }}</div>
            <div class="kpi-value">{{ fmt(totalCurrent) }}건</div>
          </div>
        </div>

        <div class="kpi-subtitle">{{ kpi?.totalResponseCard?.subtitle ?? "전월 대비 변화 (유형별)" }}</div>

        <div class="type-list">
          <div v-for="t in typeRows" :key="t.type" class="type-row">
            <span class="type-label">{{ typeLabel(t.type) }}</span>
            <span :class="t.momPercent >= 0 ? 'up' : 'down'">
              {{ t.momPercent >= 0 ? "+" : "" }}{{ round1(t.momPercent) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- 2) 응대 처리 효율 -->
      <div class="card kpi-card">
        <div class="kpi-head">
          <div class="icon check">✅</div>
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
            전월 대비 {{ Math.abs(round1(kpi?.efficiency?.avgResponseTimeMomPercent)) }}% {{ (kpi?.efficiency?.avgResponseTimeMomPercent ?? 0) <= 0 ? "단축" : "증가" }}
          </span>
        </div>
      </div>

      <!-- 3) 고객 만족도 지수 -->
      <div class="card kpi-card">
        <div class="kpi-head">
          <div class="icon star">⭐</div>
          <div>
            <div class="kpi-title">고객 만족도 지수</div>
            <div class="kpi-value">{{ round1(kpi?.satisfaction?.avgScore) }}점</div>
          </div>
        </div>

        <div class="metric-sub">
          <span :class="(kpi?.satisfaction?.avgScoreMom ?? 0) >= 0 ? 'up' : 'down'">
            전월 대비 {{ (kpi?.satisfaction?.avgScoreMom ?? 0) >= 0 ? "+" : "" }}{{ round1(kpi?.satisfaction?.avgScoreMom) }}점
          </span>
        </div>

        <!-- (옵션) 저평점 비중 -->
        <div class="small-box">
          <div class="metric-row">
            <span class="metric-label">저평점(≤2.5) 비중</span>
            <span class="metric-value">{{ round1(kpi?.satisfaction?.lowScoreRatio) }}%</span>
          </div>
          <div class="metric-sub">
            <span :class="(kpi?.satisfaction?.lowScoreRatioMomP ?? 0) <= 0 ? 'up' : 'down'">
              전월 대비 {{ (kpi?.satisfaction?.lowScoreRatioMomP ?? 0) >= 0 ? "+" : "" }}{{ round1(kpi?.satisfaction?.lowScoreRatioMomP) }}%p
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 아래 영역은 너가 차트/테이블 붙일 공간으로 확장 -->
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { getCustomerSupportKpi } from "@/api/customeranalysis";

const route = useRoute();
const isActive = (path) => route.path === path;

const month = computed(() => route.query.month ?? "2025-02"); // 기본값
const kpi = ref(null);

const fetchKpi = async () => {
  const res = await getCustomerSupportKpi(month.value);
  kpi.value = res.data;
};

onMounted(fetchKpi);

const typeRows = computed(() => kpi.value?.totalResponseCard?.typeStats ?? []);
const totalCurrent = computed(() =>
  (typeRows.value || []).reduce((sum, r) => sum + (Number(r.currentCount) || 0), 0)
);

const fmt = (n) => (Number(n) || 0).toLocaleString();
const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

// avgResponseTime 단위가 "시간"인지 "분"인지 프로젝트마다 달라서
// 너 응답 예시가 58.5 (시간이면 너무 큼) → 보통 "분"일 가능성이 높음.
// 일단 “분 → 시간”으로 보기 좋게 표시: 58.5분 => 1.0시간
const fmtHours = (minutesLike) => {
  const v = Number(minutesLike) || 0;
  // 0~24 사이면 "시간"일 수도 있으니 그대로 표시
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
/* QuoteListView 톤 */
.page-container { padding: 20px; max-width: 1400px; margin: 0 auto; }
.header-row { margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: 700; color:#333; margin:0; }
.page-subtitle { margin: 6px 0 0; color:#6b7280; font-size: 13px; }

.tab-row { display:flex; gap:16px; padding: 10px 0 16px; border-bottom:1px solid #eee; margin-bottom:20px; }
.tab { text-decoration:none; color:#6b7280; font-weight:700; padding:10px 4px; }
.tab.active { color:#2563eb; border-bottom:2px solid #2563eb; }

.kpi-row-3 { display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
.card { background:#fff; border:1px solid #eee; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }

.kpi-head { display:flex; gap:12px; align-items:center; }
.icon { width:42px; height:42px; border-radius: 12px; display:flex; align-items:center; justify-content:center; font-size:18px; }
.icon.bubble { background:#eef2ff; color:#3730a3; }
.icon.check { background:#ecfdf5; color:#166534; }
.icon.star { background:#f5f3ff; color:#6d28d9; }

.kpi-title { font-size: 12px; color:#666; font-weight:600; }
.kpi-value { font-size: 24px; font-weight: 800; color:#111827; margin-top:4px; }

.kpi-subtitle { margin-top: 14px; font-size: 12px; color:#6b7280; font-weight:700; }

.type-list { margin-top: 10px; display:flex; flex-direction:column; gap:8px; }
.type-row { display:flex; justify-content:space-between; font-size: 12px; }
.type-label { color:#374151; font-weight:700; }

.up { color:#16a34a; font-weight:800; }
.down { color:#ef4444; font-weight:800; }

.split-line { height:1px; background:#eee; margin: 14px 0; }

.metric-row { display:flex; justify-content:space-between; align-items:center; font-size: 12px; }
.metric-label { color:#6b7280; font-weight:700; }
.metric-value { color:#111827; font-weight:900; }

.metric-sub { margin-top: 10px; font-size: 12px; }

.small-box { margin-top: 14px; padding-top: 12px; border-top: 1px solid #f1f1f1; }

@media (max-width: 1200px) {
  .kpi-row-3 { grid-template-columns: 1fr; }
}
</style>
