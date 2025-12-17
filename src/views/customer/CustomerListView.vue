<template>
  <div class="page-container">
    <div class="header-row">
      <h2>고객 목록</h2>
      <el-button type="primary" :icon="Plus">+ 신규 기업 등록</el-button>
    </div>
    <p class="subtitle">B2B 기업 고객 통합 관리 · 세그먼트별 분류</p>

    <div class="filter-row">
      <el-input
        v-model="searchKeyword"
        placeholder="기업명, 담당자, 연락처로 검색..."
        prefix-icon="Search"
        class="search-input"
        @keyup.enter="fetchData"
      />
      <div class="filter-group">
        <el-select v-model="filterSegment" placeholder="전체 세그먼트" style="width: 140px">
          <el-option label="VIP 고객" value="VIP" />
          <el-option label="일반 고객" value="NORMAL" />
        </el-select>
        <el-button @click="fetchData">필터 적용</el-button>
        <el-button type="primary" plain>세그먼트 기준표</el-button>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card">
        <div class="icon-box blue"><el-icon><OfficeBuilding /></el-icon></div>
        <div>
          <div class="label">총 거래 기업</div>
          <div class="value">{{ totalCount }}개사</div>
          <div class="sub-text blue-text">B2B 전용</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="icon-box green"><el-icon><Trophy /></el-icon></div>
        <div>
          <div class="label">VIP 고객</div>
          <div class="value">48개사</div>
          <div class="sub-text green-text">전체의 12.9%</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="icon-box red"><el-icon><Warning /></el-icon></div>
        <div>
          <div class="label">이탈위험 고객</div>
          <div class="value">32개사</div>
          <div class="sub-text red-text">즉시 조치 필요</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="icon-box gray"><el-icon><CircleCloseFilled /></el-icon></div>
        <div>
          <div class="label">블랙리스트</div>
          <div class="value">5개사</div>
          <div class="sub-text red-text">거래 제한</div>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table :data="customers" style="width: 100%" v-loading="loading">
        <el-table-column prop="customerCode" label="ID" width="140" />
        <el-table-column label="기업명" min-width="180">
          <template #default="scope">
            <span style="font-weight: 600">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="inCharge" label="담당자" width="120" />
        <el-table-column prop="dept" label="부서/직책" width="150" />
        <el-table-column prop="callNum" label="연락처" width="140" />
        <el-table-column label="첫 계약일" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.firstContractDate) }}
          </template>
        </el-table-column>
        <el-table-column label="세그먼트" width="140">
          <template #default="scope">
            <el-tag :type="getSegmentColor(scope.row.segmentName)" effect="light">
              {{ scope.row.segmentName || '미지정' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="memo" label="최근 메모" min-width="200" show-overflow-tooltip />
        <el-table-column label="액션" width="100" align="center">
          <template #default="scope">
            <el-button link type="danger" @click="goDetail(scope.row.id)">상세보기</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="totalCount"
          :page-size="pageSize"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, OfficeBuilding, Trophy, Warning, CircleCloseFilled } from '@element-plus/icons-vue'
import { getCustomerList } from '@/api/customerlist'
import dayjs from 'dayjs'

const router = useRouter()
const customers = ref([])
const totalCount = ref(0)
const loading = ref(false)
const searchKeyword = ref('')
const filterSegment = ref('')
const page = ref(1)
const pageSize = ref(10)

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: pageSize.value,
      name: searchKeyword.value
    }
    const res = await getCustomerList(params)
    customers.value = res.data.contents
    totalCount.value = res.data.totalCount
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (val) => {
  page.value = val
  fetchData()
}

const goDetail = (id) => {
  router.push(`/customers/${id}`)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD')
}

const getSegmentColor = (segmentName) => {
  if (!segmentName) return 'info'
  if (segmentName.includes('VIP')) return 'warning'
  if (segmentName.includes('신규')) return 'primary'
  if (segmentName.includes('이탈')) return 'danger'
  if (segmentName.includes('블랙')) return 'info'
  return 'success'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.page-container { max-width: 1600px; margin: 0 auto; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
h2 { font-size: 24px; font-weight: 700; color: #111; margin: 0; }
.subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
.filter-row { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 12px; }
.search-input { width: 400px; }
.filter-group { display: flex; gap: 8px; }
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
.kpi-card { background: white; padding: 20px; border-radius: 8px; border: 1px solid #eee; display: flex; align-items: center; gap: 16px; }
.icon-box { width: 48px; height: 48px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.icon-box.blue { background: #eef2ff; color: #4f46e5; }
.icon-box.green { background: #ecfdf5; color: #10b981; }
.icon-box.red { background: #fef2f2; color: #ef4444; }
.icon-box.gray { background: #f3f4f6; color: #4b5563; }
.label { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
.value { font-size: 20px; font-weight: 700; color: #111; margin-bottom: 2px; }
.sub-text { font-size: 12px; font-weight: 500; }
.blue-text { color: #4f46e5; }
.green-text { color: #10b981; }
.red-text { color: #ef4444; }
.table-card { border-radius: 8px; }
.pagination-row { display: flex; justify-content: flex-end; margin-top: 20px; }
</style>