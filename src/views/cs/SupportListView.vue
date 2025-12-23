<template>
  <div class="page-container" v-loading="loading">
    
    <div class="header-row">
      <h2 class="page-title">문의 관리</h2>
      <el-button type="primary" class="btn-register" @click="openCreateModal">
        <el-icon><Plus /></el-icon> 신규 문의 등록
      </el-button>
    </div>

    <div class="search-area card-box">
      <div class="filter-wrapper">
        <el-input 
          v-model="search.keyword" 
          placeholder="기업명, 제목, 내용 검색" 
          class="search-input"
          @keyup.enter="handleSearch"
          clearable
          style="width: 300px;"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <el-select 
          v-model="search.category" 
          placeholder="문의 카테고리" 
          style="width: 160px;"
          clearable
          @change="handleSearch"
        >
          <el-option label="가격 문의" :value="1" />
          <el-option label="제품 문의" :value="2" />
          <el-option label="계약 문의" :value="3" />
          <el-option label="기술 지원" :value="4" />
          <el-option label="서비스 만족" :value="5" />
          <el-option label="제품 불량" :value="6" />
          <el-option label="제품 품질" :value="7" />
          <el-option label="AS 지연" :value="8" />
          <el-option label="직원 응대" :value="9" />
          <el-option label="서비스 불만" :value="10" />
        </el-select>

        <el-select 
          v-model="search.status" 
          placeholder="진행 상태" 
          style="width: 120px;"
          clearable
          @change="handleSearch"
        >
          <el-option label="전체" value="" />
          <el-option label="진행 중" value="P" />
          <el-option label="처리 완료" value="C" />
        </el-select>

        <el-button type="primary" @click="handleSearch">검색</el-button>
        <el-button @click="resetSearch">초기화</el-button>
      </div>
    </div>

    <div class="kpi-wrapper">
      <div class="kpi-box">
        <span class="kpi-title">전체 문의</span>
        <span class="kpi-count">{{ kpi.total || 0 }}건</span>
      </div>
      <div class="kpi-box warning-box">
        <span class="kpi-title">처리 중</span>
        <span class="kpi-count warning">{{ kpi.processing || 0 }}건</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-title">해결율</span>
        <span class="kpi-count highlight">{{ kpi.resolutionRate || 0 }}%</span>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table 
        :data="supportList" 
        style="width: 100%" 
        v-loading="loading"
        @sort-change="handleSortChange"
      >
        <el-table-column 
          prop="customerSupportCode" 
          label="ID" 
          width="140" 
          align="center" 
          sortable="custom" 
        />
        
        <el-table-column 
            prop="createDate" 
            label="접수일" 
            width="120" 
            align="center" 
            :formatter="dateFormatter" 
        />

        <el-table-column prop="customerName" label="기업명" width="150" show-overflow-tooltip />
        
        <el-table-column prop="title" label="제목" min-width="150" show-overflow-tooltip />

        <el-table-column label="내용" min-width="200">
          <template #default="{ row }">
            <span class="truncated-text">{{ truncateText(row.content, 30) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="categoryName" label="카테고리" width="120" align="center" />
        
        <el-table-column prop="channelName" label="유입 채널" width="100" align="center" />
        
        <el-table-column prop="action" label="조치 사항" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.action">{{ row.action }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="상태" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '완료' || row.status === 'C' ? 'success' : 'warning'">
              {{ (row.status === '완료' || row.status === 'C') ? '완료' : '진행 중' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="관리" width="100" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="openDetailModal(row)">
              상세보기
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page.currentPage"
          v-model:page-size="page.pageSize"
          :total="page.totalCount"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="createModalVisible" title="새 문의 등록" width="600px" destroy-on-close>
      <el-form :model="createForm" label-width="100px" class="create-form">
        
        <el-form-item label="기업 선택" required>
          <el-select
            v-model="createForm.customerId"
            placeholder="기업명을 검색하세요"
            filterable
            remote
            :remote-method="searchCustomers"
            :loading="customerSearchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in customerOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="담당자">
              <el-input v-model="createForm.inCharge" placeholder="담당자 이름" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="연락처">
              <el-input v-model="createForm.phone" placeholder="010-0000-0000" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="이메일">
          <el-input v-model="createForm.email" placeholder="example@email.com" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="카테고리" required>
              <el-select v-model="createForm.categoryId" placeholder="선택" style="width: 100%">
                <el-option label="가격 문의" :value="1" />
                <el-option label="제품 문의" :value="2" />
                <el-option label="계약 문의" :value="3" />
                <el-option label="기술 지원" :value="4" />
                <el-option label="서비스 만족" :value="5" />
                <el-option label="제품 불량" :value="6" />
                <el-option label="제품 품질" :value="7" />
                <el-option label="AS 지연" :value="8" />
                <el-option label="직원 응대" :value="9" />
                <el-option label="서비스 불만" :value="10" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="유입 채널" required>
              <el-select v-model="createForm.channelId" placeholder="선택" style="width: 100%">
                <el-option label="전화" :value="1" />
                <el-option label="이메일" :value="2" />
                <el-option label="웹" :value="3" />
                <el-option label="SNS" :value="4" />
                <el-option label="방문" :value="5" />
                <el-option label="기타" :value="6" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="제목" required>
          <el-input v-model="createForm.title" placeholder="문의 제목을 입력하세요" />
        </el-form-item>

        <el-form-item label="내용" required>
          <el-input 
            v-model="createForm.content" 
            type="textarea" 
            :rows="5" 
            placeholder="상세 문의 내용을 입력하세요" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createModalVisible = false">취소</el-button>
        <el-button type="primary" @click="submitCreate">등록</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailModalVisible" title="문의 상세 정보" width="700px">
      <div v-if="selectedSupport">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="문의 번호">{{ selectedSupport.customerSupportCode }}</el-descriptions-item>
          <el-descriptions-item label="접수일">{{ formatDate(selectedSupport.createDate) }}</el-descriptions-item>
          <el-descriptions-item label="기업명">{{ selectedSupport.customerName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="담당자">{{ selectedSupport.empName || '미배정' }}</el-descriptions-item>
          <el-descriptions-item label="카테고리">{{ selectedSupport.categoryName }}</el-descriptions-item>
          <el-descriptions-item label="채널">{{ selectedSupport.channelName }}</el-descriptions-item>
          <el-descriptions-item label="제목" :span="2">{{ selectedSupport.title }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-content-box mt-4">
          <p class="label">문의 내용</p>
          <div class="content-text">{{ selectedSupport.content }}</div>
        </div>

        <div class="detail-content-box mt-4 bg-gray">
          <p class="label">조치 결과</p>
          <div class="content-text">
            {{ selectedSupport.action || '아직 조치 내용이 등록되지 않았습니다.' }}
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailModalVisible = false">닫기</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { Search, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getSupportList, getSupportKpi, createSupport } from '@/api/customersupport';
import { getCustomerList } from '@/api/customerlist'; 

// 상태 변수들
const loading = ref(false);
const supportList = ref([]);
const kpi = ref({ total: 0, processing: 0, resolutionRate: 0 });
const customerSearchLoading = ref(false);
const customerOptions = ref([]); 

// 검색 조건
const search = reactive({
  keyword: '',
  category: '',
  status: '' 
});

// 페이지네이션
const page = reactive({
  currentPage: 1,
  pageSize: 10,
  totalCount: 0
});

// 정렬 상태
const sortState = reactive({
  sortBy: 'id',
  sortOrder: 'desc'
});

// 모달 상태
const createModalVisible = ref(false);
const detailModalVisible = ref(false);
const selectedSupport = ref(null);

// 등록 폼 데이터
const createForm = reactive({
  customerId: null,
  inCharge: '',
  phone: '',
  email: '',
  categoryId: null,
  channelId: null,
  title: '',
  content: ''
});

// --- 메서드 ---

const fetchData = async () => {
  loading.value = true;
  try {
    // KPI 조회
    const kpiRes = await getSupportKpi();
    if(kpiRes.data) {
        kpi.value = kpiRes.data;
    }

    // 목록 조회 파라미터
    const params = {
      page: page.currentPage,
      amount: page.pageSize, // [수정 3] 파라미터명 amount로 통일
      keyword: search.keyword,
      category: search.category || null,
      status: search.status || null,
      sortBy: sortState.sortBy,
      sortOrder: sortState.sortOrder
    };

    const res = await getSupportList(params);
    
    // [수정 3] 데이터 바인딩 로직 개선 (CustomerList 방식과 통일)
    // res.data.data -> res.data.contents (백엔드 DTO 확인 필요, CustomerList와 같다면 contents)
    // 안전하게 처리하기 위해 contents가 없으면 data를 체크하거나 빈 배열 할당
    if (res.data) {
        // 백엔드 응답이 contents 필드를 쓴다면 contents, 아니면 data
        supportList.value = res.data.contents || res.data.data || []; 
        page.totalCount = res.data.totalCount || (res.data.pageInfo ? res.data.pageInfo.total : 0);
    }

  } catch (error) {
    console.error('Fetch Error:', error);
    ElMessage.error('데이터를 불러오는데 실패했습니다.');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.currentPage = 1;
  fetchData();
};

const resetSearch = () => {
  search.keyword = '';
  search.category = '';
  search.status = '';
  handleSearch();
};

const handleSortChange = ({ prop, order }) => {
  if (prop === 'id') {
    sortState.sortBy = 'id';
    sortState.sortOrder = order === 'ascending' ? 'asc' : 'desc';
    fetchData();
  }
};

const handlePageChange = (val) => {
  page.currentPage = val;
  fetchData();
};
const handleSizeChange = (val) => {
  page.pageSize = val;
  page.currentPage = 1;
  fetchData();
};

const searchCustomers = async (query) => {
  if (query) {
    customerSearchLoading.value = true;
    try {
      const res = await getCustomerList({ name: query, amount: 10 });
      if (res.data && res.data.contents) {
        customerOptions.value = res.data.contents;
      } else {
        customerOptions.value = [];
      }
    } catch (e) {
      console.error(e);
    } finally {
      customerSearchLoading.value = false;
    }
  } else {
    customerOptions.value = [];
  }
};

const openCreateModal = () => {
  // 폼 초기화
  Object.keys(createForm).forEach(key => createForm[key] = null);
  createForm.inCharge = '';
  createForm.title = '';
  createForm.content = '';
  
  createModalVisible.value = true;
  searchCustomers(''); 
};

const openDetailModal = (row) => {
  selectedSupport.value = row;
  detailModalVisible.value = true;
};

const submitCreate = async () => {
  if (!createForm.customerId || !createForm.title || !createForm.content) {
    ElMessage.warning('기업, 제목, 내용은 필수 입력 항목입니다.');
    return;
  }
  try {
    await createSupport(createForm);
    ElMessage.success('문의가 성공적으로 등록되었습니다.');
    createModalVisible.value = false;
    fetchData(); 
  } catch (e) {
    // 404 오류가 발생한다면 백엔드 Controller에 @PostMapping이 없는 것입니다.
    ElMessage.error('등록 실패: ' + (e.response?.data?.message || e.message));
  }
};

const truncateText = (text, length) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '....' : text;
};
const formatDate = (d) => d ? d.substring(0, 10) : '-';
const dateFormatter = (row, col, val) => formatDate(val);

onMounted(fetchData);
</script>

<style scoped>
.page-container { padding: 20px; max-width: 1400px; margin: 0 auto; }

/* 헤더 */
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: 700; color: #333; margin: 0; }

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

.highlight { color: #f59e0b; } 
.warning { color: #ef4444; } 
.warning-box { background-color: #fef2f2; border-color: #fee2e2; }

/* 테이블 영역 */
.table-card { border-radius: 8px; }
.pagination-wrapper { margin-top: 20px; display: flex; justify-content: center; }

.truncated-text { color: #606266; font-size: 13px; }
.text-gray { color: #ccc; }

/* 모달 스타일 */
.create-form .el-select { width: 100%; }
.detail-content-box { padding: 15px; background: #f5f7fa; border-radius: 4px; border: 1px solid #e4e7ed; }
.detail-content-box.bg-gray { background: #fafafa; }
.detail-content-box .label { font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #303133; }
.detail-content-box .content-text { font-size: 14px; color: #606266; line-height: 1.6; white-space: pre-wrap; }
.mt-4 { margin-top: 16px; }
</style>