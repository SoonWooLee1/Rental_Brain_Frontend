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
      <!-- 1) 납부 연체 -> 연체관리 탭 -->
      <article
        class="kpi-card clickable"
        role="button"
        tabindex="0"
        @click="goTo('overdue')"
        @keydown.enter.prevent="goTo('overdue')"
        @keydown.space.prevent="goTo('overdue')"
      >
        <div class="top">
          <p class="label">납부 연체</p>
          <span class="meta">진행 중</span>
        </div>
        <p class="value">
          <template v-if="!loading">{{ fmtInt(kpi.payOverdueCount) }}건</template>
          <span v-else class="skeleton w60" />
        </p>
        <p class="hint">입금이 지연된 계약</p>
      </article>

      <!-- 2) 향후 60일 만료 예정 계약 -> 계약(결재) 탭 -->
      <article
        class="kpi-card clickable"
        role="button"
        tabindex="0"
        @click="goTo('contractPay')"
        @keydown.enter.prevent="goTo('contractPay')"
        @keydown.space.prevent="goTo('contractPay')"
      >
        <div class="top">
          <p class="label">만료 예정 계약</p>
          <span class="meta">향후 60일</span>
        </div>
        <p class="value">
          <template v-if="!loading">{{ fmtInt(kpi.expiringContractCount) }}건</template>
          <span v-else class="skeleton w60" />
        </p>
        <p class="hint">곧 만료되는 계약</p>
      </article>

      <!-- 3) 문의 대기 -> 문의 관리 탭 -->
      <article
        class="kpi-card clickable"
        role="button"
        tabindex="0"
        @click="goTo('inquiry')"
        @keydown.enter.prevent="goTo('inquiry')"
        @keydown.space.prevent="goTo('inquiry')"
      >
        <div class="top">
          <p class="label">문의 대기</p>
          <span class="meta">대기 상태</span>
        </div>
        <p class="value">
          <template v-if="!loading">{{ fmtInt(kpi.waitingInquiryCount) }}건</template>
          <span v-else class="skeleton w60" />
        </p>
        <p class="hint">아직 처리되지 않은 문의</p>
      </article>

      <!-- 4) 이번 달 매출 -> 계약(결재) 탭 -->
      <article
        class="kpi-card clickable"
        role="button"
        tabindex="0"
        @click="goTo('contractPay')"
        @keydown.enter.prevent="goTo('contractPay')"
        @keydown.space.prevent="goTo('contractPay')"
      >
        <div class="top">
          <p class="label">이번 달 월 매출</p>
          <span class="meta">이번 달</span>
        </div>

        <p class="value">
          <template v-if="!loading">{{ fmtKRWCompact(kpi.mtdRevenue) }}</template>
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
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getDashboardKpi } from "@/api/dashboard"; 

const router = useRouter();

function goTo(key) {
  const map = {

    overdue: {
      name: "customer-risklist", 
    },

    contractPay: {
      name: "contract-list", 

    },

    inquiry: {
      name: "cs-support-list",
    },
  };

  const target = map[key];
  if (!target) return;

  router.push(target);
}

const fmtKRWCompact = (value) => {
  const v = Number(value ?? 0);
  if (!Number.isFinite(v) || v === 0) return "0원";

  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";

  const EOK = 100_000_000; // 억
  const MAN = 10_000;      // 만

  if (abs >= EOK) {
    const eok = Math.floor(abs / EOK);
    const man = Math.floor((abs % EOK) / MAN);
    return sign + (man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억`);
  }

  if (abs >= MAN) {
    return sign + `${Math.floor(abs / MAN).toLocaleString()}만원`;
  }

  return sign + abs.toLocaleString("ko-KR") + "원";
};

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

    const rate =
      data?.momRevenueRate ??
      data?.momRate ??
      data?.mom_revenue_rate ??
      data?.mom_rate ??
      0;

    kpi.value = {
      month: data?.month ?? data?.currentMonth ?? "",
      expiringContractCount: Number(data?.expiringContractCount ?? data?.expiring_contract_count ?? 0),
      payOverdueCount: Number(data?.payOverdueCount ?? data?.pay_overdue_count ?? 0),
      waitingInquiryCount: Number(data?.waitingInquiryCount ?? data?.waiting_inquiry_count ?? 0),
      mtdRevenue: Number(data?.mtdRevenue ?? data?.curRevenue ?? data?.mtd_revenue ?? data?.cur_revenue ?? 0),
      momRevenueRate: Number(rate ?? 0),
    };
    console.log("dashboard/kpi response:", data);
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

.left {
  padding-left: 10px;
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

.w60 {
  width: 60px;
}
.w80 {
  width: 80px;
}
.w100 {
  width: 110px;
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}

/* ✅ Hover 애니메이션 + 클릭 가능 스타일 */
.kpi-card.clickable {
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  will-change: transform;
}

.kpi-card.clickable:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(17, 24, 39, 0.1);
  border-color: #dbeafe;
}

.kpi-card.clickable:active {
  transform: translateY(-1px) scale(0.99);
  box-shadow: 0 6px 14px rgba(17, 24, 39, 0.08);
}

.kpi-card.clickable:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.25);
  outline-offset: 2px;
}

/* 반응형 */
@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
