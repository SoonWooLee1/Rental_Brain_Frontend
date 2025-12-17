<template>
  <div class="page-container">
    <div class="header">
      <h2>고객 문의 관리</h2>
      <p class="subtitle">접수된 1:1 문의 내역 및 처리 현황</p>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="head"><el-icon><QuestionFilled /></el-icon> 전체 문의</div>
        <div class="number">{{ totalCount }}건</div>
        <div class="tail blue">누적 접수</div>
      </div>
      <div class="stat-card">
        <div class="head purple"><el-icon><Clock /></el-icon> 처리 중</div>
        <div class="number">2건</div>
        <div class="tail purple">진행 중인 건</div>
      </div>
      <div class="stat-card">
        <div class="head green"><el-icon><Select /></el-icon> 해결율</div>
        <div class="number">95%</div>
        <div class="tail green">처리 완료 비율</div>
      </div>
      <div class="stat-card">
        <div class="head orange"><el-icon><User /></el-icon> 미배정</div>
        <div class="number">1건</div>
        <div class="tail orange">담당자 지정 필요</div>
      </div>
    </div>

    <div class="toolbar">
      <el-input 
        v-model="searchKeyword" 
        placeholder="기업명, 담당자, 제목으로 검색..." 
        prefix-icon="Search"
        class="search-bar"
        @keyup.enter="fetchData"
      />
      <div class="actions">
        <el-select v-model="filterStatus" placeholder="처리 상태" style="width: 140px">
          <el-option label="전체" value="" />
          <el-option label="처리중" value="P" />
          <el-option label="완료" value="C" />
        </el-select>
        <el-button icon="Filter" @click="fetchData">조회</el-button>
        <el-button type="primary" icon="Plus">문의 수기 등록</el-button>
      </div>
    </div>

    <el-card shadow="never" :body-style="{ padding: '0' }">
      <el-table :data="supports" style="width: 100%" v-loading="loading">
        <el-table-column prop="customerSupportCode" label="ID" width="130">
          <template #default="{row}">
            <span class="code-text">{{ row.customerSupportCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="기업명" width="180">
          <template #default="{row}">
            <div class="company-cell">
              <span class="icon">🏢</span> {{ row.customerName }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="담당자" width="140">
          <template #default="{row}">
            <span class="emp-cell">👤 {{ row.empName || '미배정' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="유형" width="120" />
        <el-table-column prop="title" label="제목" min-width="250" show-overflow-tooltip />
        <el-table-column label="상태" width="100">
          <template #default="{row}">
            <el-tag :type="getStatusType(row.status)" size="small" effect="light">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="접수일" width="160">
          <template #default="{row}">{{ formatDate(row.createDate) }}</template>
        </el-table-column>
        <el-table-column label="관리" width="120" align="center">
          <template #default="{row}">
            <el-button link type="primary" size="small">상세보기</el-button>
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
import { QuestionFilled, Clock, Select, User, Search, Filter, Plus } from '@element-plus/icons-vue'
import { getSupportList } from '@/api/customersupport'
import dayjs from 'dayjs'

const supports = ref([])
const totalCount = ref(0)
const loading = ref(false)
const searchKeyword = ref('')
const filterStatus = ref('')
const page = ref(1)
const pageSize = ref(10)

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: pageSize.value,
      title: searchKeyword.value,
      status: filterStatus.value || undefined
    }
    const res = await getSupportList(params)
    supports.value = res.data.contents
    totalCount.value = res.data.totalCount
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const getStatusLabel = (code) => code === 'P' ? '처리 중' : (code === 'C' ? '해결 완료' : code)
const getStatusType = (code) => code === 'P' ? 'warning' : (code === 'C' ? 'success' : 'info')
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
.head.purple { color: #9333ea; }
.head.green { color: #16a34a; }
.head.orange { color: #ea580c; }
.toolbar { display: flex; justify-content: space-between; margin-bottom: 16px; }
.search-bar { width: 350px; }
.actions { display: flex; gap: 8px; }
.code-text { font-family: monospace; color: #333; }
.company-cell { display: flex; align-items: center; gap: 6px; font-weight: 500; }
.emp-cell { color: #555; }
.pagination-area { display: flex; justify-content: flex-end; padding: 16px; }
</style>