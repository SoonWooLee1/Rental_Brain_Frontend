<template>
  <div class="seg-wrap">
    <div v-for="c in cards" :key="c.segmentId" class="seg-card" :class="toneClass(c.segmentId)">
      <div class="seg-head">
        <div class="seg-name">{{ c.segmentName }}</div>
        <div class="seg-count">{{ fmt(c.customerCount) }}개사</div>
      </div>

      <div class="seg-metrics">
        <div class="metric-row">
          <span class="label">총 거래액</span>
          <span class="value">{{ moneyKr(c.totalTradeAmount) }}</span>
        </div>
        <div class="metric-row">
          <span class="label">평균 거래액</span>
          <span class="value">{{ moneyKr(c.avgTradeAmount) }}</span>
        </div>
        <div class="metric-row">
          <span class="label">평균 만족도</span>
          <span class="value">
            <span class="star">⭐</span>
            {{ score(c.avgSatisfaction) }}
          </span>
        </div>
      </div>

      <div class="seg-section">
        <div class="sec-title">인기 품목</div>
        <div class="sec-body">{{ c.popularItem || "-" }}</div>
      </div>

      <div class="seg-section">
        <div class="sec-title">주요 문의사항</div>
        <div class="sec-body">{{ c.topInquiry || "-" }}</div>
      </div>

      <div class="seg-section">
        <div class="sec-title">주요 피드백</div>
        <div class="sec-body">{{ c.topFeedback || "-" }}</div>
      </div>

      <div v-if="c._loading" class="overlay">불러오는 중...</div>
      <div v-else-if="c._error" class="overlay error">불러오기 실패</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { getCustomerSegmentDetailCard } from "@/api/customeranalysis";

/**
 * ✅ props: 조회할 세그먼트 ID 목록
 * - 기본값: 1~7
 */
const props = defineProps({
  segmentIds: { type: Array, default: () => [1, 2, 3, 4, 5, 6, 7] },
});

const cards = ref([]);

/* ---------------------------------------------------------
 * 1) 공통 유틸(값 보정/포맷)
 * --------------------------------------------------------- */

/** ✅ 만족도는 0~5 범위로 강제 (백엔드/조인 이슈로 6~7이 와도 UI 방어) */
const clamp5 = (v) => Math.max(0, Math.min(5, v));

/** ✅ 숫자 콤마 포맷 */
const fmt = (n) => (Number(n) || 0).toLocaleString();

/** ✅ 만족도 표시(0이면 '-') + 소수 1자리 */
const score = (n) => {
  const v = clamp5(Number(n) || 0);
  if (!v) return "-";
  return (Math.round(v * 10) / 10).toFixed(1);
};

/**
 * ✅ 원 단위를 "억 xxxx만원" / "xxxx만원" 으로 표기
 * - 1만원 = 10,000원
 * - 1억 = 100,000,000원 = 10,000만원
 */
const moneyKr = (won) => {
  const v = Math.floor(Number(won) || 0);
  if (v <= 0) return "0만원";

  const man = Math.floor(v / 10000);      // 만원 단위
  const eok = Math.floor(man / 10000);    // 억(= 10,000만원)
  const restMan = man % 10000;

  if (eok > 0 && restMan > 0) return `${eok}억 ${restMan.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억`;
  return `${man.toLocaleString()}만원`;
};

/* ---------------------------------------------------------
 * 2) 응답 normalize (백엔드 키가 조금 달라도 흡수)
 * --------------------------------------------------------- */
const normalize = (segmentId, data) => {
  return {
    segmentId,

    // ✅ 세그먼트명/고객수
    segmentName: data?.segmentName ?? data?.name ?? "세그먼트",
    customerCount: Number(data?.customerCount ?? data?.count ?? 0) || 0,

    // ✅ 금액
    totalTradeAmount: Number(
      data?.totalTradeAmount ?? data?.totalAmount ?? data?.totalTrade ?? 0
    ) || 0,

    avgTradeAmount: Number(
      data?.avgTradeAmount ?? data?.avgAmount ?? data?.avgTrade ?? 0
    ) || 0,

    // ✅ 만족도 (키 통일 + 0~5 clamp)
    avgSatisfaction: clamp5(
      Number(
        data?.avgSatisfaction ??
        data?.avgScore ??
        data?.averageScore ??
        data?.score ??
        0
      ) || 0
    ),

    // ✅ 세그먼트 카드 하단 3개
    popularItem:
      data?.topItemName ??
      data?.popularItem ??
      data?.topItem ??
      data?.bestItem ??
      "",

    topInquiry:
      data?.topSupport ??
      data?.topInquiry ??
      data?.mainInquiry ??
      data?.inquiryKeyword ??
      "",

    topFeedback:
      data?.topFeedback ??
      data?.mainFeedback ??
      data?.feedbackKeyword ??
      "",

    // ✅ 로딩/에러 표시용
    _loading: false,
    _error: "",
  };
};

