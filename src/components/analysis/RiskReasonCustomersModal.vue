<template>
  <teleport to="body">
    <div v-if="open" class="backdrop" @click.self="emit('close')">
      <div class="modal">
        <!-- ✅ 헤더: 제목/메타 분리해서 텍스트 안깨지게 -->
        <div class="head">
          <div class="head-left">
            <h3 class="title">이탈 위험 사유별 고객 리스트</h3>
            <div class="meta">{{ month }} / {{ label(selected) }}</div>
          </div>
          <button class="x" @click="emit('close')">✕</button>
        </div>

        <div class="body">
          <!-- 사유 탭 -->
          <div class="tabs">
            <button
              v-for="r in tabItems"
              :key="r.reasonCode"
              class="tab"
              :class="{ active: r.reasonCode === selected }"
              @click="select(r.reasonCode)"
              type="button"
            >
              <span class="tab-label">{{ label(r.reasonCode) }}</span>
              <span class="pct">{{ round1(r.ratio) }}%</span>
            </button>
          </div>

          <!-- 리스트 -->
          <div class="content">
            <div v-if="loading" class="state">불러오는 중...</div>
            <div v-else-if="error" class="state error">{{ error }}</div>
            <div v-else-if="customers.length === 0" class="state">
              해당 월에 해당 사유 고객이 없습니다.
            </div>

            <div v-else class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th class="w-code">고객코드</th>
                    <th class="w-name">고객명</th>
                    <th class="w-person">담당자</th>
                    <th class="w-dept">부서/직급</th>
                    <th class="w-call">연락처</th>
                    <th class="w-dt">전환시점</th>
                  </tr>
                </thead>
               <tbody>
                  <tr
                    v-for="c in customers"
                    :key="c.customerId"
                    class="row clickable"
                    @click="goCustomer(c.customerId)"
                  >
                    <td class="mono">{{ c.customerCode ?? "-" }}</td>
                    <td class="name">{{ c.customerName ?? "-" }}</td>
                    <td>{{ c.inCharge ?? "-" }}</td>
                    <td>{{ c.dept ?? "-" }}</td>
                    <td class="mono">{{ formatPhone(c.callNum ?? "-") }}</td>
                    <td class="mono">{{ formatDateTime(c.changedAt ?? "-") }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="!loading && !error" class="foot">
              총 {{ totalCount.toLocaleString() }}명
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router"; 
import { getRiskReasonCustomers } from "@/api/customeranalysis";

const router = useRouter(); 

const formatPhone = (phone) => {
  if (!phone) return "-";
  const value = String(phone).replace(/\D/g, "");

  // 휴대폰
  if (value.length === 11) return value.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");

  // ✅ 서울(02) : 02-xxxx-xxxx or 02-xxx-xxxx
  if (value.startsWith("02")) {
    if (value.length === 10) return value.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
    if (value.length === 9)  return value.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
  }

  // ✅ 기타 지역번호: 3-3-4
  if (value.length === 10) return value.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  return phone;
};

// 전환 시점
const formatDateTime = (value) => {
  if (!value) return "-";
  const s = String(value);  
  return s.replace("T", " ").substring(0, 16);
};


const goCustomer = async (customerId) => {
  if (!customerId) return;

  try {
    // 기준 고객 상세 라우트
    await router.push({ name: "customer-detail", params: { id: String(customerId) } });
  } finally {
    // 이동 후 모달 닫기(권장)
    emit("close");
  }
};

const props = defineProps({
  open: { type: Boolean, default: false },
  month: { type: String, required: true },
  defaultReasonCode: { type: String, default: "OVERDUE" },
  reasons: { type: Array, default: () => [] }, // KPI2에서 내려온 ratio 리스트(탭 표시용)
});

const emit = defineEmits(["close"]);

const selected = ref(props.defaultReasonCode);
const loading = ref(false);
const error = ref("");
const customers = ref([]);
const totalCount = ref(0);

const tabItems = computed(() => {
  // reasons가 비어도 4개 고정 탭은 보이게
  const fallback = ["EXPIRING", "LOW_SAT", "OVERDUE", "NO_RENEWAL"].map((c) => ({
    reasonCode: c,
    ratio: 0,
  }));

  const arr =
    Array.isArray(props.reasons) && props.reasons.length ? props.reasons : fallback;

  // 고정 순서 유지
  const order = ["EXPIRING", "LOW_SAT", "OVERDUE", "NO_RENEWAL"];
  return [...arr].sort((a, b) => order.indexOf(a.reasonCode) - order.indexOf(b.reasonCode));
});

const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

const label = (code) => {
  switch (code) {
    case "EXPIRING":
      return "계약 만료 임박형";
    case "LOW_SAT":
      return "저만족(≤2.5)형";
    case "OVERDUE":
      return "연체형";
    case "NO_RENEWAL":
      return "만료+무재계약";
    default:
      return code;
  }
};

const load = async () => {
  if (!props.open) return;

  loading.value = true;
  error.value = "";
  customers.value = [];
  totalCount.value = 0;

  try {
    const res = await getRiskReasonCustomers(props.month, selected.value);
    const data = res?.data ?? {};
    customers.value = Array.isArray(data.customers) ? data.customers : [];
    totalCount.value = Number(data.totalCount ?? customers.value.length ?? 0);
  } catch (e) {
    error.value =
      e?.response?.data?.message ?? e?.message ?? "고객 리스트를 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
};

const select = (code) => {
  selected.value = code;
  load();
};

// open / month / defaultReasonCode 변경 반영
watch(
  () => [props.open, props.month, props.defaultReasonCode],
  () => {
    if (props.defaultReasonCode) selected.value = props.defaultReasonCode;
    if (props.open) load();
  },
  { immediate: true }
);
</script>

<style scoped>
/* =========================
   Backdrop
========================= */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1 !important;
  filter: none !important;
}

/* =========================
   Modal (✅ 더 크게)
========================= */
.modal {
  width: 1320px;                         /* ✅ 더 크게 */
  max-width: calc(100vw - 40px);         /* ✅ 여백 조금 더 */
  height: min(760px, 88vh);              /* ✅ 더 크게 */
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  overflow: hidden;
    font-family: Pretendard, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Noto Sans KR", Arial, sans-serif;

  display: flex;
  flex-direction: column;

  opacity: 1 !important;
  filter: none !important;
  color: #111827;
}

/* =========================
   Header
========================= */
.head {
  padding: 16px 20px;
  border-bottom: 1px solid #eef2f7;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.head-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.title {
  font-size: 18px;          /* 기존보다 살짝 또렷 */
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.2px;
}

.meta {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
}

.x {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
  padding: 2px 6px;
  color: #111827;
}

/* =========================
   Body Layout
========================= */
.body {
  flex: 1;
  display: flex;
  gap: 14px;
  padding: 16px 20px 20px;
  overflow: hidden; /* ✅ body 자체 스크롤 제거(안쪽에서만) */
}

/* =========================
   Tabs (좌측)
========================= */
.tabs {
  width: 300px; /* ✅ 살짝 넓힘 */
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.tab {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;

  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;

  font-size: 12px;
  font-weight: 900;
  color: #111827;

  white-space: nowrap;
}

.tab:hover {
  background: #f9fafb;
}

.tab.active {
  border-color: #111827;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06);
}

.tab-label {
  font-size: 13px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.1px;
}


.pct {
  font-size: 13px;
  font-weight: 900;
  color: #111827;
}

/* =========================
   Content
========================= */
.content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* ✅ 테이블만 스크롤 */
}

.state {
  padding: 18px;
  text-align: center;
  font-weight: 800;
  color: #6b7280;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  background: #fafafa;
}

.state.error {
  color: #b91c1c;
}

/* =========================
   Table (✅ 가로 스크롤 최소화)
========================= */
.table-wrap {
  flex: 1;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  overflow: auto; /* ✅ 세로 스크롤은 여기서 */
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  table-layout: fixed; /* ✅ 핵심: 가로 스크롤 대신 칼럼 고정 */
}

/* Header */
thead th {
  background: #f9fafb;
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid #eef2f7;
  font-weight: 900;
  color: #111827;
  white-space: nowrap;
}

/* Body */
tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #111827;

  white-space: nowrap;
  overflow: hidden;         /* ✅ 칼럼 넘치면 */
  text-overflow: ellipsis;  /* ✅ ... 처리 */
}


.row:hover {
  background: #f9fafb;
}

.clickable {
  cursor: pointer; /* ✅ 클릭 가능 표시 */
}

.name {
  font-weight: 900;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}

/* =========================
   Footer
========================= */
.foot {
  margin-top: 10px;
  font-size: 12px;
  font-weight: 800;
  color: #6b7280;
  text-align: right;
}

/* =========================
   Column Widths (✅ 비율 기반으로 조정)
========================= */
.w-code   { width: 16%; }
.w-name   { width: 18%; }
.w-person { width: 10%; }
.w-dept   { width: 18%; }
.w-call   { width: 14%; }
.w-dt     { width: 24%; }

/* =========================
   Responsive
========================= */
@media (max-width: 980px) {
  .modal {
    width: 100%;
    height: min(820px, 92vh);
  }

  .body {
    flex-direction: column;
    overflow: auto;
  }

  .tabs {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .tab {
    flex: 1 1 48%;
  }

  .content {
    overflow: visible;
  }
}
</style>