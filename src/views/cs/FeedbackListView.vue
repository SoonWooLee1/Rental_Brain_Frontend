<template>
  <div class="page-container">
    <div class="header">
      <h2>피드백 관리</h2>
      <p class="subtitle">고객 만족도 및 서비스 의견 수렴</p>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="head"><el-icon><ChatLineSquare /></el-icon> 전체 피드백</div>
        <div class="number">{{ totalCount }}건</div>
        <div class="tail blue">누적 접수</div>
      </div>
      <div class="stat-card">
        <div class="head orange"><el-icon><Star /></el-icon> 평균 평점</div>
        <div class="number">4.2점</div>
        <div class="tail orange">전월 대비 +0.2</div>
      </div>
      <div class="stat-card">
        <div class="head green"><el-icon><Sunny /></el-icon> 긍정 평가</div>
        <div class="number">78%</div>
        <div class="tail green">4점 이상 비율</div>
      </div>
      <div class="stat-card">
        <div class="head red"><el-icon><Warning /></el-icon> 불만 접수</div>
        <div class="number">5건</div>
        <div class="tail red">1~2점 (즉시 대응)</div>
      </div>
    </div>

    <div class="toolbar">
      <el-input 
        v-model="searchKeyword" 
        placeholder="내용, 제목으로 검색..." 
        prefix-icon="Search"
        class="search-bar"
        @keyup.enter="fetchData"
      />
      <div class="actions">
        <el-select v-model="filterStar" placeholder="평점 필터" style="width: 140px">
          <el-option label="전체" :value="null" />
          <el-option label="5점 (매우만족)" :value="5" />
          <el-option label="1점 (매우불만)" :value="1" />
        </el-select>
        <el-button icon="Filter" @click="fetchData">조회</el-button>
      </div>
    </div>

    <el-card shadow="never" :body-style="{ padding: '0' }">
      <el-table :data="feedbacks" style="width: 100%" v-loading="loading">
        <el-table-column prop="feedbackCode" label="ID" width="130">
          <template #default="{row}">
            <span class="code-text">{{ row.feedbackCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="기업명" width="180">
          <template #default="{row}">
            <div class="company-cell">
              <span class="icon">🏢</span> {{ row.customerName }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="카테고리" width="120" />
        <el-table-column prop="title" label="제목" min-width="200" show-overflow-tooltip />
        <el-table-column label="평점" width="160">
          <template #default="{row}">
            <el-rate v-model="row.star" disabled text-color="#ff9900" />
          </template>
        </el-table-column>
        <el-table-column label="등록일" width="160">
          <template #default="{row}">{{ formatDate(row.createDate) }}</template>
        </el-table-column>
        <el-table-column label="조치 사항" width="200">
          <template #default="{row}">
            <span class="action-text">{{ row.action || '검토 중' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="관리" width="100" align="center">
          <template #default="{row}">
            <el-button link type="success" size="small">상세보기</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-area">
        <el-pagination 
          layout="prev, pager, next" 
          :total="totalCount" 
          v-model:current-page="page"
          :page-size="pageSize"
          @current-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ChatLineSquare, Star, Sunny, Warning, Search, Filter } from '@element-plus/icons-vue'
import { getFeedbackList } from '@/api/feedback'
import dayjs from 'dayjs'

const feedbacks = ref([])
const totalCount = ref(0)
const loading = ref(false)
const searchKeyword = ref('')
const filterStar = ref(null)
const page = ref(1)
const pageSize = ref(10)

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: pageSize.value,
      title: searchKeyword.value,
      star: filterStar.value || undefined
    }
    const res = await getFeedbackList(params)
    feedbacks.value = res.data.contents
    totalCount.value = res.data.totalCount
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'

onMounted(() => fetchData())
</script>

<style scoped>
.page-container { max-width: 1600px; margin: 0 auto; }
.header h2 { margin: 0 0 4px 0; font-size: 22px; }
.header .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { background: white; border: 1px solid #eee; border-radius: 8px; padding: 20px; }
.stat-card .head { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 14px; color: #555; }
.stat-card .number { font-size: 24px; font-weight: 700; margin: 8px 0; color: #333; }
.stat-card .tail { font-size: 12px; color: #888; }
.head.orange { color: #f59e0b; }
.head.green { color: #10b981; }
.head.red { color: #ef4444; }
.toolbar { display: flex; justify-content: space-between; margin-bottom: 16px; }
.search-bar { width: 350px; }
.actions { display: flex; gap: 8px; }
.code-text { font-family: monospace; color: #333; }
.company-cell { display: flex; align-items: center; gap: 6px; font-weight: 500; }
.action-text { color: #666; font-size: 13px; }
.pagination-area { display: flex; justify-content: flex-end; padding: 16px; }
</style>