<template>
  <teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal">
        <div class="modal-head">
          <div class="title">
            {{ detail?.segmentName ?? "세그먼트" }}
            <span class="sub">({{ fmt(customers.length) }}개사)</span>
          </div>
          <button class="close-btn" @click="emit('close')">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="state">불러오는 중...</div>
          <div v-else-if="error" class="state error">{{ error }}</div>

          <div v-else>
            <div v-if="detail?.segmentContent" class="desc">
              {{ detail.segmentContent }}
            </div>

            <div v-if="customers.length === 0" class="state">표시할 고객이 없습니다.</div>

            <div v-else class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>고객코드</th>
                    <th>고객명</th>
                    <th>담당자</th>
                    <th>부서/직급</th>
                    <th>연락처</th>
                    <th>만족도</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="c in customers"
                    :key="c.customerId ?? c.id ?? c.customerCode"
                    class="row"
                    role="button"
                    tabindex="0"
                    @click="goCustomerDetail(c.customerId)"
                    @keydown.enter="goCustomerDetail(c.customerId)"
                  >
                    <td class="mono">{{ c.customerCode ?? "-" }}</td>
                    <td class="name">{{ c.customerName ?? "-" }}</td>
                    <td>{{ c.inCharge ?? "-" }}</td>
                    <td>{{ c.dept ?? "-" }}</td>
                    <td class="mono">{{ c.callNum ?? "-" }}</td>
                    <td>
                      <span v-if="c.star != null">⭐ {{ c.star }}</span>
                      <span v-else>-</span>
                    </td>
                    <td>
                      <span :class="c.isDeleted === 'Y' ? 'bad' : 'good'">
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="hint">
              행을 클릭하면 고객 상세로 이동합니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getSegmentDetailWithCustomers } from "@/api/customeranalysis";

const router = useRouter();
const route = useRoute();

const props = defineProps({
  open: { type: Boolean, default: false },
  segmentId: { type: Number, required: true },
});

const emit = defineEmits(["close"]);

const loading = ref(false);
const error = ref("");
const detail = ref(null);

const customers = computed(() => {
  const arr = detail.value?.customers;
  return Array.isArray(arr) ? arr : [];
});

const fmt = (n) => (Number(n) || 0).toLocaleString();

const goCustomerDetail = (customerId) => {
  if (!customerId) return;
  emit("close");
  router.push({
    name: "customer-detail",
    params: { id: customerId },
    query: { from: route.fullPath, segmentId: props.segmentId },
  });
};

const load = async () => {
  if (!props.open) return;
  if (!props.segmentId) return;

  loading.value = true;
  error.value = "";
  try {
    const res = await getSegmentDetailWithCustomers(props.segmentId);
    detail.value = res?.data ?? null;
  } catch (e) {
    detail.value = null;
    error.value = e?.response?.data?.message ?? e?.message ?? "목록을 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
};

watch(
  () => [props.open, props.segmentId],
  () => {
    if (!props.open) return;
    load();
  },
  { immediate: true }
);
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  width: 1120px;
  max-width: calc(100vw - 28px);
  max-height: 82vh;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 14px;
  font-weight: 900;
  color: #111827;
}
.sub {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 800;
  color: #6b7280;
}

.close-btn {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  font-weight: 900;
  color: #111827;
}

.modal-body {
  padding: 16px 18px 18px;
  overflow: auto;
}

.desc {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  background: #f9fafb;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 12px;
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

.table-wrap {
  border: 1px solid #eef2f7;
  border-radius: 12px;
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

thead th {
  background: #f9fafb;
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid #eef2f7;
  color: #111827;
  font-weight: 900;
}

tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #111827;
}

.row {
  cursor: pointer;
}
.row:hover {
  background: #f9fafb;
}

.name {
  font-weight: 900;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.good {
  font-weight: 900;
  color: #047857;
}
.bad {
  font-weight: 900;
  color: #b91c1c;
}

.hint {
  margin-top: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
}
</style>
