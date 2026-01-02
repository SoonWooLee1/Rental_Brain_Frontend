<template>
  <el-dialog
    :model-value="open"
    @update:model-value="(v) => emit('update:open', v)"
    :title="`이탈 위험 고객 리스트 (${month || '-'})`"
    width="60%"
    class="risk-modal"
    destroy-on-close
  >
    <div class="modal-sub">
      <span class="pill">총 {{ totalCount.toLocaleString() }}개사</span>
      <span class="hint">고객사를 클릭하면 상세로 이동</span>
    </div>

    <div v-if="loading" class="loading">
      불러오는 중...
    </div>

    <div v-else>
      <el-table
        :data="pagedRows"
        height="450"
        stripe
        @row-click="goCustomer"
        class="risk-table"
      >
        <el-table-column prop="customerCode" label="고객코드" width="140" />
        <el-table-column prop="customerName" label="고객사" min-width="220" />
        <el-table-column prop="inCharge" label="담당자" width="120" />
        <el-table-column prop="dept" label="부서/직급" min-width="180" />
        <el-table-column label="연락처" width="150">
          <template #default="{ row }">
            {{ fmtPhone(row.callNum) }}
          </template>
        </el-table-column>
      </el-table>

        <div class="pagination-wrapper">
        <el-pagination
            layout="prev, pager, next"
            :total="totalCount"
            :page-size="pageSize"
            v-model:current-page="page"
        />
        </div>
    </div>

    <template #footer>
      <el-button @click="emit('update:open', false)">닫기</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { getRiskCustomersByMonth } from "@/api/customeranalysis";

const props = defineProps({
  open: { type: Boolean, default: false },
  month: { type: String, default: "" }, // YYYY-MM
});

const emit = defineEmits(["update:open"]);

const router = useRouter();

const loading = ref(false);
const rows = ref([]);
const totalCount = ref(0);

const page = ref(1);
const pageSize = 10;

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize;
  return (rows.value ?? []).slice(start, start + pageSize);
});

const fmtPhone = (v) => {
  const s = String(v ?? "").replace(/\D/g, "");
  if (!s) return "-";

  // 02 지역번호
  if (s.startsWith("02")) {
    if (s.length === 9) return `02-${s.slice(2, 5)}-${s.slice(5)}`;
    if (s.length === 10) return `02-${s.slice(2, 6)}-${s.slice(6)}`;
    return s;
  }

  // 010 / 011 등 휴대폰
  if (s.length === 11) return `${s.slice(0, 3)}-${s.slice(3, 7)}-${s.slice(7)}`;
  if (s.length === 10) return `${s.slice(0, 3)}-${s.slice(3, 6)}-${s.slice(6)}`;

  // 8자리 대표번호 등
  if (s.length === 8) return `${s.slice(0, 4)}-${s.slice(4)}`;

  return s;
};

const fetch = async () => {
  if (!props.open || !props.month) return;

  loading.value = true;
  page.value = 1;

  try {
    const res = await getRiskCustomersByMonth(props.month);
    const body = res?.data ?? res;

    rows.value = Array.isArray(body?.customers) ? body.customers : [];
    totalCount.value = Number(body?.totalCount ?? rows.value.length) || rows.value.length;
  } finally {
    loading.value = false;
  }
};

watch(() => props.open, fetch);
watch(() => props.month, fetch);




const goCustomer = async (row) => {
  const id = row?.customerId; // 네 API 응답 기준
  if (!id) return;

  await router.push({ name: "customer-detail", params: { id: String(id) } });

  // 이동 후 모달 닫기
  emit("update:open", false);
};
</script>

<style scoped>

.modal-sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 12px;
  color: #991b1b;
  background: rgba(239, 68, 68, 0.10);
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.hint {
  font-size: 12px;
  font-weight: 800;
  color: #6b7280;
}

.loading {
  height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #6b7280;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}


/* ===== 제품 모달 느낌: radius + shadow + padding ===== */
:deep(.risk-modal.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.25);
}

/* 헤더 (제품 모달 detail-header 느낌) */
:deep(.risk-modal .el-dialog__header) {
  margin-right: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #edf0f7;
}

:deep(.risk-modal .el-dialog__title) {
  font-weight: 900;
  font-size: 18px;
}

/* 바디 패딩 (제품 모달 detail-modal 내부 여백 느낌) */
:deep(.risk-modal .el-dialog__body) {
  padding: 16px 24px 12px;
}

/* 푸터도 제품 모달처럼 구분선 + 패딩 */
:deep(.risk-modal .el-dialog__footer) {
  padding: 12px 24px 16px;
  border-top: 1px solid #edf0f7;
}

/* ===== 테이블: 제품 테이블 톤(헤더 배경, 구분선) ===== */
:deep(.risk-table.el-table) {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

/* 헤더 배경/라인 */
:deep(.risk-table .el-table__header-wrapper th) {
  background: #f9fafb;
  color: #111827;
  font-weight: 800;
  border-bottom: 1px solid #edf0f7 !important;
}

/* 바디 셀 라인 톤 */
:deep(.risk-table .el-table__body td) {
  border-bottom: 1px solid #edf0f7;
}

/* 스트라이프 톤 살짝 연하게 */
:deep(.risk-table.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: #fafafa;
}

/* 클릭 가능 + hover */
:deep(.risk-table .el-table__row) {
  cursor: pointer;
}

:deep(.risk-table .el-table__row:hover td) {
  background: rgba(239, 68, 68, 0.06);
}

/* ===== Pagination: 제품 모달 톤에 맞게 라운드 ===== */
:deep(.risk-modal .el-pagination) {
  padding: 0;
}

:deep(.risk-modal .el-pager li) {
  border-radius: 6px;
  font-weight: 700;
}

:deep(.risk-modal .btn-prev),
:deep(.risk-modal .btn-next) {
  border-radius: 6px;
}
</style>
