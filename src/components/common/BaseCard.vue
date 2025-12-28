<template>
  <section class="rb-card" :class="{ hoverable }">
    <header v-if="$slots.header" class="rb-card__head">
      <slot name="header" />
    </header>

    <div class="rb-card__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  hoverable: { type: Boolean, default: false },
});
</script>

<style scoped>
.rb-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  /* hover 애니메이션은 옵션에서만 활성화 */
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}

.rb-card__head {
  padding: 18px 20px 0;
  min-height: 52px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.rb-card__body {
  padding: 14px 20px 18px;
  flex: 1;
  min-height: 0;
}

/* ✅ 공통 카드 hover(필요한 카드만) */
.rb-card.hoverable:hover {
  transform: translateY(-2px);
  border-color: #d1d5db;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.08);
}
</style>
