<!-- components/StatusBadge.vue -->
<script setup>
defineProps({
  status: {
    type: String,
    required: true
  }
})
</script>

<template>
  <span
    class="status-badge"
    :class="status === 'P' ? 'pending' : 'complete'"
  >
    {{ status === 'P' ? '미해결' : '해결' }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  line-height: 1;
  user-select: none;
}

/* 미해결 */
.status-badge.pending {
  color: #ff4d4f;
  background-color: #fff1f0;
  border: 1px solid #ffccc7;
}

/* 해결 */
.status-badge.complete {
  color: #52c41a;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
}
</style>
