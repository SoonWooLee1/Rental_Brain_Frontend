<template>
  <el-dialog
    :model-value="open"
    @close="emit('close')"
    width="1180px"
    top="6vh"
    class="seg-modal"
    append-to-body
    destroy-on-close
  >
    <!-- ✅ header slot -->
    <template #header>
      <div class="seg-modal-head">
        <div class="head-title">
          {{ activeCard?.segmentName ?? "세그먼트" }}
          <span class="head-sub">({{ fmt(customers.length) }}개사)</span>
        </div>
      </div>
    </template>

    <!-- ✅ 상단: 세그먼트 전환 칩 -->
    <div class="seg-chip-row">
      <el-scrollbar>
        <div class="seg-chips">
          <button
            v-for="c in cards"
            :key="c.segmentId"
            class="seg-chip"
            :class="{ active: c.segmentId === activeSegmentId }"
            type="button"
            @click="selectSegment(c.segmentId)"
          >
            <span class="chip-dot" :style="{ background: segColor(c.segmentId) }"></span>

            <span class="chip-name">{{ c.segmentName }}</span>
            <span class="chip-count">{{ fmt(c.customerCount) }}개사</span>
          </button>
        </div>
      </el-scrollbar>
    </div>

    <!-- ✅ 본문: 비어보이지 않게 2컬럼 요약 -->
    <div class="seg-summary-grid">
      <!-- LEFT: 설명 + KPI -->
      <div class="sum-left">
        <div class="desc-box">
          {{ detail?.segmentContent || "세그먼트 기준 설명이 없습니다." }}
        </div>

       <!-- ✅ KPI 2줄로 꽉 채우기 -->
        <div class="kpi-wrap">
          <!-- 1줄(4개) -->
          <div class="kpi-row">
            <div class="kpi-card">
              <div class="kpi-label">총 거래액</div>
              <div class="kpi-value">{{ moneyKr(activeCard?.totalTradeAmount) }}</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">평균 거래액</div>
              <div class="kpi-value">{{ moneyKr(activeCard?.avgTradeAmount) }}</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">고객 수</div>
              <div class="kpi-value">{{ fmt(activeCard?.customerCount) }}개사</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">평균 만족도</div>
              <div class="kpi-value">
                <el-icon class="kpi-icon"><StarFilled /></el-icon>
                {{ score(activeCard?.avgSatisfaction) }}
              </div>
            </div>
          </div>

          <!-- 2줄(3개) -->
          <div class="kpi-row kpi-row-3">
            <div class="kpi-card">
              <div class="kpi-label">인기 품목</div>
              <div class="kpi-value kpi-text">{{ activeCard?.popularItem || "-" }}</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">주요 문의</div>
              <div class="kpi-value kpi-text">{{ activeCard?.topInquiry || "-" }}</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">주요 피드백</div>
              <div class="kpi-value kpi-text">{{ activeCard?.topFeedback || "-" }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ 테이블 -->
    <div class="table-wrap">
      <div v-if="loading" class="state">불러오는 중...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>

      <el-table
        v-else
        :data="customers"
        height="380"
        stripe
        @row-click="onRowClick"
      >
        <el-table-column prop="customerCode" label="고객코드" width="140" />
        <el-table-column prop="customerName" label="고객명" min-width="220" />
        <el-table-column prop="inCharge" label="담당자" width="120" />
        <el-table-column prop="dept" label="부서/직급" min-width="180" />
        <el-table-column label="연락처" width="140">
          <template #default="{ row }">
            <span class="mono">{{ formatPhone(row.callNum) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="만족도" width="90" align="center">
          <template #default="{ row }">
            <span v-if="row.star != null">
              <el-icon class="kpi-icon"><StarFilled /></el-icon> 
              {{ row.star }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="hint">행을 클릭하면 고객 상세로 이동합니다.</div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getCustomerSegmentDetailCard, getSegmentDetailWithCustomers } from "@/api/customeranalysis";
import { StarFilled } from "@element-plus/icons-vue";

const router = useRouter();
const route = useRoute();

const props = defineProps({
  open: { type: Boolean, default: false },
  segmentId: { type: Number, required: true },
  segmentIds: { type: Array, default: () => [1, 2, 3, 4, 5, 6, 7] },
});

const segColor = (id) => {
  const map = {
    1: "#3b82f6", // 잠재
    2: "#60a5fa", // 신규
    3: "#22c55e", // 일반
    4: "#ef4444", // 이탈위험
    5: "#f59e0b", // VIP
    6: "#9ca3af", // 블랙리스트
    7: "#a855f7", // 확장의사
  };
  return map[Number(id)] ?? "#9ca3af";
};

const emit = defineEmits(["close"]);

const activeSegmentId = ref(props.segmentId);

watch(
  () => props.segmentId,
  (v) => {
    if (v) activeSegmentId.value = Number(v);
  }
);

const loading = ref(false);
const error = ref("");
const detail = ref(null);
const cards = ref([]);

const customers = computed(() => {
  const arr = detail.value?.customers;
  return Array.isArray(arr) ? arr : [];
});

const fmt = (n) => (Number(n) || 0).toLocaleString();
const clamp5 = (v) => Math.max(0, Math.min(5, Number(v) || 0));
const score = (v) => {
  const n = clamp5(v);
  if (!n) return "-";
  return (Math.round(n * 10) / 10).toFixed(1);
};

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

const formatPhone = (value) => {
  if (!value) return "-";
  const d = String(value).replace(/\D/g, "");

  if (d.startsWith("02")) {
    if (d.length === 9) return d.replace(/^(\d{2})(\d{3})(\d{4})$/, "$1-$2-$3");
    if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "$1-$2-$3");
  }
  if (d.length === 10) return d.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3");
  if (d.length === 11) return d.replace(/^(\d{3})(\d{4})(\d{4})$/, "$1-$2-$3");
  return value;
};

const normalizeCard = (segmentId, data) => ({
  segmentId,
  segmentName: data?.segmentName ?? data?.name ?? "세그먼트",
  customerCount: Number(data?.customerCount ?? data?.count ?? 0) || 0,
  totalTradeAmount: Number(data?.totalTradeAmount ?? data?.totalAmount ?? 0) || 0,
  avgTradeAmount: Number(data?.avgTradeAmount ?? data?.avgAmount ?? 0) || 0,
  avgSatisfaction: clamp5(data?.avgSatisfaction ?? data?.avgScore ?? 0),
  popularItem: data?.topItemName ?? "",
  topInquiry: data?.topSupport ?? "",
  topFeedback: data?.topFeedback ?? "",
});

const activeCard = computed(() =>
  cards.value.find((c) => c.segmentId === activeSegmentId.value)
);

const loadCards = async () => {
  cards.value = await Promise.all(
    props.segmentIds.map(async (id) => {
      try {
        const res = await getCustomerSegmentDetailCard(id);
        return normalizeCard(Number(id), res?.data ?? res);
      } catch {
        return { segmentId: Number(id), segmentName: "불러오기 실패", customerCount: 0 };
      }
    })
  );
};

const loadDetail = async () => {
  if (!props.open) return;
  if (!activeSegmentId.value) return;

  loading.value = true;
  error.value = "";
  try {
    const res = await getSegmentDetailWithCustomers(activeSegmentId.value);
    detail.value = res?.data ?? null;
  } catch (e) {
    detail.value = null;
    error.value = e?.response?.data?.message ?? e?.message ?? "목록을 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
};

const selectSegment = (id) => {
  activeSegmentId.value = Number(id);
};

const onRowClick = (row) => {
  const customerId = row?.customerId ?? row?.id;
  if (!customerId) return;
  emit("close");
  router.push({
    name: "customer-detail",
    params: { id: customerId },
    query: { from: route.fullPath, segmentId: activeSegmentId.value },
  });
};

// 모달 open 시: 카드(칩용) 1번 로드 + 선택 세그먼트 고객 로드
watch(
  () => props.open,
  async (v) => {
    if (!v) return;
    await loadCards();
    await loadDetail();
  },
  { immediate: true }
);

// activeSegmentId 바뀌면 고객 테이블만 교체
watch(
  () => activeSegmentId.value,
  async () => {
    if (!props.open) return;
    await loadDetail();
  }
);
</script>

<style scoped>
/* =========================
   Modal Base (Element Plus el-dialog)
========================= */
:deep(.el-overlay) {
  background: rgba(17, 24, 39, 0.45);
}

:deep(.el-dialog) {
  width: 1120px;
  max-width: calc(100vw - 28px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}

:deep(.el-dialog__header) {
  margin: 0;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.el-dialog__headerbtn) {
  top: 10px;
  right: 12px;
}

:deep(.el-dialog__body) {
  padding: 14px 18px 18px;
}

/* =========================
   Segment Chips
========================= */
.seg-chip-row {
  margin-bottom: 12px;
}

.seg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.seg-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 12px;
  font-weight: 800;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.seg-chip:hover {
  background: #f9fafb;
}

.seg-chip.active {
  border-color: #c7d2fe;
  background: #eef2ff;
  color: #1e3a8a;
}

.chip-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
  flex: 0 0 auto;
}

.chip-name {
  font-weight: 900;
}

.chip-count {
  font-weight: 900;
  color: #111827;
}

/* =========================
   Summary (설명 + KPI)
========================= */
.desc-box {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  background: #f9fafb;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

/* =========================
   KPI Layout (4 + 3)  ✅ 전체 너비 동일
   - 12 컬럼 그리드
   - 1줄(4개): 각 3칸씩 (3*4=12)
   - 2줄(3개): 각 4칸씩 (4*3=12)
   ✅ kpi-row wrapper는 display: contents로 “없는 것처럼” 처리
========================= */
.kpi-wrap {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

/* ✅ 핵심: row wrapper를 레이아웃에서 제거해서 카드가 grid에 직접 올라오게 */
.kpi-row {
  display: contents;
}

/* 상단 4개 카드 */
.kpi-wrap .kpi-card:nth-of-type(-n + 4) {
  grid-column: span 3;
}

/* 하단 3개 카드 */
.kpi-wrap .kpi-card:nth-of-type(n + 5) {
  grid-column: span 4;
}

.kpi-card {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  min-height: 74px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.kpi-label {
  font-size: 12px;
  font-weight: 800;
  color: #6b7280;
}

.kpi-value {
  margin-top: 6px;
  font-size: 14px;
  font-weight: 900;
  color: #111827;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.kpi-icon {
  font-size: 14px;
  color: #f59e0b;
}

.kpi-text {
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* =========================
   Table (Element Plus el-table)
========================= */
.table-wrap {
  margin-top: 14px;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

:deep(.el-table__header-wrapper th) {
  background: #f9fafb !important;
  color: #111827 !important;
  font-weight: 900 !important;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover > td) {
  background: #f9fafb !important;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}

.state {
  padding: 18px;
  text-align: center;
  font-weight: 800;
  color: #6b7280;
}

.state.error {
  color: #b91c1c;
}

.hint {
  padding: 10px 12px 12px;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
}

/* =========================
   Responsive
========================= */
@media (max-width: 900px) {
  .kpi-wrap {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  /* 모바일: 2열 느낌으로 정리 */
  .kpi-wrap .kpi-card {
    grid-column: span 3;
  }
}

</style>
