<template>
  <div
    class="mix-card clickable"
    v-loading="loadingProduct"
    role="button"
    tabindex="0"
    @click="goLowUtilizationCampaign"
    @keydown.enter.prevent="goLowUtilizationCampaign"
    @keydown.space.prevent="goLowUtilizationCampaign"
  >
    <!-- Header -->
    <div class="head">
      <div class="title">미가동 자산 추정 매출 기회</div>
    </div>

    <!-- KPI -->
    <div class="kpi">
      <div class="kpi-value">{{ utilizationKpi.lossText }}</div>

        <div class="kpi-sub">
          <div class="kpi-row">
            <span class="kdot kdot-rate"></span>
            <div class="kpi-text">
              <div class="kpi-label">가동률</div>
              <div class="kpi-val">{{ utilizationKpi.rate }}%</div>
            </div>
          </div>

          <div class="kpi-row">
            <span class="kdot kdot-max"></span>
            <div class="kpi-text">
              <div class="kpi-label">최대 가능 매출</div>
              <div class="kpi-val">{{ utilizationKpi.potentialText }}</div>
            </div>
          </div>

          <div class="kpi-row">
            <span class="kdot kdot-actual"></span>
            <div class="kpi-text">
              <div class="kpi-label">실제 발생 매출</div>
              <div class="kpi-val">{{ utilizationKpi.actualText }}</div>
            </div>
          </div>

          <div class="kpi-row">
            <span class="kdot kdot-loss"></span>
            <div class="kpi-text">
              <div class="kpi-label kpi-label--wrap">
                미운용 자산으로 인한 매출 기회 손실
              </div>
              <div class="kpi-val">{{ utilizationKpi.lossText }}</div>
            </div>
          </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="foot">
      <button class="btn" type="button">자산 캠페인 생성</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getProductNameList } from "@/api/product";

const router = useRouter();
const loadingProduct = ref(false);
const productRes = ref({ contents: [] });

const formatMoneyEokMan = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "-";

  const EOK = 100_000_000;
  const MAN = 10_000;

  const eok = Math.floor(n / EOK);
  const rest = n % EOK;
  const man = Math.floor(rest / MAN);

  if (eok > 0 && man > 0) return `${eok}억 ${man}만원`;
  if (eok > 0) return `${eok}억`;
  return `${man}만원`;
};

const utilizationKpi = computed(() => {
  const rows = productRes.value?.contents ?? [];

  let totalPotential = 0;
  let actual = 0;

  for (const p of rows) {
    const price = Number(p.monthlyPrice ?? 0);
    const stock = Number(p.stockAmount ?? 0);
    const rented = Number(p.rentalAmount ?? 0);

    if (!Number.isFinite(price) || !Number.isFinite(stock) || !Number.isFinite(rented)) continue;

    totalPotential += price * stock;
    actual += price * rented;
  }

  const loss = Math.max(0, totalPotential - actual);
  const rate = totalPotential > 0 ? Math.round((actual / totalPotential) * 100) : 0;

  return {
    totalPotential,
    actual,
    loss,
    rate,
    lossText: formatMoneyEokMan(loss),
    potentialText: formatMoneyEokMan(totalPotential),
    actualText: formatMoneyEokMan(actual),
  };
});

const fetchProductList = async () => {
  loadingProduct.value = true;
  try {
    const { data } = await getProductNameList();
    productRes.value.contents = data?.contents ?? data ?? [];
  } catch (e) {
    console.error("제품 현황 조회 실패", e);
  } finally {
    loadingProduct.value = false;
  }
};

const goLowUtilizationCampaign = () => {
  router.push({ name: "campaign-setting", query: { type: "LOW_UTILIZATION" } });
};

onMounted(fetchProductList);
</script>

<style scoped>
/* 카드 프레임 */
.mix-card {
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  width: 100%;
  height: 100%;
  overflow: hidden;

  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Header */
.head {
  padding: 16px 18px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.title {
  font-size: 14px;
  font-weight: 900;
  color: #111827;
  letter-spacing: -0.2px;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


/* KPI */
.kpi {
  padding: 0 20px 12px;
}

/* ✅ 상단 KPI 숫자 위계 강화 */
.kpi-value {
  font-size: 28px;
  font-weight: 950;
  color: #111827;
  letter-spacing: -0.6px;
  line-height: 1.1;
  margin: 2px 0 14px;
}

/* KPI Sub */
.kpi-sub {
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 0; /* divider로 구분 */
  min-width: 0;
}

/* Row */
.kpi-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 6px;
  min-width: 0;
}


/* dot */
.kdot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 auto;
}

/* dot 색 */
.kdot-rate   { background: #6366f1; } /* 보라 */
.kdot-max    { background: #9ca3af; } /* 회색 */
.kdot-actual { background: #3b82f6; } /* 파랑 */
.kdot-loss   { background: #ef4444; } /* 빨강 */

/* 좌 라벨 / 우 값 */
.kpi-text {
  min-width: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}

/* ✅ 라벨(보조) */
.kpi-label {
  font-size: 12px;
  font-weight: 600;
  color: #000000;
  letter-spacing: -0.1px;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ✅ 값(핵심) */
.kpi-val {
  font-size: 13px;
  font-weight: 950;
  color: #111827;
  letter-spacing: -0.2px;

  white-space: nowrap;
  flex: 0 0 auto;
}

/* 긴 라벨 줄바꿈 */
.kpi-label--wrap {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  line-height: 1.35;
}

/* ✅ 손실 row 강조 (템플릿에 kpi-row--loss 필요) */
.kpi-row--loss {
  margin-top: 6px;
  border-top: none !important;

  border-radius: 12px;
  padding: 12px 10px;
}

.kpi-row--loss .kpi-label {
  color: #000000;
  font-weight: 900;
}

.kpi-row--loss .kpi-val {
  color: #000000;
  font-weight: 950;
}

.kpi-row--loss .kdot-loss {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}

/* Footer */
.foot {
  margin-top: auto;
  padding: 12px 16px;

  display: flex;
  justify-content: flex-end;
  gap: 12px;
  min-width: 0;
}

.btn {
  font-size: 12px;
  font-weight: 600;
  padding: 10px 14px;
  border-radius: 12px;

  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;

  cursor: pointer;
  white-space: nowrap;
  flex: 0 0 auto;

  transition: transform 120ms ease, opacity 120ms ease;
}

.btn:hover { opacity: 0.92; }
.btn:active { transform: translateY(1px); }

@media (max-width: 700px) {
  .foot {
    justify-content: stretch;
    flex-direction: column;
    align-items: stretch;
  }
  .btn { width: 100%; }
}
</style>
