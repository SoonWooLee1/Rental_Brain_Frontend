<template>
  <div class="page-container">

    <!-- 헤더 -->
    <div class="header-row">
      <div>
        <h2 class="page-title">AS / 정기점검</h2>
        <p class="page-desc">B2B 기업 자산 AS / 정기 점검 일정 관리 및 조회</p>
      </div>
      <el-tooltip content="점검 일정 추가 권한이 없습니다" placement="top" :disabled="canCreateAs">
        <el-button type="primary" :disabled="!canCreateAs" @click="canCreateAs && (showCreate = true)">
          점검 일정 등록
        </el-button>
      </el-tooltip>
    </div>

    <!-- 검색 영역 -->
    <div class="search-area card-box">
      <div class="filter-wrapper">
        <el-select v-model="search.type" clearable placeholder="유형" style="width: 110px">
          <el-option label="정기점검" value="R" />
          <el-option label="AS" value="A" />
        </el-select>

        <el-select v-model="search.status" clearable placeholder="상태" style="width: 100px">
          <el-option label="예정" value="P" />
          <el-option label="완료" value="C" />
        </el-select>

        <el-input v-model="search.keyword" placeholder="기업명 / 자산 / 기사명 검색" clearable style="width: 260px" />

        <el-button type="primary" @click="fetchList">검색</el-button>
        <el-button @click="resetSearch">초기화</el-button>
      </div>
    </div>

    <!-- 요약 카드 -->
    <el-row :gutter="16" class="kpi-wrapper">
      <el-col :span="6">
        <SummaryCard title="예정된 점검" :value="summary.thisMonthScheduleCount" sub="이번 달" type="SCHEDULED"
          :active="activeSummaryType === 'SCHEDULED'" @click="onSummaryClick" />
      </el-col>

      <el-col :span="6">
        <SummaryCard title="점검 임박" :value="summary.imminent72hCount" sub="72시간 이내" type="IMMINENT"
          :active="activeSummaryType === 'IMMINENT'" @click="onSummaryClick" />
      </el-col>

      <el-col :span="6">
        <SummaryCard title="완료" :value="summary.thisMonthCompletedCount" sub="이번 달" type="COMPLETED"
          :active="activeSummaryType === 'COMPLETED'" @click="onSummaryClick" />
      </el-col>

      <el-col :span="6">
        <SummaryCard title="AS 진행 중" :value="summary.todayInProgressCount" sub="처리 중" type="IN_PROGRESS"
          :active="activeSummaryType === 'IN_PROGRESS'" @click="onSummaryClick" />
      </el-col>
    </el-row>

    <!-- 테이블 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="list" style="width: 100%" @sort-change="onSortChange">
        <el-table-column prop="after_service_code" label="점검 ID" width="120" align="center" sortable="custom"/>
        <el-table-column prop="customerName" label="기업명" />
        <el-table-column prop="customerManager" label="담당자" width="100" align="center" />
        <el-table-column prop="itemName" label="렌탈 자산" />

        <el-table-column label="점검 유형" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">
              {{ row.type === 'A' ? 'AS' : '정기점검' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="dueDate" label="예정일" width="120" align="center" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.dueDate) }}
          </template>
        </el-table-column>

        <el-table-column prop="engineer" label="담당 기사" width="120" align="center" />

        <el-table-column label="상태" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'C' ? 'success' : 'info'">
              {{ row.status === 'C' ? '완료' : '예정' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="관리" width="110" align="center">
          <template #default="{ row }">
            <el-button size="small" @click.stop="goDetail(row.id)">
              상세보기
            </el-button>
          </template>
        </el-table-column>

      </el-table>

      <div class="pagination-wrapper">
        <el-pagination layout="prev, pager, next" :total="total" :page-size="page.size"
          v-model:current-page="page.current" @current-change="changePage" />
      </div>
    </el-card>

    <!-- 하단 영역 -->
    <el-row :gutter="16" class="bottom-row equal-height-row">
      <el-col :span="12">
        <el-card class="equal-height-card">
          <h4>다음 주 점검 예정 ({{ nextWeekCount }}건)</h4>
          <el-timeline>
            <el-timeline-item v-for="n in nextWeekList" :key="n.id" type="primary" class="timeline-clickable"
              @click="openFromTimeline(n.id)">
              <strong>{{ n.scheduleDate }} ({{ n.dayOfWeek }})</strong>
              <p>{{ n.summary }}</p>
            </el-timeline-item>

          </el-timeline>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="equal-height-card info-card">
          <h4>AS / 정기점검 관리 안내</h4>
          <small class="desc">※ 참고용 안내입니다</small>
          <ul>
            <li>기업별 렌탈 자산에 대한 정기 점검 및 AS 이력을 관리합니다.</li>
            <li>점검 유형·상태·키워드 기반 검색을 지원합니다.</li>
            <li>점검 예정·완료 현황을 한눈에 확인할 수 있습니다.</li>
            <li>다음 주 예정 점검을 미리 파악하여 운영 대응이 가능합니다.</li>
            <li>제품 목록에서 점검일 추가 시 자동 생성됩니다.</li>
          </ul>
        </el-card>
      </el-col>
    </el-row>

    <AsDetailModal
        v-if="showDetail && selectedAsId !== null"
        v-model="showDetail"
        :as-id="selectedAsId"
        @closed="onDetailClosed" />

    <AsCreateModal v-model="showCreate" @created="onCreated" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/api/axios'
import SummaryCard from '@/components/product/SummaryCard.vue'
import AsDetailModal from '@/components/product/AsDetailModal.vue'
import AsCreateModal from '@/components/product/AsCreateModal.vue'
import { useAuthStore } from '@/store/auth.store'
import { useRoute } from 'vue-router';

const route = useRoute();

// 상태
const summary = ref({})
const list = ref([])        // 화면에 보여줄 목록
const rawList = ref([])     // 백엔드에서 받은 원본 목록
const total = ref(0)
const showCreate = ref(false)
const router = useRouter()

const authStore = useAuthStore();

const canCreateAs = computed(() =>
  authStore.hasAuth('AS_SCHEDULE')
)

const sort = ref({
  field: null,
  direction: null
})

const page = ref({
  current: 1,
  size: 10
})

const search = ref({
  type: '',
  status: '',
  keyword: '',
  summaryType: null
})

const formatDate = (iso) => {
  if (!iso) return '';
  return iso.slice(0, 10);
};

const nextWeekList = ref([])
const nextWeekCount = ref(0)

const activeSummaryType = ref(null)

const goDetail = (id) => {
  selectedAsId.value = id
  showDetail.value = true
}

// API
const fetchSummary = async () => {
  const { data } = await axios.get('/as/summary')
  summary.value = data
}

const fetchList = async () => {
  const { data } = await axios.get('/as', {
    params: {
      page: page.value.current,
      size: page.value.size,
      type: search.value.type,
      status: search.value.status,
      keyword: search.value.keyword,
      summaryType: activeSummaryType.value,
      sortField: sort.value.field,
      sortOrder: sort.value.direction
    }
  })

  list.value = data.content
  total.value = data.totalCount

}

const fetchNextWeek = async () => {
  const { data: list } = await axios.get('/as/upcoming')
  const { data: count } = await axios.get('/as/upcoming/count')

  nextWeekList.value = list
  nextWeekCount.value = count
}

// SummaryCard 클릭
const onSummaryClick = (type) => {
  activeSummaryType.value = type
  search.value.summaryType = type
  page.value.current = 1

  search.value.type = ''
  search.value.keyword = ''

  if (type === 'COMPLETED') {
    search.value.status = 'C'
  } else {
    search.value.status = 'P'
  }

  fetchList()
}

const onSortChange = ({ prop, order }) => {
  if (!order) {
    sort.value.field = null
    sort.value.direction = null
  } else {
    if (prop === 'dueDate') {
      sort.value.field = 'dueDate'
    } else if (prop === 'after_service_code') {
      sort.value.field = 'afterServiceCode'
    }

    sort.value.direction = order === 'ascending' ? 'ASC' : 'DESC'
  }

  page.value.current = 1
  fetchList()
}

const resetSearch = () => {
  // 검색 조건 초기화
  search.value.type = ''
  search.value.status = ''
  search.value.keyword = ''
  search.value.summaryType = null

  // SummaryCard 선택 해제
  activeSummaryType.value = null
  page.value.current = 1

  // 페이지 초기화
  page.value.current = 1

  // 목록 재조회
  fetchList()
}

const showDetail = ref(false)
const selectedAsId = ref(null)

const openDetail = (row) => {
  selectedAsId.value = row.id
  showDetail.value = true
}

const onDetailClosed = () => {
  selectedAsId.value = null
}

const onCreated = () => {
  fetchSummary()
  fetchList()
  fetchNextWeek()
}

// 이벤트
const changePage = (p) => {
  page.value.current = p
  fetchList()
}

// 생명주기
onMounted(() => {
    fetchSummary()

    // [추가] URL 쿼리 파라미터(keyword)가 있다면 검색창에 자동으로 입력
    if (route.query.keyword) {
        // 1. 검색 객체에 값 주입
        search.value.keyword = route.query.keyword;
        // 2. 페이지 초기화
        page.value.current = 1;
    }

    fetchList()
    fetchNextWeek()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;

  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.page-desc {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.search-area.card-box {
  background: #fff;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: nowrap;
}

/* 버튼 줄어들지 않게 */
.filter-wrapper .el-button {
  flex-shrink: 0;
}

.kpi-wrapper {
  margin-bottom: 20px;
}

.table-card {
  border-radius: 8px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.bottom-row {
  margin-top: 20px;
}

.info-card ul {
  padding-left: 18px;
}

@media (max-width: 1024px) {
  .filter-wrapper {
    flex-wrap: wrap;
  }

  .filter-wrapper .el-input {
    width: 100% !important;
  }
}

.due-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  line-height: 1.2;
}

.due-date .date {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.due-date .time {
  font-size: 12px;
  color: #666;
}

@media (max-width: 640px) {
  .filter-wrapper {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-wrapper>* {
    width: 100% !important;
  }
}
</style>
