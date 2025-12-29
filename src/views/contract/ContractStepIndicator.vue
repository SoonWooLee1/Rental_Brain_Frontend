<template>
  <div class="step-indicator">
    <div
      v-for="step in steps"
      :key="step.no"
      class="step-item"
      :class="{
        active: currentStep === step.no,
        done: currentStep > step.no,
        clickable: currentStep > step.no
      }"
      @click="onClick(step.no)"
    >
      <div class="circle">{{ step.no }}</div>
      <div class="label">{{ step.label }}</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  currentStep: Number
})

const emit = defineEmits(['move'])

const steps = [
  { no: 1, label: '고객 선택' },
  { no: 2, label: '계약 / 상품' },
  { no: 3, label: '결제 정보' },
  { no: 4, label: '결재선' },
  { no: 5, label: '검토 / 요청' }
]

const onClick = (stepNo) => {
  if (props.currentStep > stepNo) {
    emit('move', stepNo)
  }
}
</script>

<style scoped>
.step-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 32px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  cursor: default;
  position: relative;
}

.step-item::after {
  content: '';
  position: absolute;
  top: 16px;
  right: -50%;
  width: 100%;
  height: 2px;
  background: #e5e7eb;
  z-index: -1;
}

.step-item:last-child::after {
  display: none;
}

.circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.label {
  margin-top: 8px;
  font-size: 13px;
  color: #6b7280;
}

/* 완료 */
.step-item.done .circle {
  background: #2563eb;
  color: white;
}

/* 현재 */
.step-item.active .circle {
  background: #111827;
  color: white;
}

.step-item.active .label {
  font-weight: bold;
  color: #111827;
}

/* 클릭 가능 */
.step-item.clickable {
  cursor: pointer;
}
</style>
