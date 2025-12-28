<template>
  <div class="page-container">
    <!-- Header -->
    <div class="header">
      <h2>내 결재 내역</h2>
      <p class="subtitle">
        내가 처리해야 할 결재와 전체 결재 진행 현황
      </p>
    </div>

    <!-- KPI -->
    <div class="stats-grid">
      <!-- 내 대기 결재 -->
      <div class="stat-card danger">
        <div class="head">
          <el-icon><Clock /></el-icon>
          내 대기 결재
        </div>
        <div class="number">{{ status.my_pending }}</div>
        <div class="tail">처리 필요</div>
      </div>

      <!-- 진행 중 결재 -->
      <div class="stat-card warning wide">
        <div class="head">
          <el-icon><Loading /></el-icon>
          결재 진행 중
        </div>
        <div class="number">{{ status.in_progress }}</div>
        <div class="tail">승인 절차 진행 중</div>
      </div>

      <!-- 총 승인된 결재 -->
      <div class="stat-card success">
        <div class="head">
          <el-icon><CircleCheck /></el-icon>
          총 승인된 결재
        </div>
        <div class="number">{{ status.total_approved }}</div>
        <div class="tail">모든 승인 완료</div>
      </div>

      <!-- 총 반려된 결재 -->
      <div class="stat-card reject">
        <div class="head">
          <el-icon><CircleClose /></el-icon>
          총 반려된 결재
        </div>
        <div class="number">{{ status.total_rejected }}</div>
        <div class="tail">반려 처리됨</div>
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
.page-container { padding: 20px; max-width: 1400px; margin: 0 auto; }

.header {
  margin-bottom: 24px;
}

.header h2 {
  font-size: 22px;
  font-weight: 700;
}

.subtitle {
  margin-top: 4px;
  color: #6b7280;
  font-size: 14px;
}

/* ===== KPI Grid ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border-left: 6px solid transparent;
  transition: all 0.2s ease;
}

.stat-card.wide {
  grid-column: auto;
}

.stat-card .head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
}

.stat-card .number {
  font-size: 28px;
  font-weight: 800;
  margin: 10px 0;
}

.stat-card .tail {
  font-size: 13px;
  opacity: 0.85;
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
