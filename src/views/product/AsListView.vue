<template>
    <div class="as-page">

    <!-- 헤더 -->
    <div class="page-header">
        <div>
            <h2>정기 점검 (AS)</h2>
            <p class="desc">B2B 기업 자산 AS / 정기 점검 일정 관리 및 조회</p>
        </div>
        <el-button type="primary" icon="Calendar" @click="showCreate = true">
            점검 일정 추가
        </el-button>
    </div>

    <!-- 요약 카드 -->
    <el-row :gutter="16" class="summary-row">
        <el-col :span="6">
            <SummaryCard
            title="예정된 점검"
            :value="summary.thisMonthScheduleCount"
            sub="이번 달"
            type="SCHEDULED"
            :active="activeSummaryType === 'SCHEDULED'"
            @click="onSummaryClick" />
        </el-col>

        <el-col :span="6">
            <SummaryCard
            title="점검 임박"
            :value="summary.imminent72hCount"
            sub="72시간 이내"
            type="IMMINENT"
            :active="activeSummaryType === 'IMMINENT'"
            @click="onSummaryClick" />
        </el-col>

        <el-col :span="6">
            <SummaryCard
            title="완료"
            :value="summary.thisMonthCompletedCount"
            sub="이번 달"
            type="COMPLETED"
            :active="activeSummaryType === 'COMPLETED'"
            @click="onSummaryClick" />
        </el-col>

        <el-col :span="6">
            <SummaryCard
            title="AS 진행 중"
            :value="summary.todayInProgressCount"
            sub="처리 중"
            type="IN_PROGRESS"
            :active="activeSummaryType === 'IN_PROGRESS'"
            @click="onSummaryClick" />
        </el-col>
    </el-row>

    <!-- 검색 바 -->
    <el-card class="search-card">
        <el-form :inline="true">

            <el-form-item label="유형">
            <el-select v-model="search.type" clearable placeholder="전체">
                <el-option label="정기점검" value="R" />
                <el-option label="AS" value="A" />
            </el-select>
            </el-form-item>

            <el-form-item label="상태">
            <el-select v-model="search.status" clearable placeholder="전체">
                <el-option label="예정" value="P" />
                <el-option label="완료" value="C" />
            </el-select>
            </el-form-item>

            <el-form-item>
            <el-input
                v-model="search.keyword"
                placeholder="기업명 / 자산 / 기사명 검색"
                clearable
                style="width: 260px"
            />
            </el-form-item>

            <el-button type="primary" @click="fetchList"> 검색 </el-button>

            <el-button @click="resetSearch"> 초기화 </el-button>

        </el-form>
    </el-card>

    <!-- 목록 테이블 -->
    <el-card>
        <el-table :data="list" @row-click="openDetail">
            <el-table-column prop="after_service_code" label="점검 ID" width="120" />
            <el-table-column prop="customerName" label="기업명" />
            <el-table-column prop="customerManager" label="담당자" />
            <el-table-column prop="itemName" label="렌탈 자산" />

            <el-table-column label="점검 유형">
            <template #default="{ row }">
                <el-tag>
                {{ row.type === 'A' ? 'AS' : '정기점검' }}
                </el-tag>
            </template>
            </el-table-column>

            <el-table-column prop="dueDate" label="예정일" />

            <el-table-column prop="engineer" label="담당 기사" />

            <el-table-column label="상태">
            <template #default="{ row }">
                <el-tag :type="row.status === 'C' ? 'success' : 'info'">
                {{ row.status === 'C' ? '완료' : '예정' }}
                </el-tag>
            </template>
            </el-table-column>
        </el-table>

        <!-- 페이지네이션 -->
        <div class="pagination">
            <el-pagination
            background
            layout="prev, pager, next"
            :total="total"
            :page-size="page.size"
            :current-page="page.current"
            @current-change="changePage"
            />
        </div>
    </el-card>

    <!-- 하단 영역 -->
    <el-row :gutter="16" class="bottom-row equal-height-row">

        <!-- 다음 주 점검 -->
        <el-col :span="12">
            <el-card class="equal-height-card">
            <h4>다음 주 점검 예정 ({{ nextWeekCount }}건)</h4>

            <el-timeline>
                <el-timeline-item
                v-for="n in nextWeekList"
                :key="n.scheduleDate"
                type="primary" >
                <strong>
                    {{ n.scheduleDate }} ({{ n.dayOfWeek }})
                </strong>
                <p>{{ n.summary }}</p>
                </el-timeline-item>
            </el-timeline>
            </el-card>
        </el-col>

        <!-- 설명 영역 -->
        <el-col :span="12">
            <el-card class="info-card equal-height-card">
            <h4>AS / 정기점검 관리 안내</h4>
            <ul>
                <li>기업별 렌탈 자산에 대한 정기 점검 및 AS 이력을 관리합니다.</li>
                <li>점검 유형, 상태, 키워드 기반 검색을 지원합니다.</li>
                <li>점검 예정·완료 현황을 한 눈에 확인할 수 있습니다.</li>
                <li>다음 주 예정 점검을 미리 파악하여 운영 대응이 가능합니다.</li>
                <li>제품목록에서 점검일 추가하면 점검주기가 자동으로 생성됩니다.</li>
            </ul>
            </el-card>
        </el-col>
    </el-row>

    <AsDetailModal
    v-model="showDetail"
    :as-id="selectedAsId"
    @closed="onDetailClosed" />

    <AsCreateModal
    v-model="showCreate"
    @created="onCreated" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/api/axios'
