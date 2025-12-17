<template>
  <div class="toast-wrapper">
    <transition name="fade-up">
      <div v-if="toastStore.show" class="toast" @mouseenter="toastStore.pauseToast" @mouseleave="toastStore.resumeToast">
        {{ toastStore.message }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { useToastStore } from '@/store/useToast';

const toastStore = useToastStore();

</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(60, 50, 40, 0.9);
  color: #fff;
  padding: 12px 24px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  font-size: 0.95rem;
}

/* 부드러운 페이드 효과 */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.4s ease;
}
.fade-up-enter-from {
  opacity: 0;
  transform: translate(-50%, 60px); /* 아래에서 시작 */
}

.fade-up-enter-to {
  opacity: 1;
  transform: translate(-50%, 0); /* 제자리로 올라옴 */
}

.fade-up-leave-from {
  opacity: 1;
  transform: translate(-50%, 0);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 60px); /* 다시 아래로 내려가며 사라짐 */
}
</style>
