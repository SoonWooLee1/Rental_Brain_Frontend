<template>
  <div class="layout">
    <!-- 사이드바 -->
    <Sidebar
      v-if="!isSidebarHidden"
      @close="hideSidebar"
    />

    <!-- 메인 영역 -->
    <div class="main" :class="{ full: isSidebarHidden }">
      <!-- 집중 모드일 때 사이드바 다시 열기 버튼 -->
      <el-button
        v-if="isFocusPage && isSidebarHidden"
        class="sidebar-open-btn"
        circle
        @click="showSidebar"
      >
        <el-icon><Expand /></el-icon>
      </el-button>

      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import Sidebar from "@/components/Sidebar.vue";
import { Expand } from "@element-plus/icons-vue";

/**
 * 🔥 집중 모드 대상 페이지
 * - 대시보드
 * - 분석/시각화 페이지
 */
const FOCUS_ROUTES = [
  "/",
  "/analysis"
];

const route = useRoute();
const isSidebarHidden = ref(false);

const isFocusPage = computed(() =>
  FOCUS_ROUTES.some(path => route.path.startsWith(path))
);

// 페이지 이동 시 자동 판단
watch(
  () => route.path,
  () => {
    if (isFocusPage.value) {
      isSidebarHidden.value = true;
    } else {
      isSidebarHidden.value = false;
    }
  },
  { immediate: true }
);

const hideSidebar = () => {
  isSidebarHidden.value = true;
};

const showSidebar = () => {
  isSidebarHidden.value = false;
};
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}

/* 메인 영역 */
.main {
  flex: 1;
  position: relative;
  overflow: auto;
  padding: 24px;
}

/* 사이드바 없을 때 */
.main.full {
  padding-left: 24px;
}

/* 사이드바 다시 열기 버튼 */
.sidebar-open-btn {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1000;
}
</style>
