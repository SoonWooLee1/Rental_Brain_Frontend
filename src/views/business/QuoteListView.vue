<template>
  <div class="page-container">
    <div class="header-row">
      <div class="title-area">
        <h2 class="page-title">고객 상담 내역</h2>
        <p class="page-subtitle">기업 고객 문의 및 상담 관리</p>
      </div>

      <el-button type="primary" class="btn-register" @click="handleCreate">
        <el-icon><Plus /></el-icon> 상담 추가
      </el-button>
    </div>

    <div class="kpi-wrapper">
        <div class="kpi-box">
            <span class="kpi-title">전체 상담</span>
            <span class="kpi-count">{{ kpi.totalCount?.toLocaleString() || 0 }}건</span>
            <span class="kpi-desc">전체 견적기준</span>
        </div>

        <div class="kpi-box">
            <span class="kpi-title">오늘 완료</span>
            <span class="kpi-count highlight">{{ kpi.todayCount?.toLocaleString() || 0 }}건</span>
            <span class="kpi-desc">오늘 처리 완료된 상담</span>
        </div>

        <div class="kpi-box">
            <span class="kpi-title">평균 처리시간</span>

        <div class="kpi-dual">
            <div class="kpi-item">
                <span class="kpi-value">
                    {{ (kpi.avgProcessingAll ?? 0).toFixed(0) }}분
                </span>
                <span class="kpi-label">전체 평균</span>
            </div>

            <div class="kpi-divider"></div>
                <div class="kpi-item">
                    <span class="kpi-value highlight">
                        {{ (kpi.avgProcessing7Days ?? 0).toFixed(0) }}분
                    </span>
                    <span class="kpi-label">최근 7일</span>
                </div>
            </div>
        </div>
    </div>

    <div class="search-area card-box">
      <div class="filter-wrapper">
        <el-input
          v-model="keyword"
          placeholder="기업명으로 검색..."
          class="search-input"
          @keyup.enter="handleSearch"
          clearable
          style="width: 320px;"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>


        <el-select
            v-model="keywordTarget"
            placeholder="검색 대상"
            style="width: 140px;"
            @change="handleSearch"
            >
                <el-option label="전체(통합)" value="ALL" />
                <el-option label="기업명" value="customerName" />
                <!-- <el-option label="담당자" value="customerInCharge" /> -->
                <el-option label="연락처" value="customerCallNum" />
                <el-option label="상담사" value="quoteCounselor" />
                <el-option label="요약" value="quoteSummary" />
        </el-select>

        <el-select
            v-model="quoteChannelId"
            placeholder="전체 유형"
            style="width: 240px;"
            clearable
            @change="handleSearch"
            >
            <el-option :label="'전화'" :value="1" />
            <el-option :label="'이메일'" :value="2" />
            <el-option :label="'웹(채팅, 게시판)'" :value="3" />
            <el-option :label="'SNS'" :value="4" />
            <el-option :label="'방문'" :value="5" />
            <el-option :label="'기타'" :value="6" />
        </el-select>



        <el-button type="primary" @click="handleSearch">검색</el-button>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table :data="quoteList" style="width: 100%" v-loading="loading" @sort-change="handleSortChange">
        <el-table-column prop="quoteCode" label="ID" width="120" align="center" sortable="custom"/>
        <el-table-column label="상담일시" min-width="200">
          <template #default="{ row }">
            <div>
                <div class="date-text">
                    {{ formatRange(row.quoteCounselingDate, row.quoteProcessingTime) }}
                </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="customerName" label="기업명" min-width="135" show-overflow-tooltip />
        <el-table-column prop="customerInCharge" label="담당자" width="70" align="center" />

        <el-table-column label="연락처" width="115" align="center">
          <template #default="{ row }">{{ formatPhone(row.customerCallNum) }}</template>
        </el-table-column>

        <el-table-column prop="channelName" label="유형" width="130" align="center">
      <template #default="{ row }">
        <el-tag 
          size="small" 
          :style="getChannelTagStyle(row.channelName)"
        >
          {{ row.channelName || '-' }}
        </el-tag>
      </template>
    </el-table-column>

        <el-table-column label="처리시간" width="80" align="center">
          <template #default="{ row }">
            {{ row.quoteProcessingTime ? `${row.quoteProcessingTime}분` : '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="quoteCounselor" label="상담사" width="80" align="center" />
        <el-table-column prop="quoteSummary" label="요약" min-width="260" show-overflow-tooltip />

        <el-table-column label="관리" width="110" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="openDetailModal(row)">
              상세보기
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          layout="prev, pager, next"
          :total="totalCount"
          :page-size="pageSize"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <QuoteCreateModal
      v-if="isCreateModalOpen"
      v-model="isCreateModalOpen"
      :edit-data="editingQuote"  @close="closeCreateModal"
      @refresh="fetchData"
    />

    <QuoteDetailModal
        v-if="isDetailModalOpen && selectedQuoteId"
        v-model="isDetailModalOpen"
        :quote-id="selectedQuoteId"
        @close="closeDetailModal"
        @refresh="fetchData"
        @request-edit="handleEditRequest" 
      />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive} from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';

import { getQuoteList, getQuoteKpi } from '@/api/quote';
import QuoteDetailModal from './QuoteDetailModal.vue';
// 등록 모달 import
import QuoteCreateModal from './QuoteCreateModal.vue';

const router = useRouter();

const loading = ref(false);
const quoteList = ref([]);
const totalCount = ref(0);
const pageSize = ref(10);
const currentPage = ref(1);

// 모달 열고 닫는것
const isDetailModalOpen = ref(false);
const selectedQuoteId = ref(null);

// 등록 모달 상태
const isCreateModalOpen = ref(false);
// 수정할 데이터를 담을 변수
const editingQuote = ref(null);

// 검색/필터
const keyword = ref('');
const keywordTarget = ref('ALL'); 
const quoteChannelId = ref(null);
const quoteCounselor = ref('');

// 연락처 하이픈 추가
const formatPhone = (v) => v ? v.replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3") : '-';

// KPI
const kpi = ref({
  totalCount: 0,
  todayDone: 0,
  avgProcessingTime: 0,
});

// [추가] 정렬 상태 관리
const sortState = reactive({
  sortBy: 'quoteId', 
  sortOrder: 'desc'
});

const fetchData = async () => {
  loading.value = true;
  try {
    const kpiRes = await getQuoteKpi();
    if (kpiRes.data) kpi.value = kpiRes.data;

    const kw = keyword.value?.trim();
    const counselor = quoteCounselor.value?.trim();

    // 기본 파라미터
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      quoteChannelId: quoteChannelId.value ?? undefined,
      sortBy: sortState.sortBy,      // [추가]
      sortOrder: sortState.sortOrder // [추가]
    };

    // ✅ keywordTarget에 따라 "딱 1개 필드"에만 kw를 넣기
    if (kw) {
      if (keywordTarget.value === 'customerName') params.customerName = kw;
      else if (keywordTarget.value === 'customerInCharge') params.customerInCharge = kw;
      else if (keywordTarget.value === 'customerCallNum') params.customerCallNum = kw;
      else if (keywordTarget.value === 'quoteSummary') params.quoteSummary = kw;
      else if (keywordTarget.value === 'quoteCounselor') params.quoteCounselor = kw; // kw를 상담사에 연결
      else {
        // ALL: 백엔드 OR 지원 없으면 임시로 customerName에만 넣어둠
        params.customerName = kw;
      }
    }
    const listRes = await getQuoteList(params);

    quoteList.value = listRes.data.contents || [];
    totalCount.value = listRes.data.totalCount || 0;
  } catch (e) {
    console.error(e);
    ElMessage.error('견적/상담 데이터를 불러오는데 실패했습니다.');
  } finally {
    loading.value = false;
  }
};


