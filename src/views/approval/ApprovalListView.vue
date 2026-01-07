<template>
  <div class="page-container">
    <!-- Header -->
    <div class="header">
      <h2>전자 결재</h2>
      <p class="subtitle">
        내가 처리해야 할 결재
      </p>
    </div>

    <!-- ===== KPI ===== -->
<div class="kpi-wrapper">

  <div class="kpi-box danger-box">
    <span class="kpi-title">내 대기 결재</span>
    <span class="kpi-count danger">
      {{ status.my_pending }}건
    </span>
  </div>

  <div class="kpi-box">
    <span class="kpi-title">결재 진행 중</span>
    <span class="kpi-count highlight">
      {{ status.in_progress }}건
    </span>
  </div>

  <div class="kpi-box">
    <span class="kpi-title">총 승인된 결재</span>
    <span class="kpi-count success">
      {{ status.total_approved }}건
    </span>
  </div>

  <div class="kpi-box reject-box">
    <span class="kpi-title">총 반려된 결재</span>
    <span class="kpi-count reject">
      {{ status.total_rejected }}건
    </span>
  </div>

</div>


    <!-- Tabs -->
    <el-card shadow="never" class="tabs-card">
      <el-tabs v-model="activeTab" class="approval-tabs">
        <el-tab-pane label="대기" name="pending">
          <ApprovalPending @changed="handleChanged" />
        </el-tab-pane>

        <el-tab-pane label="진행" name="progress">
          <ApprovalProgress ref="progressRef" />
        </el-tab-pane>

        <el-tab-pane label="완료" name="completed">
          <ApprovalCompleted ref="completedRef"/>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getApprovalStatus } from '@/api/approval'

import ApprovalPending from './ApprovalPending.vue'
import ApprovalProgress from './ApprovalProgress.vue'
import ApprovalCompleted from './ApprovalCompleted.vue'

import {
  Clock,
  Loading,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'

const progressRef = ref(null)
const completedRef = ref(null)

/**
 * 활성 탭
 */
const activeTab = ref('pending')

/**
 * KPI 상태
 */
const status = ref({
  my_pending: 0,
  total_approved: 0,
  total_rejected: 0,
  in_progress: 0
})

/**
 * KPI 조회
 */
const fetchStatus = async () => {
  try {
    const res = await getApprovalStatus()
    status.value = res.data
  } catch (e) {
    console.error('결재 KPI 조회 실패', e)
  }
}

const handleChanged = async () => {
  await fetchStatus() // KPI 갱신

  // 다른 탭 목록 갱신
  progressRef.value?.fetchList()
  completedRef.value?.fetchList()
}

onMounted(fetchStatus)
</script>

<style scoped>
/* ===== Layout ===== */
.page-container {
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;

  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.subtitle {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
}

/* ===== KPI (Contract Style) ===== */
.kpi-wrapper {
  display: flex;
  gap: 15px;
  margin-bottom: 24px;
}

.kpi-box {
  flex: 1;
  background: #fff;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 8px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.kpi-title {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 18px;
}

.kpi-count {
  margin-top: auto;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.2;
}

/* ===== Color Variants ===== */
.highlight { color: #f59e0b; } /* 진행 */
.success { color: #16a34a; }   /* 승인 */
.reject  { color: #dc2626; }   /* 반려 */



.reject-box {
  background-color: #fef2f2;
  border-color: #fee2e2;
}


/* ===== Colors ===== */
.stat-card.danger {
  border-left-color: #9333ea;
  color: #9333ea;
}

.stat-card.success {
  border-left-color: #16a34a;
  color: #16a34a;
}

.stat-card.reject {
  border-left-color: #dc2626;
  color: #dc2626;
}

.stat-card.warning {
  border-left-color: #ea580c;
  color: #ea580c;
}

/* ===== Tabs ===== */
.tabs-card {
  border-radius: 12px;
}
</style>