import dayjs from 'dayjs'
import SummaryCard from '@/components/product/SummaryCard.vue'
import AsDetailModal from '@/components/product/AsDetailModal.vue'
import AsCreateModal from '@/components/product/AsCreateModal.vue'

// 상태
const summary = ref({})
const list = ref([])        // 화면에 보여줄 목록
const rawList = ref([])     // 백엔드에서 받은 원본 목록
const total = ref(0)
const showCreate = ref(false)

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

const nextWeekList = ref([])
const nextWeekCount = ref(0)

const activeSummaryType = ref(null)

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
        summaryType: activeSummaryType.value
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

    // 백엔드 1차 필터
    search.value.type = ''
    search.value.keyword = ''

    if (type === 'COMPLETED') {
        search.value.status = 'C'
    } else {
        search.value.status = 'P'
    }

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
    fetchList()
    fetchNextWeek()
})
</script>

<style scoped>
.as-page { padding: 24px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.desc { color: #888; }
.summary-row { margin-bottom: 20px; }
.search-card { margin-bottom: 16px; }
.pagination { display: flex; justify-content: center; margin-top: 16px; }
.bottom-row { margin-top: 20px; }
.info-card ul { padding-left: 18px; }

/* el-select 선택값 텍스트 */
:deep(.el-select .el-input__inner) { color: #333; }

/* 드롭다운 옵션 텍스트 */
:deep(.el-select-dropdown__item) { color: #333; }

/* inline form 아이템 정렬 */
:deep(.el-form--inline .el-form-item) { margin-bottom: 0; vertical-align: middle; }

/* 버튼 높이 통일 */
:deep(.el-button) { height: 32px; line-height: 32px; padding: 0 16px; }

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) { height: 32px; align-items: center; }

/* el-input / el-select 내부 텍스트 정렬 보정 */
:deep(.el-input__inner) { height: 32px; line-height: 32px; padding-top: 0; padding-bottom: 0; display: flex; align-items: center; }

/* select 화살표 아이콘 정렬 */
:deep(.el-select__caret) { line-height: 32px; }

/* el-select / el-input 높이 완전 강제 리셋 */
:deep(.el-input__wrapper) { height: 36px !important; min-height: 36px !important; padding: 0 11px !important; align-items: center !important; overflow: visible !important; }

/* 실제 텍스트 영역 */
:deep(.el-input__inner) { height: 36px !important; line-height: 36px !important; padding: 0 !important; display: flex; align-items: center; }

/* select caret(화살표) */
:deep(.el-select__caret) { line-height: 36px !important; }

/* clear 아이콘 정렬 */
:deep(.el-input__suffix),
:deep(.el-input__prefix) { height: 36px; display: flex; align-items: center; }

/* 버튼도 동일 높이 */
:deep(.el-button) { height: 36px !important; line-height: 36px !important; }

:deep(.el-select) { width: 140px; }

:deep(.select-type) { width: 140px; }

/* 하단 row를 flex로 */
.bottom-row.equal-height-row { display: flex; }

.bottom-row.equal-height-row > .el-col { display: flex; }

/* 카드가 부모 높이를 100% 따라가게 */
.equal-height-card { flex: 1; display: flex; flex-direction: column; }

</style>