const handleSearch = () => {
  currentPage.value = 1;
  fetchData();
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchData();
};

const handleCreate = () => {
  // 모달 열기 로직 연결
  // ElMessage.info('상담 추가(등록) 화면/모달은 다음 단계에서 연결하자!');
  openCreateModal();
};

// 등록 모달 열기/닫기 함수
const openCreateModal = () => {
  editingQuote.value = null; // null이면 등록 모드
  isCreateModalOpen.value = true;
};

// 수정 요청 처리 (DetailModal에서 이벤트 발생 시 호출됨)
const handleEditRequest = (data) => {
  editingQuote.value = data; // 수정할 데이터 주입
  isCreateModalOpen.value = true; // 모달 열기 (수정 모드)
};

const closeCreateModal = () => {
  isCreateModalOpen.value = false;
  editingQuote.value = null; // 닫을 때 데이터 초기화
};

// 상세 조회 모달 띄우기
const openDetailModal = (row) => {
  console.log('상세보기 row=', row);

  const id = row.quoteId ?? row.id ?? row.quote_id;
  console.log('상세보기 id 확정=', id);           // ✅ 추가

  selectedQuoteId.value = id;
  isDetailModalOpen.value = true;

  console.log('모달 open 상태=', isDetailModalOpen.value, '선택 id=', selectedQuoteId.value); // ✅ 추가
};

