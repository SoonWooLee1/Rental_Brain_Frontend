<template>
  <BaseCard class="sat-card">
    <template #header>
      <div class="head">
        <h3 class="title">{{ title }}</h3>
      </div>
    </template>

    <div v-if="loading" class="empty">불러오는 중...</div>
    <div v-else-if="error" class="empty error">{{ error }}</div>

    <div v-else class="body">
      <div v-if="!hasData" class="empty">표시할 데이터가 없습니다.</div>

      <div v-else class="rows">
        <button
          v-for="r in rows"
          :key="r.star"
          class="row"
          type="button"
          @click="emitOpen(r.star)"
        >
          <div class="left">
            <span class="star">⭐</span>
            <span class="label">{{ r.star }}점</span>
          </div>

          <div class="bar">
            <div class="fill" :style="{ width: barWidth(r.count) }"></div>
          </div>

          <div class="right">{{ fmt(r.count) }}개사</div>
        </button>
      </div>
    </div>
  </BaseCard>
</template>

<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";

const props = defineProps({
  title: { type: String, default: "고객 만족도 분포" },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },

  // ✅ null 들어와도 OK (터지면 안 됨)
  satisfaction: { type: [Object, null], default: null },

  // (선택) TOP3
  topIssues: { type: Array, default: () => [] },
});

const emit = defineEmits(["open"]);

const fmt = (n) => (Number(n) || 0).toLocaleString();

const s = computed(() => props.satisfaction ?? {});

const getCount = (star) => {
  // ✅ 다양한 필드명 대응 (프로젝트에서 섞여서 들어오던 패턴 방어)
  const map = {
    5: ["star5Count", "star5", "five", "count5"],
    4: ["star4Count", "star4", "four", "count4"],
    3: ["star3Count", "star3", "three", "count3"],
    2: ["star2Count", "star2", "two", "count2"],
    1: ["star1Count", "star1", "one", "count1"],
  };

  const keys = map[star] ?? [];
  for (const k of keys) {
    const v = s.value?.[k];
    if (v != null) return Number(v) || 0;
  }
  return 0;
};

const rows = computed(() => [
  { star: 5, count: getCount(5) },
  { star: 4, count: getCount(4) },
  { star: 3, count: getCount(3) },
  { star: 2, count: getCount(2) },
  { star: 1, count: getCount(1) },
]);

const maxCount = computed(() => Math.max(1, ...rows.value.map((r) => r.count)));

const hasData = computed(() => rows.value.some((r) => r.count > 0));

const barWidth = (count) => `${Math.round((Number(count) || 0) / maxCount.value * 100)}%`;

const emitOpen = (star) => emit("open", star);

const topIssuesSafe = computed(() => (Array.isArray(props.topIssues) ? props.topIssues : []));
</script>

<style scoped>
.sat-card {
  width: 100%;
}

.head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  margin: 0;
  font-size: 14px;
  font-weight: 900;
  color: #111827;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ✅ row 전체를 버튼으로: 클릭/호버 자연스럽게 */
.row {
  width: 100%;
  border: 1px solid #eef2f7;
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  display: grid;
  grid-template-columns: 92px 1fr 70px;
  gap: 10px;
  align-items: center;
  cursor: pointer;
  transition: border-color .12s ease, box-shadow .12s ease, transform .12s ease;
}
.row:hover {
  border-color: #dbe2ea;
  box-shadow: 0 10px 18px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}
.row:active { transform: translateY(0); }

.left {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 900;
  color: #111827;
  font-size: 12px;
}
.star { font-size: 12px; }
.label { white-space: nowrap; }

.bar {
  height: 6px;
  border-radius: 999px;
  background: #f3f4f6;
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 999px;
  background: #2563eb; /* ✅ 파란색 */
}

.right {
  text-align: right;
  font-size: 12px;
  font-weight: 900;
  color: #111827;
  white-space: nowrap;
}

.issues {
  border-top: 1px solid #eef2f7;
  padding-top: 12px;
}
.issues-title {
  font-size: 12px;
  font-weight: 900;
  color: #111827;
  margin-bottom: 10px;
}
.issues-list {
  margin: 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.issues-list li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  font-weight: 800;
  color: #374151;
}
.issues-list .t { color: #111827; font-weight: 900; }
.issues-list .c { color: #111827; font-weight: 900; }

.empty {
  height: 220px;
  border: 1px dashed #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 700;
}
.empty.error {
  color: #ef4444;
  background: #fff1f2;
  border-color: #fecdd3;
}
</style>
