<template>
  <div class="analysis-summary" :class="toneClass">
    <span class="icon" aria-hidden="true">{{ icon }}</span>
    <span class="text">{{ text }}</span>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  text: { type: String, required: true },
  tone: { type: String, default: "neutral" }, // good | warn | danger | neutral
});

const toneClass = computed(() => `tone-${props.tone}`);

const icon = computed(() => {
  if (props.tone === "good") return "🟢";
  if (props.tone === "warn") return "🟡";
  if (props.tone === "danger") return "🔴";
  return "ℹ️";
});
</script>

<style scoped>
.analysis-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.4;
}

.icon {
  font-size: 14px;
}

.tone-neutral {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #374151;
}

.tone-good {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.tone-warn {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.tone-danger {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}
</style>