const closeDetailModal = () => {
  isDetailModalOpen.value = false;
  selectedQuoteId.value = null;
};

const formatRange = (startIso, minutes) => {
  if (!startIso) return '-';
  const start = new Date(startIso);
  const startText = `${toYMD(start)} ${toHM(start)}`;

  if (!minutes && minutes !== 0) return startText;

  const end = new Date(start.getTime() + Number(minutes) * 60 * 1000);
  return `${startText} ~ ${toHM(end)}`;
};

const toYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const toHM = (d) => {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

// [추가] 정렬 핸들러
const handleSortChange = ({ prop, order }) => {
  // 백엔드 필드명과 매핑 (필요 시 수정)
  sortState.sortBy = prop === 'quoteCode' ? 'quoteId' : prop; 
  sortState.sortOrder = order === 'ascending' ? 'asc' : (order === 'descending' ? 'desc' : null);
  
  currentPage.value = 1; 
  fetchData();
};

// [추가] 유형별 배지 색상 반환
const getChannelTagStyle = (name) => {
  const styles = {
    '전화': { color: '#409EFF', backgroundColor: '#ecf5ff', borderColor: '#d9ecff' }, // 파랑
    '이메일': { color: '#67C23A', backgroundColor: '#f0f9eb', borderColor: '#e1f3d8' }, // 초록
    '웹': { color: '#E6A23C', backgroundColor: '#fdf6ec', borderColor: '#faecd8' }, // 주황
    '웹(채팅, 게시판)': { color: '#E6A23C', backgroundColor: '#fdf6ec', borderColor: '#faecd8' },
    'SNS': { color: '#F56C6C', backgroundColor: '#fef0f0', borderColor: '#fde2e2' }, // 빨강
    '방문': { color: '#909399', backgroundColor: '#f4f4f5', borderColor: '#e9e9eb' }  // 회색
  };
  return styles[name] || styles['방문'];
};

onMounted(fetchData);
</script>

<style scoped>
/* ✅ CustomerListView.vue 스타일을 그대로 가져오고, 필요한 것만 추가 */

.page-container { padding: 20px; max-width: 1400px; margin: 0 auto; }

/* 헤더 */
.header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: 700; color: #333; margin: 0; }
.page-subtitle { margin: 6px 0 0; color: #6b7280; font-size: 13px; }
.title-area { display: flex; flex-direction: column; }

/* 검색 & 필터 영역 */
.search-area {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; padding: 20px; background: #fff; border-radius: 8px; border: 1px solid #eee;
}
.filter-wrapper { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

/* KPI 영역 */
.kpi-wrapper { display: flex; gap: 15px; margin-bottom: 20px; }
.kpi-box { flex: 1; background: #fff; padding: 24px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.kpi-title { font-size: 14px; color: #666; margin-bottom: 12px; display: block; font-weight: 500; }
.kpi-count { font-size: 28px; font-weight: 800; color: #333; }
.kpi-desc { display: block; margin-top: 8px; color:#9ca3af; font-size: 12px; }

.highlight { color: #16a34a; }

.kpi-item { flex: 1; text-align: center;}
.kpi-value { display: block; color: #000000; font-size: 24px; font-weight: 750;}
.kpi-label { font-size: 12px; color: #8a8a8a;}
.kpi-divider { width: 1px; height: 36px; background-color: #e5e7eb; margin: 0 12px;}

/* 테이블 영역 */
.table-card { border-radius: 8px; }
.pagination-wrapper { margin-top: 20px; display: flex; justify-content: center; }

.date-text { font-weight: 600; }
.sub-text { color:#9ca3af; font-size: 12px; margin-top: 2px; }
.kpi-dual { display: flex; align-items: center; justify-content: space-between; margin-top: 8px;}
</style>