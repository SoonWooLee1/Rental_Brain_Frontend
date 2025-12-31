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
        
        <el-table-column prop="customerName" label="기업명" width="150" show-overflow-tooltip />
        <el-table-column prop="title" label="제목" min-width="150" show-overflow-tooltip />

        <el-table-column label="내용" min-width="200">
          <template #default="{ row }">
            <span class="truncated-text">{{ truncateText(row.content, 30) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="categoryName" label="카테고리" width="120" align="center" />
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

    <el-dialog v-model="createModalVisible" :title="isEditMode ? '문의 내역 수정' : '새 문의 등록'" width="600px" destroy-on-close>
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
            :disabled="isEditMode" 
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
            <el-form-item label="담당자" required>
              <el-select 
                v-model="createForm.empId" 
                placeholder="담당자를 선택하세요" 
                filterable 
                style="width: 100%"
              >
                <el-option
                  v-for="emp in inChargeList"
                  :key="emp.id"
                  :label="emp.name"
                  :value="emp.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="카테고리" required>
              <el-select v-model="createForm.categoryId" placeholder="선택" style="width: 100%">
                <el-option label="가격 문의" :value="1" />
                <el-option label="제품 문의" :value="2" />
                <el-option label="계약 문의" :value="3" />
                <el-option label="기술 지원" :value="4" />
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
        <el-form-item label="조치사항" v-if="isEditMode">
          <el-input 
            v-model="createForm.action" 
            type="textarea" 
            :rows="3" 
            placeholder="조치 내용을 입력하세요" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createModalVisible = false">취소</el-button>
        <el-button type="primary" @click="submitCreate">
             {{ isEditMode ? '수정' : '등록' }}
        </el-button>
      </template>
    </el-dialog>

    

  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { Search, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getSupportList, getSupportKpi, createSupport, updateSupport, deleteSupport, getInChargeList } from '@/api/customersupport';
import { getCustomerList } from '@/api/customerlist'; 
import { useRouter } from 'vue-router'; // 추가
const router = useRouter(); // 추가

// 상태 변수들
const loading = ref(false);
const supportList = ref([]);
const kpi = ref({ total: 0, processing: 0, resolutionRate: 0 });
const customerSearchLoading = ref(false);
const customerOptions = ref([]); 
const inChargeList = ref([]); 

// 수정 모드 상태
const isEditMode = ref(false);

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

// 등록/수정 폼 데이터
const createForm = reactive({
  customerId: null,
  empId: null, 
  phone: '',
  email: '',
  categoryId: null,
  channelId: null,
  title: '',
  content: ''
});

// --- 메서드 ---

const fetchInChargeList = async () => {
  try {
    const res = await getInChargeList();
    if (res.data) {
        inChargeList.value = res.data;
    }
  } catch (error) {
    console.error('담당자 목록 로드 실패:', error);
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const kpiRes = await getSupportKpi();
    if(kpiRes.data) kpi.value = kpiRes.data;

    const params = {
      page: page.currentPage,
      amount: page.pageSize, 
      keyword: search.keyword,
      category: search.category || null,
      status: search.status || null,
      sortBy: sortState.sortBy,
      sortOrder: sortState.sortOrder
    };

    const res = await getSupportList(params);
    
    if (res.data) {
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
  if (!order) {
    sortState.sortBy = 'id';
    sortState.sortOrder = 'desc';
  } else {
    if (prop === 'customerSupportCode') {
      sortState.sortBy = 'id'; 
    } else {
      sortState.sortBy = prop;
    }
    sortState.sortOrder = order === 'ascending' ? 'asc' : 'desc';
  }
  fetchData();
};

const handlePageChange = (val) => {
  page.currentPage = val;
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
  isEditMode.value = false;
  Object.keys(createForm).forEach(key => createForm[key] = null);
  createForm.title = '';
  createForm.content = '';
  createForm.phone = '';
  createForm.email = '';
  createForm.empId = null;
  
  createModalVisible.value = true;
  searchCustomers(''); 
};

// [변경] 상세 페이지 이동
const openDetailModal = (row) => {
  router.push(`/cs/supports/${row.id}`); // 또는 row.customerSupportCode 등 ID 필드 사용
};

const handleComplete = async () => {
    try {
        await updateSupport(selectedSupport.value.id, { status: 'C' });
        ElMessage.success('문의가 완료 처리되었습니다.');
        fetchData();
    } catch (e) {
        ElMessage.error('처리 실패: ' + e.message);
    }
};

const handleReopen = async () => {
    try {
        await updateSupport(selectedSupport.value.id, { status: 'P' });
        ElMessage.success('상태가 진행 중으로 변경되었습니다.');
        fetchData();
    } catch (e) {
        ElMessage.error('상태 변경 실패: ' + e.message);
    }
};

const openEditModal = () => {
    isEditMode.value = true;
    const item = selectedSupport.value;
    
    Object.assign(createForm, {
        customerId: null,
        empId: item.empId || null,
        phone: item.phone || '',
        email: item.email || '',
        categoryId: getCategoryIdByName(item.categoryName),
        channelId: getChannelIdByName(item.channelName),
        title: item.title,
        content: item.content,
        action: item.action,
    });
    
    if(item.customerName) {
        customerOptions.value = [{ id: item.cum_id || 0, name: item.customerName }]; 
        createForm.customerId = item.cum_id || 0; 
    }

    detailModalVisible.value = false;
    createModalVisible.value = true;
};

const getCategoryIdByName = (name) => {
    const map = { '가격 문의': 1, '제품 문의': 2, '계약 문의': 3, '기술 지원': 4, '서비스 만족': 5, '제품 불량': 6, '제품 품질': 7, 'AS 지연': 8, '직원 응대': 9, '서비스 불만': 10 };
    return map[name] || null;
};
const getChannelIdByName = (name) => {
    const map = { '전화': 1, '이메일': 2, '웹(채팅, 게시판)': 3, 'SNS': 4, '방문': 5, '기타': 6 };
    return map[name] || null;
}

const submitCreate = async () => {
  if (!createForm.title || !createForm.content) {
    ElMessage.warning('제목과 내용은 필수입니다.');
    return;
  }

  try {
    if (isEditMode.value) {
        await updateSupport(selectedSupport.value.id, createForm);
        ElMessage.success('수정되었습니다.');
    } else {
        await createSupport(createForm);
        ElMessage.success('등록되었습니다.');
    }
    createModalVisible.value = false;
    fetchData(); 
  } catch (e) {
    ElMessage.error('처리 실패: ' + (e.response?.data?.message || e.message));
  }
};

const handleDelete = async () => {
    if (!selectedSupport.value) return;
    ElMessageBox.confirm('정말 삭제하시겠습니까?', '경고', { type: 'warning' })
    .then(async () => {
        try {
            await deleteSupport(selectedSupport.value.id);
            ElMessage.success('삭제되었습니다.');
            detailModalVisible.value = false;
            fetchData();
        } catch(e) {
            ElMessage.error('삭제 실패');
        }
    });
};

const truncateText = (text, length) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '....' : text;
};

// [추가] 날짜 포맷 변환 함수 (T 제거)
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  return dateStr.replace('T', ' ');
};

onMounted(() => {
    fetchData();
    fetchInChargeList();
});
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

/* 다이얼로그 푸터 버튼 좌우 정렬 */
.dialog-footer-left { margin-right: auto; }
.dialog-footer-right { display: flex; gap: 10px; }
:deep(.el-dialog__footer) { display: flex; justify-content: space-between; }
</style>