<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from '@/api/axios'
import StatusBadge from '@/components/overdue/StatusBadge.vue'

const router = useRouter()
const route = useRoute()

/* 탭 */
const activeTab = ref(route.query.tab === 'item' ? 'item' : 'pay')

/* Criteria */
const criteria = ref({
  pageNum: 1,
  amount: 10,
  type: 'customer',
  keyword: ''
})

/* 상태 */
const status = ref('')

/* 데이터 */
const list = ref([])
const totalCount = ref(0)
const loading = ref(false)

/* 목록 조회 */
const fetchList = async () => {
  loading.value = true
  try {
    const url =
      activeTab.value === 'pay'
        ? '/customers/overdues/pay'
        : '/customers/overdues/item'

    const params = {
      pageNum: criteria.value.pageNum,
      amount: criteria.value.amount,
      type: criteria.value.type
    }

    if (criteria.value.keyword?.trim()) {
      params.keyword = criteria.value.keyword.trim()
    }

    if (status.value) {
      params.status = status.value
    }

    const { data } = await axios.get(url, { params })

    list.value = data.contents ?? []
    totalCount.value = data.totalCount ?? 0
  } catch (e) {
    console.error('연체 목록 조회 실패', e)
  } finally {
    loading.value = false
  }
}

/* 탭 변경 */
const onTabChange = () => {
  criteria.value.pageNum = 1
    router.replace({
    query: { ...route.query, tab: activeTab.value }
  })
  fetchList()
}

/* 페이지 변경 */
const onPageChange = (page) => {
  criteria.value.pageNum = page
  fetchList()
}

/* 상세 이동 */
const goDetail = (row) => {
  router.push({
    name:
      activeTab.value === 'pay'
        ? 'customer-pay-overdue-detail'
        : 'customer-item-overdue-detail',
    params: { overdueId: row.overdueId }
  })
}

/* 날짜 포맷 */
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toISOString().slice(0, 10)
}

const applySearch = () => {
  criteria.value.pageNum = 1
  fetchList()
}

const resetSearch = () => {
  criteria.value = {
    pageNum: 1,
    amount: 10,
    type: 'customer',
    keyword: ''
  }
  status.value = ''
  fetchList()
}

watch(
  () => [criteria.value.type, status.value],
  () => {
    applySearch()
  }
)

watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'pay' || tab === 'item') {
      activeTab.value = tab
      criteria.value.pageNum = 1
      fetchList()
    }
  },
  { immediate: true }
)

/* 연락처 포맷: 02-6100-0060 / 010-1234-5678 */
const formatPhone = (value) => {
  if (!value) return '-'
  const d = String(value).replace(/\D/g, '')

  // 02 지역번호
  if (d.startsWith('02')) {
    if (d.length === 9)  return d.replace(/^(\d{2})(\d{3})(\d{4})$/, '$1-$2-$3')   // 02-123-4567
    if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, '$1-$2-$3')  // 02-1234-5678
  }

  // 휴대폰/기타 지역번호(3자리)
  if (d.length === 10) return d.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')    // 031-123-4567
  if (d.length === 11) return d.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3')    // 010-1234-5678

  return value
}

onMounted(fetchList)
</script>


