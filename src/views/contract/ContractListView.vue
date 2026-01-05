<template>
  <div class="page-container">

    <!-- ===== Header ===== -->
    <div class="header-row">
      <div>
        <h1 class="page-title">계약 목록</h1>
        <p class="page-subtitle">계약 현황 및 진행 상태 관리</p>
      </div>
      <el-tooltip
  v-if="!canCreateContract"
  content="계약 생성 권한이 없습니다"
  placement="top"
>
  <span>
    <el-button type="primary" disabled>
      <el-icon><Plus /></el-icon>
      계약 생성
    </el-button>
  </span>
</el-tooltip>

<el-button
  v-else
  type="primary"
  @click="goToCreateContract"
>
  <el-icon><Plus /></el-icon>
  계약 생성
</el-button>
    </div>

     <!-- ===== Search / Filter ===== -->
    <div class="search-area card-box">
      <div class="filter-wrapper">
        <el-input
          v-model="searchKeyword"
          placeholder="계약명, 고객명, 담당자, 계약코드 검색"
          class="search-input"
          style="width: 300px"
          @keyup.enter="fetchList"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="searchType" style="width: 160px">
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

        <el-button type="primary" @click="fetchList">검색</el-button>
      </div>
    </div>

    <!-- ===== KPI ===== -->
    <div class="kpi-wrapper">
      <div class="kpi-box">
        <span class="kpi-title">전체 계약</span>
        <span class="kpi-count">{{ kpi.totalContracts }}건</span>
      </div>

      <div class="kpi-box">
        <span class="kpi-title">진행 중</span>
        <span class="kpi-count highlight">{{ kpi.progressContracts }}건</span>
      </div>

      <div class="kpi-box warning-box">
        <span class="kpi-title">만료 임박</span>
        <span class="kpi-count warning">{{ kpi.imminentExpireContracts }}건</span>
      </div>

      <div class="kpi-box">
        <span class="kpi-title">이번 달 신규</span>
        <span class="kpi-count">{{ kpi.thisMonthContracts }}건</span>
      </div>
    </div>

    <!-- ===== Table ===== -->
    <el-card shadow="never" class="table-card">
      <el-table :data="contractList" v-loading="loading">
        <el-table-column label="계약 코드" width="150">
          <template #default="{ row }">
            <span class="code-text">{{ row.contractCode }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="conName" label="계약명" min-width="220" show-overflow-tooltip />
        <el-table-column prop="cusName" label="고객명" width="160" />
        <el-table-column prop="inCharge" label="담당자" width="140" />

        <el-table-column label="기간" width="100" align="center">
          <template #default="{ row }">
            {{ row.contractPeriod }}개월
          </template>
        </el-table-column>

        <el-table-column label="월 납부액" width="140" align="right">
          <template #default="{ row }">
            {{ fmtWon(row.monthlyPayment) }}만원
          </template>
        </el-table-column>

        <el-table-column label="시작일" width="130" align="center">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }}
          </template>
        </el-table-column>

        <el-table-column label="상태" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="관리" width="120" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="goToDetail(row.id)">
              상세보기
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          layout="prev, pager, next"
          :total="totalCount"
          :page-size="size"
          v-model:current-page="page"
          @current-change="fetchList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { getContractList, getContractStatus } from '@/api/contract'
import { Search, Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/auth.store'

const router = useRouter()
const authStore = useAuthStore();

const page = ref(1)
const size = ref(10)
const totalCount = ref(0)
const loading = ref(false)

const contractList = ref([])

const searchKeyword = ref('')
const searchType = ref('contractCode,cusName,inCharge,conName')
const selectedStatus = ref('')

const kpi = ref({
  totalContracts: 0,
  progressContracts: 0,
  imminentExpireContracts: 0,
  thisMonthContracts: 0
})

const fmtWon = (v) => {
  const value = Number(v) || 0
  return (value / 10000).toLocaleString('ko-KR')
}

const fetchKpi = async () => {
  const res = await getContractStatus()
  kpi.value = res.data
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getContractList({
      page: page.value,
      size: size.value,
      type: searchType.value,
      keyword: searchKeyword.value,
      status: selectedStatus.value || null
    })
    contractList.value = res.data.contents
    totalCount.value = res.data.totalCount
  } finally {
    loading.value = false
  }
}

const canCreateContract = computed(() =>
  authStore.hasAuth('CONTRACT_WRITE')
)

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
  ({ P: 'warning', I: 'danger', T: 'info', C: 'success', W: 'info', R: 'danger' }[s])

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
.page-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-row h1 {
  font-size: 30px;
  font-weight: 600;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}
.page-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
}

/* Search */
.search-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eee;
}
.filter-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

/* KPI */
.kpi-wrapper {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
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
  color: #666;
  margin-bottom: 18px;
}

.kpi-count {
  margin-top: auto;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.2;
}


.highlight { color: #f59e0b; }
.warning { color: #ef4444; }
.warning-box {
  background-color: #fef2f2;
  border-color: #fee2e2;
}

/* Table */
.table-card {
  border-radius: 8px;
}
.code-text {
  font-family: monospace;
}
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

</style>
