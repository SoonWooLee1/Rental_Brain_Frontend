<template>
  <div class="page">
    <!-- 헤더 -->
    <div class="header">
      <div>
        <h2>설문조사 목록</h2>
        <p>진행 중이거나 종료된 설문조사를 확인할 수 있습니다</p>
      </div>

      <el-button type="primary" @click.stop="goCreate">
        설문조사 생성
      </el-button>
    </div>

    <!-- 테이블 -->
    <el-card shadow="never">
      <el-table :data="surveys" v-loading="loading" @row-click="openAiResult">

        <!-- 설문 코드 -->
        <el-table-column prop="surveyCode" label="설문 코드" width="140" />

        <!-- 설문명 -->
        <el-table-column prop="name" label="설문명" min-width="220" />

        <!-- 카테고리 -->
        <el-table-column label="카테고리" width="140">
          <template #default="{ row }">
            <el-tag type="info">
              {{ row.surveyCategoryDTO.name }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 기간 -->
        <el-table-column label="설문 기간" width="260">
          <template #default="{ row }">
            <div class="date">
              {{ formatDate(row.startDate) }}
              <span>~</span>
              {{ formatDate(row.endDate) }}
            </div>
          </template>
        </el-table-column>

        <!-- 상태 -->
        <el-table-column label="상태" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 링크 -->
        <!-- <el-table-column label="설문 링크" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openLink(row.link)">
              이동
            </el-button>
          </template>
        </el-table-column> -->

      </el-table>
    </el-card>
    <!-- AI 결과 다이얼로그 -->
    <SurveyAiResult
  v-model="aiDialogVisible"
  :survey-id="selectedSurveyId"
/>
  </div>

</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import SurveyAiResult from './SurveyAiResultView.vue'

const selectedSurveyId = ref(null);
const aiDialogVisible = ref(false);

const router = useRouter()
const surveys = ref([])
const loading = ref(false)

onMounted(() => {
  fetchSurveys()
})

const fetchSurveys = async () => {
  loading.value = true
  try {
    const res = await api.get('/survey/list');
    surveys.value = res.data
  } catch (e) {
    console.error('설문 목록 조회 실패', e)
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  return date.slice(0, 10)
}

const statusText = (status) => {
  switch (status) {
    case 'OPEN':
      return '진행중'
    case 'READY':
      return '예정'
    case 'CLOSED':
      return '종료'
    default:
      return status
  }
}

const statusTag = (status) => {
  switch (status) {
    case 'OPEN':
      return 'success'
    case 'READY':
      return 'warning'
    case 'CLOSED':
      return 'info'
    default:
      return ''
  }
}

const openAiResult = (row) => {
  selectedSurveyId.value = row.id
  aiDialogVisible.value = true
}


const openLink = (url) => {
  window.open(url, '_blank')
}

const goCreate = () => {
  router.push('/cs/survey/create')
}
</script>

<style scoped>
.page {
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header p {
  color: #6b7280;
  margin-top: 4px;
}

.date {
  font-size: 13px;
  color: #374151;
}
</style>
