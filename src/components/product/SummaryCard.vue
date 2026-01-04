<template>
  <div
    class="kpi-box"
    :class="[typeClass, { active }]"
    @click="handleClick"
  >
    <span class="kpi-title">{{ title }}</span>
    <span class="kpi-count" :class="countClass">
      {{ value ?? 0 }}건
    </span>
    <span class="kpi-sub">{{ sub }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  value: Number,
  sub: String,
  type: String,
  active: Boolean
})

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click', props.type)
}

/* 타입별 배경 */
const typeClass = computed(() => {
  switch (props.type) {
    case 'IMMINENT':
      return 'warning-box'
    case 'COMPLETED':
      return 'success-box'
    case 'IN_PROGRESS':
      return 'info-box'
    default:
      return ''
  }
})

/* 타입별 숫자 색상 */
const countClass = computed(() => {
  switch (props.type) {
    case 'IMMINENT':
      return 'warning'
    case 'COMPLETED':
      return 'success'
    case 'IN_PROGRESS':
      return 'info'
    default:
      return ''
  }
})
</script>

<style scoped>
/* 공통 카드 */
.kpi-box {
  background: #fff;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.kpi-box:hover {
  box-shadow: 0 4px 10px rgba(0,0,0,0.06);
  transform: translateY(-2px);
}

/* 텍스트 */
.kpi-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  display: block;
  font-weight: 500;
}

.kpi-count {
  font-size: 28px;
  font-weight: 800;
  color: #333;
}

.kpi-sub {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: #888;
}

/* 숫자 색상 */
.warning { color: #ef4444; }
.success { color: #22c55e; }
.info { color: #3b82f6; }

/* 배경 강조 */
.warning-box {
  background-color: #fef2f2;
  border-color: #fee2e2;
}

.success-box {
  background-color: #ecfdf5;
  border-color: #d1fae5;
}

.info-box {
  background-color: #eff6ff;
  border-color: #dbeafe;
}

/* 선택 상태 */
.kpi-box.active {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}
</style>