/* ---------------------------------------------------------
 * 3) API 호출
 * --------------------------------------------------------- */
const fetchAll = async () => {
  /**
   * ✅ 1) 먼저 로딩 카드(스켈레톤 역할)를 깔아둠
   * - 응답 도착 전에도 UI 레이아웃이 흔들리지 않게
   */
  cards.value = props.segmentIds.map((id) => ({
    segmentId: id,
    segmentName: "불러오는 중...",
    customerCount: 0,
    totalTradeAmount: 0,
    avgTradeAmount: 0,
    avgSatisfaction: 0,
    popularItem: "",
    topInquiry: "",
    topFeedback: "",
    _loading: true,
    _error: "",
  }));

  /**
   * ✅ 2) 세그먼트별 API 병렬 호출
   * - 실패해도 다른 카드 렌더링은 계속 진행
   */
  await Promise.all(
    props.segmentIds.map(async (id) => {
      try {
        const res = await getCustomerSegmentDetailCard(id);
        const data = res?.data ?? res; // axios면 res.data가 일반적이라 방어

        const next = normalize(id, data);

        const idx = cards.value.findIndex((x) => x.segmentId === id);
        if (idx >= 0) cards.value[idx] = next;
      } catch (e) {
        const idx = cards.value.findIndex((x) => x.segmentId === id);
        if (idx >= 0) {
          cards.value[idx] = {
            ...cards.value[idx],
            _loading: false,
            _error: e?.response?.data?.message ?? e?.message ?? String(e),
          };
        }
      }
    })
  );
};

onMounted(fetchAll);

/* ---------------------------------------------------------
 * 4) 카드 톤(테두리 강조)
 * --------------------------------------------------------- */
const toneClass = (segmentId) => {
  const map = {
    1: "tone-blue",     // 잠재
    2: "tone-sky",      // 신규
    3: "tone-green",    // 일반
    4: "tone-red",      // 이탈 위험
    5: "tone-amber",    // VIP
    6: "tone-gray",     // 블랙리스트
    7: "tone-purple",   // 확장 의사
  };
  return map[segmentId] ?? "tone-gray";
};
</script>
<style scoped>
/* ✅ 4 + 3 느낌 (반응형 포함) */
.seg-wrap{
  display:grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 1400px){
  .seg-wrap{ grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 1024px){
  .seg-wrap{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px){
  .seg-wrap{ grid-template-columns: 1fr; }
}

.seg-card{
  position: relative;
  background:#fff;
  border:1px solid #e5e7eb;
  border-radius: 16px;
  padding: 18px 18px 16px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  min-height: 320px;
}

.seg-head{
  display:flex;
  justify-content: space-between;
  align-items:flex-start;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f7;
  margin-bottom: 12px;
}

.seg-name{
  font-weight: 900;
  color:#111827;
  letter-spacing: -0.2px;
}

.seg-count{
  font-weight: 900;
  color:#111827;
}

.seg-metrics{
  display:flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f7;
  margin-bottom: 12px;
}

.metric-row{
  display:flex;
  justify-content: space-between;
  font-size: 12px;
}

.label{
  color:#6b7280;
  font-weight: 800;
}

.value{
  color:#111827;
  font-weight: 900;
}

.star{ margin-right: 4px; }

.seg-section{
  padding: 10px 0;
  border-bottom: 1px solid #eef2f7;
}
.seg-section:last-child{ border-bottom: none; padding-bottom: 0; }

.sec-title{
  font-size: 12px;
  font-weight: 900;
  color:#6b7280;
  margin-bottom: 6px;
}

.sec-body{
  font-size: 13px;
  font-weight: 900;
  color:#111827;
}

/* 톤(테두리 강조) */
.tone-blue{   border-color: rgba(59,130,246,0.35); box-shadow: 0 0 0 2px rgba(59,130,246,0.08); }
.tone-sky{    border-color: rgba(96,165,250,0.35); box-shadow: 0 0 0 2px rgba(96,165,250,0.08); }
.tone-green{  border-color: rgba(34,197,94,0.28);  box-shadow: 0 0 0 2px rgba(34,197,94,0.08); }
.tone-red{    border-color: rgba(239,68,68,0.28);  box-shadow: 0 0 0 2px rgba(239,68,68,0.08); }
.tone-amber{  border-color: rgba(245,158,11,0.28); box-shadow: 0 0 0 2px rgba(245,158,11,0.08); }
.tone-gray{   border-color: rgba(156,163,175,0.35); box-shadow: 0 0 0 2px rgba(156,163,175,0.08); }
.tone-purple{ border-color: rgba(168,85,247,0.28); box-shadow: 0 0 0 2px rgba(168,85,247,0.08); }

/* 로딩/에러 오버레이 */
.overlay{
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius: 16px;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(2px);
  color:#111827;
  font-weight: 900;
}
.overlay.error{
  color:#ef4444;
}
</style>
