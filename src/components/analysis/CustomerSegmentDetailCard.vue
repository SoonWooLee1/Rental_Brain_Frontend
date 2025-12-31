<template>
  <div class="seg-wrap">
      <BaseCard
        v-for="c in cards"
        :key="c.segmentId"
        class="seg-card"
        :class="toneClass(c.segmentId)"
        :hoverable="true"
        role="button"
        tabindex="0"
        @click="openSegment(c.segmentId)"
        @keydown.enter="openSegment(c.segmentId)"
      >
      <!-- ✅ 카드 헤더 슬롯 -->
      <template #header>
        <div class="seg-head">
          <div class="seg-name">{{ c.segmentName }}</div>
          <div class="seg-count">{{ fmt(c.customerCount) }}개사</div>
        </div>
      </template>

      <!-- ✅ 카드 바디 -->
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
    </BaseCard>
    <!-- 모달 -->
      <SegmentCustomersModal
        :open="modalOpen"
        :segmentId="selectedSegmentId"
        @close="modalOpen = false"
      />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { getCustomerSegmentDetailCard } from "@/api/customeranalysis";
import BaseCard from "@/components/common/BaseCard.vue";
import SegmentCustomersModal from "@/components/analysis/SegmentCustomersModal.vue";

// 모달
const modalOpen = ref(false);
const selectedSegmentId = ref(1);

const openSegment = (segmentId) => {
  selectedSegmentId.value = Number(segmentId);
  modalOpen.value = true;
};

/**
 * ✅ props: 조회할 세그먼트 ID 목록
 * - 기본값: 1~7
 */
const props = defineProps({
  segmentIds: { type: Array, default: () => [1, 2, 3, 4, 5, 6, 7] },
});

const cards = ref([]);

// 1) 공통 유틸(값 보정/포맷)

/** ✅ 만족도는 0~5 범위로 강제 */
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
 */
const moneyKr = (won) => {
  const v = Math.floor(Number(won) || 0);
  if (v <= 0) return "0만원";

  const man = Math.floor(v / 10000);
  const eok = Math.floor(man / 10000);
  const restMan = man % 10000;

  if (eok > 0 && restMan > 0) return `${eok}억 ${restMan.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억`;
  return `${man.toLocaleString()}만원`;
};

/* ---------------------------------------------------------
 * 2) 응답 normalize
 * --------------------------------------------------------- */
const normalize = (segmentId, data) => {
  return {
    segmentId,
    segmentName: data?.segmentName ?? data?.name ?? "세그먼트",
    customerCount: Number(data?.customerCount ?? data?.count ?? 0) || 0,

    totalTradeAmount: Number(
      data?.totalTradeAmount ?? data?.totalAmount ?? data?.totalTrade ?? 0
    ) || 0,

    avgTradeAmount: Number(
      data?.avgTradeAmount ?? data?.avgAmount ?? data?.avgTrade ?? 0
    ) || 0,

    avgSatisfaction: clamp5(
      Number(
        data?.avgSatisfaction ??
          data?.avgScore ??
          data?.averageScore ??
          data?.score ??
          0
      ) || 0
    ),

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

    _loading: false,
    _error: "",
  };
};

/* ---------------------------------------------------------
 * 3) API 호출
 * --------------------------------------------------------- */
const fetchAll = async () => {
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

  await Promise.all(
    props.segmentIds.map(async (id) => {
      try {
        const res = await getCustomerSegmentDetailCard(id);
        const data = res?.data ?? res;

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
 * 4) 카드 톤(테두리 강조) - BaseCard 위에 덧씌우기
 * --------------------------------------------------------- */
const toneClass = (segmentId) => {
  const map = {
    1: "tone-blue",
    2: "tone-sky",
    3: "tone-green",
    4: "tone-red",
    5: "tone-amber",
    6: "tone-gray",
    7: "tone-purple",
  };
  return map[segmentId] ?? "tone-gray";
};
</script>

<style scoped>
/* ✅ 4 + 3 느낌 (반응형 포함) */
.seg-wrap {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 1400px) {
  .seg-wrap {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 1024px) {
  .seg-wrap {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .seg-wrap {
    grid-template-columns: 1fr;
  }
}

/* ✅ BaseCard에 추가로 주고 싶은 레이아웃만 */
.seg-card {
  position: relative;
  min-height: 320px;
}

/* 헤더 영역(슬롯 안에서) */
.seg-head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f7;
}

.seg-name {
  font-weight: 900;
  color: #111827;
  letter-spacing: -0.2px;
}

.seg-count {
  font-weight: 900;
  color: #111827;
}

/* metrics */
.seg-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f7;
  margin-bottom: 12px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.label {
  color: #6b7280;
  font-weight: 800;
}

.value {
  color: #111827;
  font-weight: 900;
}

.star {
  margin-right: 4px;
}

/* sections */
.seg-section {
  padding: 10px 0;
  border-bottom: 1px solid #eef2f7;
}
.seg-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.sec-title {
  font-size: 12px;
  font-weight: 900;
  color: #6b7280;
  margin-bottom: 6px;
}

.sec-body {
  font-size: 13px;
  font-weight: 900;
  color: #111827;
}

/* ✅ 톤(테두리 강조) - BaseCard 기본 border/shadow 위에 덧씌움 */
.tone-blue {
  border-color: rgba(59, 130, 246, 0.35);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.08);
}
.tone-sky {
  border-color: rgba(96, 165, 250, 0.35);
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.08);
}
.tone-green {
  border-color: rgba(34, 197, 94, 0.28);
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.08);
}
.tone-red {
  border-color: rgba(239, 68, 68, 0.28);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.08);
}
.tone-amber {
  border-color: rgba(245, 158, 11, 0.28);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.08);
}
.tone-gray {
  border-color: rgba(156, 163, 175, 0.35);
  box-shadow: 0 0 0 2px rgba(156, 163, 175, 0.08);
}
.tone-purple {
  border-color: rgba(168, 85, 247, 0.28);
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.08);
}

/* 로딩/에러 오버레이 */
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px; /* ✅ BaseCard radius(12px)와 통일 */
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(2px);
  color: #111827;
  font-weight: 900;
}
.overlay.error {
  color: #ef4444;
}

.seg-card {
  position: relative;
  min-height: 320px;
  cursor: pointer;
}

.seg-card:focus {
  outline: 2px solid #c7d2fe;
  outline-offset: 2px;
}
</style>
