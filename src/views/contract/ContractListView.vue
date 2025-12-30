<template>
  <div class="page-container">
    <!-- Header -->
    <div class="header">
      <h2 class="page-title">계약 목록</h2>
      <p class="page-subtitle">계약 현황 및 진행 상태 관리</p>
    </div>

    <!-- KPI -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="head"><el-icon><Document /></el-icon> 전체 계약</div>
        <div class="number">{{ kpi.totalContracts }}건</div>
        <div class="tail blue">누적 계약</div>
      </div>

      <div class="stat-card">
        <div class="head purple"><el-icon><Clock /></el-icon> 계약 진행</div>
        <div class="number">{{ kpi.progressContracts }}건</div>
        <div class="tail purple">진행 중</div>
      </div>

      <div class="stat-card">
        <div class="head orange"><el-icon><Warning /></el-icon> 만료 임박</div>
        <div class="number">{{ kpi.imminentExpireContracts }}건</div>
        <div class="tail orange">주의 필요</div>
      </div>

      <div class="stat-card">
        <div class="head green"><el-icon><CircleCheck /></el-icon> 신규 계약</div>
        <div class="number">{{ kpi.thisMonthContracts }}건</div>
        <div class="tail green">이번 달</div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="계약명, 고객명, 담당자, 계약코드 검색"
        prefix-icon="Search"
        class="search-bar"
        @keyup.enter="fetchList"
      />

      <div class="actions">
        <el-select v-model="searchType" style="width: 150px">
          <el-option label="전체" value="contractCode,cusName,inCharge,conName" />
          <el-option label="계약 코드" value="contractCode" />
          <el-option label="고객명" value="cusName" />
          <el-option label="담당자" value="inCharge" />
          <el-option label="계약명" value="conName" />
        </el-select>

        <el-select v-model="selectedStatus" placeholder="상태" style="width: 140px">
          <el-option label="전체" value="" />
          <el-option label="진행" value="P" />
          <el-option label="만료 임박" value="I" />
          <el-option label="해지" value="T" />
          <el-option label="만료" value="C" />
        </el-select>

        <el-button type="primary" icon="Plus" @click="goToCreateContract">
          계약 생성
        </el-button>
      </div>
    </div>

    <!-- Table -->
    <el-card shadow="never" :body-style="{ padding: '0' }">
      <el-table :data="contractList" v-loading="loading">
        <el-table-column label="계약 코드" width="150" prop="contractCode">
          <template #default="{ row }">
            <span class="code-text">{{ row.contractCode }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="conName" label="계약명" min-width="220" show-overflow-tooltip />
        <el-table-column prop="cusName" label="고객명" width="160" />
        <el-table-column prop="inCharge" label="담당자" width="140" />

        <el-table-column label="기간" width="100">
          <template #default="{ row }">
            {{ row.contractPeriod }}개월
          </template>
        </el-table-column>

        <el-table-column label="월 납부액" width="140">
          <template #default="{ row }">
        {{ fmtWon(row.monthlyPayment) }}원
          </template>
        </el-table-column>

        <el-table-column label="시작일" width="140">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }}
          </template>
        </el-table-column>

        <el-table-column label="상태" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="관리" width="120" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="goToDetail(row.id)">
              상세보기
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-area">
        <el-pagination
          layout="prev, pager, next"
          :total="totalCount"
          v-model:current-page="page"
          :page-size="size"
          @current-change="fetchList"
        />
      </div>
    </el-card>
  </div>
</template>
<script setup>
import { getContractList, getContractStatus } from '@/api/contract'
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

import {
  Document,
  Clock,
  Warning,
  CircleCheck,
  Search,
  Plus
} from '@element-plus/icons-vue'

const router = useRouter()

const page = ref(1)
const size = ref(10)
const totalCount = ref(0)
const loading = ref(false)

const contractList = ref([])

const searchKeyword = ref('')
const searchType = ref('contractCode,cusName,inCharge,conName')
const selectedStatus = ref('')
const fmtWon = (v) => (Number(v) || 0).toLocaleString("ko-KR");

const kpi = ref({
  totalContracts: 0,
  progressContracts: 0,
  imminentExpireContracts: 0,
  thisMonthContracts: 0
})

const fetchKpi = async () => {
  const res = await getContractStatus()
  kpi.value = res.data
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
        page: page.value,
        size: size.value,
        type: searchType.value,
        keyword: searchKeyword.value,
        status: selectedStatus.value || null
    }
    const res = await getContractList(params)
    contractList.value = res.data.contents
    totalCount.value = res.data.totalCount
  } finally {
    loading.value = false
  }
}

const goToCreateContract = () => {
  router.push('/contracts/new')
}

const goToDetail = (id) => {
  router.push({ name: 'contract-detail', params: { id } })
}

const formatDate = (date) =>
  date ? dayjs(date).format('YYYY-MM-DD') : '-'

const statusLabel = (s) =>
  ({ P: '진행', I: '만료 임박', T: '해지', C: '만료', W: '결제 대기', R: '결제 거절' }[s])

const statusType = (s) =>
  ({ P: 'warning', I: 'danger', T: 'info', C: 'success', W:'waiting', R: "reject" }[s])


watch(selectedStatus, () => {
  page.value = 1
  fetchList()
})

onMounted(async () => {
  await fetchKpi()
  await fetchList()
})
</script>
<style scoped>
.page-container { padding: 20px; max-width: 1400px; margin: 0 auto; }
.page-title { font-size: 24px; font-weight: 700; color: #333; margin: 0; }
.page-subtitle { margin: 6px 0 0; color: #6b7280; font-size: 13px; margin-bottom: 24px; }


.stats-row {display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;}
.stat-card {background: white; border: 1px solid #eee; border-radius: 8px; padding: 20px;}
.stat-card .head {display: flex; align-items: center; gap: 6px;font-weight: 600;font-size: 14px;color: #555;}

.stat-card .number {font-size: 24px; font-weight: 700; margin: 8px 0;}
.stat-card .tail {font-size: 12px; color: #888;}

.head.purple { color: #9333ea; }
.head.green { color: #16a34a; }
.head.orange { color: #ea580c; }

.toolbar {display: flex; justify-content: space-between; margin-bottom: 16px;}

.search-bar { width: 350px; }
.actions {display: flex; gap: 8px;}

.code-text {font-family: monospace;}
.pagination-area {display: flex; justify-content: flex-end; padding: 16px;}
</style>