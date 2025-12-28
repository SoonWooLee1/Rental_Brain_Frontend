<template>
  <div class="insight-grid">
    <BaseCard
      v-for="(sec, sIdx) in sections"
      :key="sIdx"
      class="insight-card"
    >
      <template #header>
        <div class="head">
          <div class="title">{{ sec.title ?? mainTitle }}</div>
        </div>
      </template>

      <div class="body">
        <div v-for="(blk, bIdx) in (sec.blocks ?? [])" :key="bIdx" class="block">
          <div v-if="blk.subtitle" class="blk-sub">
            <span class="icon" :class="toneClass(blk.tone)">
              {{ iconByTone(blk.tone) }}
            </span>
            <span class="txt">{{ blk.subtitle }}</span>
          </div>

          <div class="list">
            <div
              v-for="item in (blk.items ?? [])"
              :key="`${sIdx}-${bIdx}-${item.rank}-${item.label}`"
              class="row"
            >
              <div class="left">
                <span class="rank" :class="toneClass(blk.tone)">{{ item.rank }}</span>
                <span class="label">{{ item.label }}</span>
              </div>

              <div class="right">
                <span class="count" :class="toneClass(blk.tone)">{{ fmt(item.count) }}건</span>
              </div>

              <div class="bar-wrap">
                <div class="bar-bg"></div>
                <div
                  class="bar"
                  :class="toneClass(blk.tone)"
                  :style="{ width: barWidth(blk.items, item.count) }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import { computed } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";

const props = defineProps({
  sections: { type: Array, default: () => [] },
});

const mainTitle = computed(() => props.sections?.[0]?.title ?? "인사이트 TOP 리스트");

const fmt = (n) => (Number(n) || 0).toLocaleString();

const toneClass = (tone) => {
  if (tone === "good") return "tone-good";
  if (tone === "bad") return "tone-bad";
  return "tone-neutral";
};

const iconByTone = (tone) => {
  if (tone === "good") return "🌱";
  if (tone === "bad") return "🚨";
  return "•";
};

const barWidth = (items, count) => {
  const arr = Array.isArray(items) ? items : [];
  const max = Math.max(...arr.map((x) => Number(x?.count ?? 0)), 0);
  if (!max) return "0%";
  const pct = Math.max(0, Math.min(100, (Number(count) / max) * 100));
  return `${pct.toFixed(0)}%`;
};
</script>

<style scoped>
.insight-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 18px;
  align-items: start;
}

@media (max-width: 1200px) {
  .insight-grid {
    grid-template-columns: 1fr;
  }
}

.insight-card {
  width: 100%;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 14px;
  font-weight: 900;
  color: #111827;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 블록(성공요인/실패요인 등) */
.block + .block {
  margin-top: 8px;
}

.blk-sub {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 10px;
  font-weight: 900;
  font-size: 12px;
  color: #111827;
}

.icon {
  display: inline-flex;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.row {
  position: relative;
  padding-bottom: 10px;
}

.left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rank {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111827;
}

.label {
  font-size: 12px;
  font-weight: 900;
  color: #111827;
}

.right {
  position: absolute;
  right: 0;
  top: 0;
}

.count {
  font-size: 12px;
  font-weight: 900;
}

.bar-wrap {
  margin-top: 8px;
  position: relative;
  height: 7px;
  border-radius: 999px;
  overflow: hidden;
}

.bar-bg {
  position: absolute;
  inset: 0;
  background: #f3f4f6;
}

.bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 999px;
}

/* tone */
.tone-good { color: #16a34a; }
.tone-bad  { color: #ef4444; }
.tone-neutral { color: #111827; }

.bar.tone-good { background: #22c55e; }
.bar.tone-bad { background: #ef4444; }
.bar.tone-neutral { background: #111827; }
</style>
