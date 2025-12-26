<template>
  <section class="kpi-wrap">
    <div class="kpi-header">
      <div class="left">
        <h2>대시보드</h2>
        <p class="sub">핵심 현황을 빠르게 확인하세요</p>
      </div>

      <div class="right">
        <span class="month-chip">{{ kpi.month || "-" }}</span>
        <button class="refresh" :disabled="loading" @click="load">
          {{ loading ? "불러오는 중..." : "새로고침" }}
        </button>
      </div>
    </div>
    
    <div class="kpi-grid">

      <!-- 1) 납부 연체 -->
      <article class="kpi-card">
        <div class="top">
          <p class="label">납부 연체</p>
          <span class="meta">진행 중</span>
        </div>
        <p class="value">
          <template v-if="!loading">{{ fmtInt(kpi.payOverdueCount) }}건</template>
          <span v-else class="skeleton w60" />
        </p>
        <p class="hint">수금 리스크 모니터링</p>
      </article>

      <!-- 2) 향후 60일 만료 예정 계약 -->
      <article class="kpi-card">
        <div class="top">
          <p class="label">만료 예정 계약</p>
          <span class="meta">향후 60일</span>
        </div>
        <p class="value">
          <template v-if="!loading">{{ fmtInt(kpi.expiringContractCount) }}건</template>
          <span v-else class="skeleton w60" />
        </p>
        <p class="hint">재계약/연장 우선 대상</p>
      </article>



      <!-- 3) 문의 대기 -->
      <article class="kpi-card">
        <div class="top">
          <p class="label">문의 대기</p>
          <span class="meta">대기 상태</span>
        </div>
        <p class="value">
          <template v-if="!loading">{{ fmtInt(kpi.waitingInquiryCount) }}건</template>
          <span v-else class="skeleton w60" />
        </p>
        <p class="hint">응대 병목 확인</p>
      </article>

      <!-- 4) 이번 달 매출 -->
      <article class="kpi-card">
        <div class="top">
          <p class="label">이번 달 매출</p>
          <span class="meta">MoM</span>
        </div>

        <p class="value">
          <template v-if="!loading">{{ fmtKRW(kpi.mtdRevenue) }}</template>
          <span v-else class="skeleton w80" />
        </p>

        <p class="hint">
          <template v-if="!loading">
            <span :class="momClass(kpi.momRevenueRate)">
              {{ fmtSignedPercent(kpi.momRevenueRate) }}
            </span>
            <span class="muted">전월 대비</span>
          </template>
          <span v-else class="skeleton w100" />
        </p>
      </article>
    </div>

    <p v-if="errorMsg" class="error">
      {{ errorMsg }}
    </p>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { getDashboardKpi } from "@/api/dashboard"; // ✅ dashboard.js에 이 함수가 있어야 함

// 필요하면 props로 month를 받아서 대시보드 기간 조회도 가능
const props = defineProps({
  month: { type: String, default: "" }, // "2025-12" 같은 YYYY-MM (옵션)
});

const loading = ref(false);
const errorMsg = ref("");

const kpi = ref({
  month: "",
  expiringContractCount: 0,
  payOverdueCount: 0,
  waitingInquiryCount: 0,
  mtdRevenue: 0,
  momRevenueRate: 0.0,
});

const load = async () => {
  loading.value = true;
  errorMsg.value = "";

  try {
    // month가 있으면 params로 넘기고, 없으면 기본 호출
    const { data } = props.month
      ? await getDashboardKpi(props.month)
      : await getDashboardKpi();

    kpi.value = {
      month: data?.month ?? "",
      expiringContractCount: Number(data?.expiringContractCount ?? 0),
      payOverdueCount: Number(data?.payOverdueCount ?? 0),
      waitingInquiryCount: Number(data?.waitingInquiryCount ?? 0),
      mtdRevenue: Number(data?.mtdRevenue ?? 0),
      momRevenueRate: Number(data?.momRevenueRate ?? 0),
    };
  } catch (e) {
    console.error(e);
    errorMsg.value = "KPI를 불러오지 못했습니다. 백엔드/네트워크 상태를 확인해주세요.";
  } finally {
    loading.value = false;
  }
};

onMounted(load);

// ---------- formatting ----------
const fmtInt = (n) => (Number.isFinite(n) ? n.toLocaleString("ko-KR") : "0");

const fmtKRW = (n) => {
  const v = Number(n ?? 0);
  // 너무 큰 숫자는 억/만 단위로 줄여도 되는데, 일단 KRW 표기만
  return "₩" + (Number.isFinite(v) ? v.toLocaleString("ko-KR") : "0");
};

const fmtSignedPercent = (p) => {
  const v = Number(p ?? 0);
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
};

const momClass = (p) => {
  const v = Number(p ?? 0);
  if (v > 0) return "pos";
  if (v < 0) return "neg";
  return "neu";
};
</script>

<style scoped>
.kpi-wrap {
  width: 100%;
}

.kpi-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 14px;
}

.kpi-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #111827;
}

.kpi-header .sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.month-chip {
  font-size: 12px;
  color: #111827;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  border-radius: 999px;
}

.refresh {
  font-size: 12px;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  color: #111827;
}

.refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

/* 카드 톤: 고객 목록 페이지처럼 담백하게 */
.kpi-card {
  background: #ffffff;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.04);
  min-height: 120px;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
}

.meta {
  font-size: 11px;
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid #eef2f7;
  padding: 4px 8px;
  border-radius: 999px;
}

.value {
  margin: 12px 0 6px;
  font-size: 22px;
  font-weight: 900;
  color: #111827;
  letter-spacing: -0.3px;
}

.hint {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.muted {
  margin-left: 6px;
  color: #6b7280;
}

/* MoM 색상은 알록달록 아니고, 텍스트만 살짝 */
.pos {
  color: #2563eb; /* 파랑 */
  font-weight: 800;
}
.neg {
  color: #dc2626; /* 빨강 */
  font-weight: 800;
}
.neu {
  color: #111827;
  font-weight: 800;
}

.error {
  margin-top: 10px;
  font-size: 12px;
  color: #dc2626;
}

/* Loading skeleton */
.skeleton {
  display: inline-block;
  height: 18px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

.w60 { width: 60px; }
.w80 { width: 80px; }
.w100 { width: 110px; }

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

/* 반응형 */
@media (max-width: 1200px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .kpi-grid { grid-template-columns: 1fr; }
}
</style>
