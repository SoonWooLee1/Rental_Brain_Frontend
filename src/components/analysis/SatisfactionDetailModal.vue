<template>
  <teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal">
        <div class="modal-head">
          <div class="title">
            만족도 {{ star }}점 고객 목록
            <span class="sub">({{ fmt(totalCount) }}명)</span>
          </div>
          <button class="close-btn" @click="emit('close')">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="state">불러오는 중...</div>
          <div v-else-if="error" class="state error">{{ error }}</div>

          <div v-else>
            <div v-if="items.length === 0" class="state">표시할 데이터가 없습니다.</div>

            <div v-else class="grid">
              <div
                v-for="c in items"
                :key="c.customerId ?? c.id ?? c.customerCode"
                class="item-card"
                role="button"
                tabindex="0"
                @click="goCustomerDetail(c.customerId)"
                @keydown.enter="goCustomerDetail(c.customerId)"
              >
                <div class="top">
                  <div class="name">{{ c.customerName ?? c.name ?? "고객" }}</div>

                  <div class="star-badge">
                    <span class="star">⭐</span>
                    <span class="num">{{ c.star ?? star }}</span>
                  </div>
                </div>

                <!-- ✅ 세그먼트 색상 적용 -->
               <div v-if="c.segmentName" class="seg-badge" :class="segClass(c.segmentName)">
                {{ c.segmentName }}
              </div>

                <div class="kv">
                  <div class="row">
                    <div class="k">고객코드</div>
                    <div class="v mono">{{ c.customerCode ?? c.code ?? "-" }}</div>
                  </div>

                  <div v-if="c.createDate" class="row">
                    <div class="k">최근 등록</div>
                    <div class="v">{{ formatDateTime(c.createDate) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="pager">
              <button class="pbtn" :disabled="currentPage <= 1" @click="go(currentPage - 1)">
                이전
              </button>

              <div class="pinfo">{{ currentPage }} / {{ endPage }}</div>

              <button class="pbtn" :disabled="currentPage >= endPage" @click="go(currentPage + 1)">
                다음
              </button>

              <select class="psize" v-model.number="size" @change="go(1)">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="30">30</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { useRouter, useRoute } from "vue-router";
import { ref, watch } from "vue";
import { getSatisfactionCustomersByStar } from "@/api/customeranalysis";

const router = useRouter();
const route = useRoute();

const props = defineProps({
  open: { type: Boolean, default: false },
  star: { type: Number, required: true },
});

const emit = defineEmits(["close"]);

const goCustomerDetail = (customerId) => {
  if (!customerId) return;
  emit("close");
  router.push({
    name: "customer-detail",
    params: { id: customerId },
    query: { from: route.fullPath, star: props.star },
  });
};

const loading = ref(false);
const error = ref("");

const items = ref([]);
const totalCount = ref(0);

const currentPage = ref(1);
const endPage = ref(1);
const size = ref(10);

const fmt = (n) => (Number(n) || 0).toLocaleString();

const formatDateTime = (iso) => {
  if (!iso) return "-";
  const s = String(iso);
  return s.replace("T", " ").slice(0, 16);
};

// ✅ 세그먼트명 → 톤 클래스
const segClass = (name) => {
  const n = String(name || "");
  if (n.includes("VIP")) return "seg-vip";
  if (n.includes("블랙")) return "seg-black";
  if (n.includes("이탈 위험")) return "seg-risk";
  if (n.includes("확장")) return "seg-growth";
  if (n.includes("신규")) return "seg-new";
  if (n.includes("잠재")) return "seg-potential";
  return "seg-normal";
};

const load = async () => {
  if (!props.open) return;

  loading.value = true;
  error.value = "";
  try {
    const res = await getSatisfactionCustomersByStar(props.star, currentPage.value, size.value);
    const d = res?.data ?? {};

    items.value = Array.isArray(d.contents) ? d.contents : [];
    totalCount.value = Number(d.totalCount ?? 0) || 0;

    const p = d.paging ?? {};
    currentPage.value = Number(p.currentPage ?? currentPage.value) || 1;
    endPage.value = Number(p.endPage ?? 1) || 1;
  } catch (e) {
    error.value = e?.response?.data?.message ?? e?.message ?? "목록을 불러오지 못했습니다.";
    items.value = [];
    totalCount.value = 0;
    currentPage.value = 1;
    endPage.value = 1;
  } finally {
    loading.value = false;
  }
};

const go = (page) => {
  currentPage.value = Math.max(1, page);
  load();
};

watch(
  () => [props.open, props.star],
  () => {
    if (!props.open) return;
    currentPage.value = 1;
    load();
  },
  { immediate: true }
);
</script>

<style scoped>
/* (기존 스타일 유지) */
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
  width: 1040px;
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
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  color: #6b7280;
}
.close-btn:hover { color: #111827; }

.modal-body {
  padding: 14px 18px 16px;
  overflow: auto;
}

.state {
  height: 220px;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 800;
}
.state.error {
  color: #ef4444;
  background: #fff1f2;
  border-color: #fecdd3;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
}

.item-card {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 14px;
  padding: 12px 12px 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
}
.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.08);
  border-color: #d1d5db;
}
.item-card:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.18);
  border-color: rgba(59,130,246,0.35);
}

.top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}
.name {
  font-weight: 900;
  color: #111827;
  font-size: 13px;
  line-height: 1.25;
}

.star-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 900;
  color: #111827;
  white-space: nowrap;
}

.seg-badge {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
  border: 1px solid transparent;
}

/* ✅ 세그먼트 색 토큰 */
/* ✅ 세그먼트 색 */
.seg-vip      { background:#fff7ed; border-color:#fed7aa; color:#9a3412; }
.seg-black    { background:#f3f4f6; border-color:#d1d5db; color:#111827; }
.seg-risk     { background:#fff1f2; border-color:#fecdd3; color:#9f1239; }
.seg-growth   { background:#f5f3ff; border-color:#ddd6fe; color:#5b21b6; }
.seg-new      { background:#ecfeff; border-color:#a5f3fc; color:#155e75; }
.seg-potential{ background:#eff6ff; border-color:#bfdbfe; color:#1d4ed8; }
.seg-normal   { background:#f0fdf4; border-color:#bbf7d0; color:#166534; }

.kv {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  line-height: 1.3;
}
.k {
  color: #6b7280;
  font-weight: 800;
  min-width: 56px;
}
.v {
  color: #111827;
  font-weight: 900;
  text-align: right;
  flex: 1;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.pager {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}
.pbtn {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111827;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.pbtn:disabled { opacity: 0.5; cursor: not-allowed; }

.pinfo {
  font-size: 12px;
  font-weight: 900;
  color: #111827;
  min-width: 72px;
  text-align: center;
}

.psize {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 800;
}
</style>
