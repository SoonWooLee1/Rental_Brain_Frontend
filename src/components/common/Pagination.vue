<template>
    <div class="pagination-wrapper">
    <!-- 범위 정보 -->
    <div class="range-info">
      {{ totalCount }}건 중 {{ startItem }}-{{ endItem }}건 표시
    </div>

    <!-- 페이지 버튼 -->
    <div class="pagination">
      <!-- 이전 그룹 -->
      <button
        class="page-btn"
        :disabled="currentGroup === 0"
        @click="prevGroup"
      >
        &lt;
      </button>
  
      <!-- 페이지 번호 -->
      <button
        v-for="p in visiblePages"
        :key="p"
        class="page-btn"
        :class="{ active: p === page }"
        @click="changePage(p)"
      >
        {{ p }}
      </button>
  
      <!-- 다음 그룹 -->
      <button
        class="page-btn"
        :disabled="nextGroupPage > totalPages"
        @click="nextGroup"
      >
        &gt;
      </button>
    </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  
  const props = defineProps({
    page: {
      type: Number,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    totalCount: {
      type: Number,
      required: true,
    },
    pageGroupSize: {
      type: Number,
      default: 5,
    },
  });
  
  const emit = defineEmits(['update:page']);
  
  /* 전체 페이지 수 */
  const totalPages = computed(() =>
    Math.ceil(props.totalCount / props.size)
  );
  
  /* 현재 그룹 */
  const currentGroup = computed(() =>
    Math.floor((props.page - 1) / props.pageGroupSize)
  );
  
  /* 보여줄 페이지 */
  const visiblePages = computed(() => {
    const start = currentGroup.value * props.pageGroupSize + 1;
    const end = Math.min(
      start + props.pageGroupSize - 1,
      totalPages.value
    );
  
    return Array.from(
      { length: end - start + 1 },
      (_, i) => start + i
    );
  });
  
  /* 페이지 이동 */
  function changePage(p) {
    emit('update:page', p);
  }
  
  /* 이전 그룹 */
  const prevGroupPage = computed(() => {
    const prevGroupStart =
    (currentGroup.value - 1) * props.pageGroupSize + 1;
    return prevGroupStart > 0 ? prevGroupStart : 1;
  })

  const nextGroupPage = computed(() => {
    return (currentGroup.value + 1) * props.pageGroupSize + 1;
  })

  function prevGroup() {
  if (currentGroup.value > 0) {
    emit('update:page', prevGroupPage.value);
  }
}

function nextGroup() {
  if (nextGroupPage.value <= totalPages.value) {
    emit('update:page', nextGroupPage.value);
  }
}

  const startItem = computed(() => {
  if (props.totalCount === 0) return 0;
  return (props.page - 1) * props.size + 1;
    });

const endItem = computed(() => {
  return Math.min(
    props.page * props.size,
    props.totalCount
  );
    });

</script>
  
<style scoped>
  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: center;
    gap: 6px;
  }
  
  .page-btn {
    border: 1px solid #e0e4f0;
    background: #fff;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
  }
  
  .page-btn.active {
    background: #248efff2;
    color: #fff;
  }
  
  .page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
    }

.range-info {
  font-size: 15px;
  padding-left: 15px;
  color: #666;
}
</style>
  