<template>
  <div class="risk-page">
    <h2>연체 관리</h2>
    <p class="desc">수납 연체 추적 · 제품 반납 관리 · 리스크 관리</p>

    <!-- 탭 -->
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane label="수납 연체" name="pay" />
      <el-tab-pane label="제품 연체" name="item" />
    </el-tabs>

    <!-- 검색 -->
    <div class="search-row">
      <el-select v-model="criteria.type" style="width: 140px">
        <el-option label="기업명" value="customer" />
        <el-option label="계약 ID" value="contract" />
        <el-option label="연체 코드" value="overdue" />
      </el-select>

      <el-input
        v-model="criteria.keyword"
        placeholder="검색어"
        style="width: 220px"
        clearable
        @keyup.enter="applySearch" />

      <el-select
        v-model="status"
        clearable
        placeholder="상태"
        style="width: 120px" >

        <el-option label="미해결" value="P" />
        <el-option label="해결" value="C" />
      </el-select>

      <el-button type="primary" @click="fetchList">검색</el-button>
      <el-button @click="resetSearch">초기화</el-button>
    </div>

    <!-- 테이블 -->
  <el-card shadow="never" class="table-card">
    <el-table
      :data="list"
      v-loading="loading"
      style="width: 100%" >
      <el-table-column
        :prop="activeTab === 'pay' ? 'payOverdueCode' : 'itemOverdueCode'"
        label="연체 ID" 
        align="center"
        header-align="center"
      />
      <el-table-column prop="customerName" label="기업명" align="center" header-align="center" />
      <el-table-column prop="inCharge" label="담당자" align="center" header-align="center"/>
      <el-table-column prop="callNum" label="연락처" align="center" header-align="center">
        <template #default="{ row }">
          {{ formatPhone(row.callNum) }}
        </template>
      </el-table-column>
      <el-table-column prop="contractCode" label="계약 ID" align="center" header-align="center"/>

      <el-table-column
        v-if="activeTab === 'item'"
        prop="count"
        label="연체 수량"
        align="center"
        header-align="center" >
        <template #default="{ row }">
          <span class="danger">{{ row.count }}개</span>
        </template>
      </el-table-column>

      <el-table-column prop="dueDate" label="예정일" align="center" header-align="center">
        <template #default="{ row }">
          {{ formatDate(row.dueDate) }}
        </template>
      </el-table-column>

      <el-table-column prop="overduePeriod" label="연체 기간">
        <template #default="{ row }">
          <span class="danger">{{ row.overduePeriod }}일</span>
        </template>
      </el-table-column>

      <el-table-column label="상태" align="center" header-align="center">
        <template #default="{ row }">
          <StatusBadge :status="row.status" />
        </template>
      </el-table-column>

      <el-table-column label="관리" width="110" align="center">
      <template #default="{ row }">
        <el-button
          size="small"
          @click.stop="goDetail(row)" >
          상세보기
        </el-button>
      </template>
    </el-table-column>
    </el-table>

    <!-- 페이징 -->
    <div class="pagination-wrapper">
      <el-pagination
        layout="prev, pager, next"
        :total="totalCount"
        :page-size="criteria.amount"
        @current-change="onPageChange" />
    </div>
  </el-card>
  </div>
</template>

<style scoped>
.risk-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 페이지 타이틀 */
.risk-page h2 {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.desc {
  color: #888;
  margin-bottom: 20px;
}

/* 탭 영역 */
:deep(.el-tabs__header) {
  margin-bottom: 16px;
}

/* 검색 영역 (고객 목록 search-area 스타일 차용) */
.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 20px;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eee;
}

/* 테이블 카드화 */
:deep(.el-table) {
  border-radius: 8px;
}

:deep(.el-table__header th) {
  background-color: #fafafa;
  font-weight: 600;
  color: #555;
}

/* row hover 톤 */
:deep(.el-table__row:hover) {
  background-color: #f9fafb;
}

/* 상태 강조 */
.danger {
  color: #ef4444;
  font-weight: 700;
}

/* 페이징 */
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 테이블 카드 */
.table-card {
  margin-top: 12px;
  border-radius: 8px;
}

/* pagination 위치 */
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* Element Plus pagination 버튼 톤 */
:deep(.el-pagination) {
  --el-pagination-button-bg-color: transparent;
  --el-pagination-button-color: #333;
  --el-pagination-button-disabled-color: #bbb;
  --el-pagination-button-disabled-bg-color: transparent;
}

/* 페이지 버튼 */
:deep(.el-pager li) {
  border-radius: 6px;
  font-weight: 500;
}

/* 활성 페이지 */
:deep(.el-pager li.is-active) {
  background-color: #409eff;
  color: #fff;
}

/* hover */
:deep(.el-pager li:hover) {
  color: #409eff;
}

/* 반응형 */
@media (max-width: 768px) {
  .search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .risk-page h2 {
    font-size: 20px;
  }
}
</style>
