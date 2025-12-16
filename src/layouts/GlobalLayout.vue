<template>
  <div class="layout">
    <Sidebar />

    <div class="page-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import Sidebar from "@/components/Sidebar.vue";
</script>

<style scoped>
.layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 메인 페이지가 전체를 꽉 채우도록 */
.page-content {
  flex: 1;              /* 화면 남은 공간 전부 차지 */
  background: #f7f9fc;
  overflow-y: auto;
  padding: 24px;
  
}
</style>