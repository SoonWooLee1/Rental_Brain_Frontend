<template>
  <div class="mini-card">
    <div class="mini-title" :class="toneClass">{{ title }}</div>

    <div v-if="!items || items.length === 0" class="empty">데이터가 없습니다.</div>

    <div v-else>
      <div v-for="it in items" :key="it.rank" class="row">
        <div class="row-top">
          <span class="label">{{ it.rank }}. {{ it.label }}</span>
          <span class="count">{{ it.count }}</span>
        </div>

        <div class="bar-wrap">
          <div class="bar" :class="toneClass" :style="{ width: width(it.count) }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  items: { type: Array, default: () => [] },
  tone: { type: String, default: "info" }, // success|danger|info|warning
});

const toneClass = computed(() => `t-${props.tone}`);
const maxCount = computed(() => Math.max(...props.items.map((x) => Number(x.count || 0)), 1));
const width = (c) => `${(Number(c || 0) / maxCount.value) * 100}%`;
</script>

<style scoped>
/* 바깥 카드도 기존 카드 느낌(흰/얇은 보더/8px) */
.mini-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}

.mini-title {
  font-size: 12px;
  font-weight: 900;
  margin-bottom: 12px;
  color: #111827;
}

.row {
  margin-bottom: 10px;
}
.row-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
}
.label {
  color: #374151;
  font-weight: 800;
}
.count {
  color: #111827;
  font-weight: 900;
}

.bar-wrap {
  height: 7px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 6px;
}

.bar {
  height: 100%;
  border-radius: 999px;
}

.empty {
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
}

/* tone */
.t-success { color: #16a34a; }
.t-danger  { color: #ef4444; }
.t-info    { color: #2563eb; }
.t-warning { color: #d97706; }

/* bar 색은 tone 색과 동일 */
.bar.t-success { background: #16a34a; }
.bar.t-danger  { background: #ef4444; }
.bar.t-info    { background: #2563eb; }
.bar.t-warning { background: #d97706; }
</style>