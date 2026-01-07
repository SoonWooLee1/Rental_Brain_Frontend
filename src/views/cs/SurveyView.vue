<template>
  <div class="page">
    <!-- 헤더 -->
    <div class="header">
      <div>
        <h2>설문조사 목록</h2>
        <p>완료된 설문조사를 확인할 수 있습니다</p>
      </div>

      <el-tooltip
  v-if="!canCreateSurvey"
  content="설문조사 등록 권한이 없습니다"
  placement="bottom"
>
  <span>
    <el-button
      type="primary"
      :disabled="true"
    >
      설문조사 등록
    </el-button>
  </span>
</el-tooltip>

<el-button
  v-else
  type="primary"
  @click.stop="goCreate"
>
  설문조사 등록
</el-button>
    </div>

    <!-- 고객목록과 동일한 검색/필터 영역 -->
    <div class="search-area card-box">
      <div class="filter-wrapper">
        <!-- 키워드 -->
        <el-input
          v-model="searchKeyword"
          placeholder="설문명 또는 설문 코드 검색"
          class="search-input"
          clearable
          style="width: 300px;"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <!-- 카테고리(다중) -->
        <el-select
          v-model="selectedCategories"
          multiple
          collapse-tags
          placeholder="카테고리 필터"
          style="width: 240px;"
          @change="handleSearch"
        >
          <el-option
            v-for="c in categoryOptions"
            :key="c.value"
            :label="c.label"
            :value="c.value"
          />
        </el-select>

        <el-button type="primary" @click="handleSearch">검색</el-button>
        <el-button @click="resetSearch">초기화</el-button>
      </div>
    </div>

    <!-- 테이블 -->
    <el-card shadow="never">
      <!-- 정렬 이벤트를 받기 위해 @sort-change 추가 -->
        <el-table
          :data="pagedSurveys"
          v-loading="loading"
          @row-click="openAiResult"
          @sort-change="handleSortChange"
        >
        <!-- 설문 코드에 화살표 추가 -->
        <el-table-column prop="surveyCode" label="설문 코드" width="140" sortable="custom" />

        <el-table-column prop="name" label="설문명" min-width="220" />

        <el-table-column label="카테고리" width="140">
          <template #default="{ row }">
            <el-tag type="info">
              {{ row.surveyCategoryDTO.name }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="설문 기간" width="260">
          <template #default="{ row }">
            <div class="date">
              {{ formatDate(row.startDate) }}
              <span>~</span>
              {{ formatDate(row.endDate) }}
            </div>
          </template>
        </el-table-column>


      </el-table>

        <!-- 링크 -->
        <!-- <el-table-column label="설문 링크" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openLink(row.link)">
              이동
            </el-button>
          </template>
        </el-table-column> -->

        
      <!-- 페이지네이션 -->
        <div class="pagination-wrapper">
          <el-pagination
            layout="prev, pager, next"
            :total="filteredSurveys.length"
            :page-size="pageSize"
            v-model:current-page="page"
          />
        </div>
    </el-card>

    <SurveyAiResult
      v-model="aiDialogVisible"
      :survey-id="selectedSurveyId"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import SurveyAiResult from './SurveyAiResultView.vue'
import { useAuthStore } from '@/store/auth.store'

const selectedSurveyId = ref(null)
const aiDialogVisible = ref(false)

const router = useRouter()
const surveys = ref([])
const loading = ref(false)
const authStore = useAuthStore();

// 페이지네이션
const searchKeyword = ref('')
const page = ref(1)       // 현재 페이지
const pageSize = 10       // 페이지당 행 개수

const selectedCategories = ref([]) // 다중 선택
const selectedStatus = ref('ALL')  // 단일 선택


const sortState = ref({
  sortBy: "",       // 기본은 빈 값(정렬 없음)
  sortOrder: ""     // "asc" | "desc"
})

/** 설문 생성 권한 */
const canCreateSurvey = computed(() =>
  authStore.hasAuth("CS_PROCESS")
);

onMounted(() => {
  fetchSurveys()
})

const fetchSurveys = async () => {
  loading.value = true
  try {
    const res = await api.get('/survey/list')
    surveys.value = res.data
  } catch (e) {
    console.error('설문 목록 조회 실패', e)
  } finally {
    loading.value = false
  }
}

//검색 필터 결과
const filteredSurveys = computed(() => {
  const k = searchKeyword.value.trim().toLowerCase()
  const cats = selectedCategories.value
  const st = selectedStatus.value

  return surveys.value.filter((s) => {
    // 1) 키워드(설문명/코드)
    const hitKeyword =
      !k ||
      s.name?.toLowerCase().includes(k) ||
      s.surveyCode?.toLowerCase().includes(k)

    // 2) 카테고리(다중)
    const catId = s?.surveyCategoryDTO?.id
    const hitCategory =
      cats.length === 0 || (catId != null && cats.includes(catId))

    // 3) 상태(단일)
    const hitStatus =
      st === 'ALL' || s.status === st

    return hitKeyword && hitCategory && hitStatus
  })
})

// 정렬 추가
const sortedSurveys = computed(() => {
  const list = [...filteredSurveys.value]
  const { sortBy, sortOrder } = sortState.value

  // 정렬이 없으면 그대로 반환
  if (!sortBy || !sortOrder) return list

  const dir = sortOrder === "asc" ? 1 : -1

  return list.sort((a, b) => {
    const av = a?.[sortBy]
    const bv = b?.[sortBy]

    // null/undefined 처리
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1

    // 문자열 비교 (surveyCode 같은 코드 정렬)
    if (typeof av === "string" && typeof bv === "string") {
      return av.localeCompare(bv) * dir
    }

    // 숫자/기타 비교
    if (av > bv) return 1 * dir
    if (av < bv) return -1 * dir
    return 0
  })
})

//페이지네이션
const pagedSurveys = computed(() => {
  const start = (page.value - 1) * pageSize
  return sortedSurveys.value.slice(start, start + pageSize)
})

/* 검색어 바뀌면 1페이지로 */
watch(searchKeyword, () => {
  page.value = 1
})

sortState.value.sortBy = ""
sortState.value.sortOrder = ""

const categoryOptions = computed(() => {
  const map = new Map()
  for (const s of surveys.value) {
    const id = s?.surveyCategoryDTO?.id
    const name = s?.surveyCategoryDTO?.name
    if (id != null && name) map.set(id, name)
  }
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
})

const handleSearch = () => {
  page.value = 1
}

//정렬 이벤트 핸들러
const handleSortChange = ({ prop, order }) => {
  // 정렬 해제(null)면 정렬 상태를 비움
  if (!order) {
    sortState.value.sortBy = ""
    sortState.value.sortOrder = ""
    return
  }

  if (prop === "surveyCode") {
    sortState.value.sortBy = "surveyCode"
  } else {
    sortState.value.sortBy = prop
  }

  sortState.value.sortOrder = order === "ascending" ? "asc" : "desc"
  page.value = 1 // 정렬 바뀌면 1페이지로
}

const resetSearch = () => {
  searchKeyword.value = ''
  selectedCategories.value = []
  selectedStatus.value = 'ALL'
  page.value = 1
}


const formatDate = (date) => date.slice(0, 10)

const statusText = (status) => {
  switch (status) {
    case 'OPEN': return '진행중'
    case 'READY': return '예정'
    case 'CLOSED': return '종료'
    default: return status
  }
}

const statusTag = (status) => {
  switch (status) {
    case 'OPEN': return 'success'
    case 'READY': return 'warning'
    case 'CLOSED': return 'info'
    default: return ''
  }
}

const openAiResult = (row) => {
  selectedSurveyId.value = row.id
  aiDialogVisible.value = true
}

const goCreate = () => {
  router.push('/cs/survey/create')
}
</script>


<style scoped>
.page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}
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
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.btn-guide {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
}
</style>