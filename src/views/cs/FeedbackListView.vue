<template>
  <div class="page-container" v-loading="loading">
    
    <div class="header-row">
      <h2 class="page-title">피드백 관리</h2>
      <el-tooltip v-if="!canCreateFeedBack" content="신규 피드백 등록 권한이 없습니다" placement="bottom">
        <span>
          <el-button type="primary" class="btn-register" :disabled="true">
            <el-icon>
              <Plus />
            </el-icon> 신규 피드백 등록
          </el-button>
        </span>
      </el-tooltip>

      <el-button v-else type="primary" class="btn-register" @click="openCreateModal">
        <el-icon>
          <Plus />
        </el-icon> 신규 피드백 등록
      </el-button>
      <!-- <el-button type="primary" class="btn-register" @click="openCreateModal">
        <el-icon><Plus /></el-icon> 신규 피드백 등록
      </el-button> -->
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
          placeholder="카테고리" 
          style="width: 140px;"
          clearable
          @change="handleSearch"
        >
          <el-option label="서비스 만족" :value="5" />
          <el-option label="제품 불량" :value="6" />
          <el-option label="제품 품질" :value="7" />
          <el-option label="AS 관련" :value="8" />
        </el-select>

        <el-select 
          v-model="search.star" 
          placeholder="별점" 
          style="width: 150px;"
          class="star-filter" 
          clearable
          @change="handleSearch"
        >
          <el-option label="★★★★★ (5점)" :value="5">
            <span style="color: #ff9900; font-weight: bold;">★★★★★</span>
            <span style="color: #888; font-size: 12px; margin-left: 8px;">5점</span>
          </el-option>
          <el-option label="★★★★ (4점)" :value="4">
            <span style="color: #ff9900; font-weight: bold;">★★★★</span>
            <span style="color: #888; font-size: 12px; margin-left: 8px;">4점</span>
          </el-option>
          <el-option label="★★★ (3점)" :value="3">
            <span style="color: #ff9900; font-weight: bold;">★★★</span>
            <span style="color: #888; font-size: 12px; margin-left: 8px;">3점</span>
          </el-option>
          <el-option label="★★ (2점)" :value="2">
            <span style="color: #ff9900; font-weight: bold;">★★</span>
            <span style="color: #888; font-size: 12px; margin-left: 8px;">2점</span>
          </el-option>
          <el-option label="★ (1점)" :value="1">
            <span style="color: #ff9900; font-weight: bold;">★</span>
            <span style="color: #888; font-size: 12px; margin-left: 8px;">1점</span>
          </el-option>
        </el-select>

        <el-select 
          v-model="search.status" 
          placeholder="조치 여부" 
          style="width: 120px;"
          clearable
          @change="handleSearch"
        >
          <el-option label="전체" value="" />
          <el-option label="미조치" value="P" />
          <el-option label="조치 완료" value="C" />
        </el-select>

        <el-button type="primary" @click="handleSearch">검색</el-button>
        <el-button @click="resetSearch">초기화</el-button>
      </div>
    </div>

    <div class="kpi-wrapper">
      <div class="kpi-box">
        <span class="kpi-title">전체 피드백</span>
        <span class="kpi-count">{{ kpi.total || 0 }}건</span>
      </div>
      <div class="kpi-box warning-box">
        <span class="kpi-title">불만 접수 (2점 이하)</span>
        <span class="kpi-count warning">{{ kpi.complaints || 0 }}건</span>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table 
        :data="feedbackList" 
        style="width: 100%" 
        v-loading="loading"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="feedbackCode" label="ID" width="140" align="center" sortable="custom" />
        <el-table-column prop="customerName" label="기업명" width="150" show-overflow-tooltip />
        <el-table-column prop="categoryName" label="카테고리" width="120" align="center" />
        
        <el-table-column label="평점" width="150" align="center" prop="star" sortable="custom">
          <template #default="{ row }">
            <el-rate
              v-model="row.star"
              disabled
              text-color="#ff9900"
            />
          </template>
        </el-table-column>

        <el-table-column prop="title" label="제목" min-width="150" show-overflow-tooltip />
        
        <el-table-column label="내용" min-width="200">
          <template #default="{ row }">
            <span class="truncated-text">{{ truncateText(row.content, 30) }}</span>
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

    <el-dialog 
      v-model="createModalVisible" 
      :title="isEditMode ? '피드백 수정' : '새 피드백 등록'" 
      width="600px" 
      destroy-on-close
    >
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
          <el-col :span="12">
            <el-form-item label="평점" required>
               <el-rate v-model="createForm.star" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="카테고리" required>
              <el-select v-model="createForm.categoryId" placeholder="선택" style="width: 100%">
                  <el-option label="서비스 만족" :value="5" />
                  <el-option label="제품 불량" :value="6" />
                  <el-option label="제품 품질" :value="7" />
                  <el-option label="AS 관련" :value="8" />
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
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="제목" required>
          <el-input v-model="createForm.title" placeholder="피드백 제목" />
        </el-form-item>

        <el-form-item label="내용" required>
          <el-input 
            v-model="createForm.content" 
            type="textarea" 
            :rows="5" 
            placeholder="상세 내용 입력" 
          />
        </el-form-item>
        
        <el-form-item label="조치사항" v-if="isEditMode">
          <el-input 
            v-model="createForm.action" 
            type="textarea" 
            :rows="3" 
            placeholder="조치 내용 입력 (비워두면 미조치 상태)" 
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
import { ref, onMounted, reactive, computed } from 'vue';

import { useRouter } from 'vue-router'; 

import { Search, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getFeedbackList, getFeedbackKpi, createFeedback, updateFeedback, deleteFeedback } from '@/api/feedback';
import { getCustomerList } from '@/api/customerlist'; 
import { getInChargeList } from '@/api/customersupport';
import { useAuthStore } from '@/store/auth.store';


const router = useRouter();

const loading = ref(false);
const feedbackList = ref([]);
const kpi = ref({ total: 0, complaints: 0 });
const customerSearchLoading = ref(false);
const customerOptions = ref([]); 
const inChargeList = ref([]); 
const authStore = useAuthStore();

const isEditMode = ref(false);

// [수정] 검색 상태에 star 추가 (필터 작동 핵심)
const search = reactive({
  keyword: '',
  category: '',
  status: '',
  star: '' 
});

const page = reactive({
  currentPage: 1,
  pageSize: 10,
  totalCount: 0
});

const sortState = reactive({
  sortBy: 'id',
  sortOrder: 'desc'
});

const createModalVisible = ref(false);

const createForm = reactive({
  customerId: null,
  empId: null,
  categoryId: null,
  channelId: null,
  star: 5,
  title: '',
  content: '',
  action: '' 
});

// 권한 접근 제한
const canCreateFeedBack = computed(() =>
  authStore.hasAuth("CS_PROCESS")
);

// --- 메서드 ---

const fetchInChargeList = async () => {
  try {
    const res = await getInChargeList();
    if (res.data) inChargeList.value = res.data;
  } catch (error) {
    console.error('담당자 목록 로드 실패:', error);
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const kpiRes = await getFeedbackKpi();
    if(kpiRes.data) kpi.value = kpiRes.data;

    // [수정] params에 star 파라미터 전송 (백엔드로 값 전달)
    const params = {
      page: page.currentPage,
      amount: page.pageSize, 
      keyword: search.keyword,
      category: search.category || null,
      status: search.status || null,
      star: search.star ? Number(search.star) : null,
      sortBy: sortState.sortBy,
      sortOrder: sortState.sortOrder
    };

    console.log('검색 요청 파라미터:', params);

    const res = await getFeedbackList(params);
    
    if (res.data) {
        feedbackList.value = res.data.contents || res.data.data || []; 
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
  search.star = ''; // [수정] 초기화 시 별점도 초기화
  handleSearch();
};

const handleSortChange = ({ prop, order }) => {
  if (!order) {
    sortState.sortBy = 'id';
    sortState.sortOrder = 'desc';
  } else {
    if (prop === 'feedbackCode') {
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
  createForm.star = 5;
  createForm.action = '';
  createModalVisible.value = true;
  searchCustomers(''); 
};

const openDetailModal = (row) => {
  router.push(`/cs/feedbacks/${row.id}`);
};

const openEditModal = () => {
    isEditMode.value = true;
    const item = selectedFeedback.value;
    Object.assign(createForm, {
        customerId: item.cumId, 
        empId: item.empId,
        categoryId: item.categoryId, 
        channelId: item.channelId,
        star: item.star,
        title: item.title,
        content: item.content,
        action: item.action,
    });
    if(item.customerName) {
        customerOptions.value = [{ id: item.cumId || 0, name: item.customerName }]; 
    }
    detailModalVisible.value = false;
    createModalVisible.value = true;
};

const submitCreate = async () => {
  if (!createForm.title || !createForm.content) {
    ElMessage.warning('제목과 내용은 필수입니다.');
    return;
  }
  const payload = { ...createForm, cumId: createForm.customerId };
  try {
    if (isEditMode.value) {
        await updateFeedback(selectedFeedback.value.id, payload);
        ElMessage.success('수정되었습니다.');
    } else {
        await createFeedback(payload);
        ElMessage.success('등록되었습니다.');
    }
    createModalVisible.value = false;
    fetchData(); 
  } catch (e) {
    ElMessage.error('처리 실패: ' + (e.response?.data?.message || e.message));
  }
};

const handleDelete = async () => {
    if (!selectedFeedback.value) return;
    ElMessageBox.confirm('정말 삭제하시겠습니까?', '경고', { type: 'warning' })
    .then(async () => {
        try {
            await deleteFeedback(selectedFeedback.value.id);
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

onMounted(() => {
    fetchData();
    fetchInChargeList();
});
</script>

<style scoped>
.page-container { padding: 20px; max-width: 1400px; margin: 0 auto; }

.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: 700; color: #333; margin: 0; }

.search-area { 
    display: flex; justify-content: space-between; align-items: center; 
    margin-bottom: 20px; padding: 20px; background: #fff; border-radius: 8px; border: 1px solid #eee;
}
.filter-wrapper { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

.kpi-wrapper { display: flex; gap: 15px; margin-bottom: 20px; }
.kpi-box { flex: 1; background: #fff; padding: 24px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.kpi-title { font-size: 14px; color: #666; margin-bottom: 12px; display: block; font-weight: 500; }
.kpi-count { font-size: 28px; font-weight: 800; color: #333; }

.warning { color: #ef4444; } 
.warning-box { background-color: #fef2f2; border-color: #fee2e2; }

.table-card { border-radius: 8px; }
.pagination-wrapper { margin-top: 20px; display: flex; justify-content: center; }

.truncated-text { color: #606266; font-size: 13px; }
.text-gray { color: #ccc; }
.action-text { color: #333; }

.create-form .el-select { width: 100%; }
.detail-content-box { padding: 15px; background: #f5f7fa; border-radius: 4px; border: 1px solid #e4e7ed; }
.detail-content-box.bg-gray { background: #fafafa; }
.detail-content-box .label { font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #303133; }
.detail-content-box .content-text { font-size: 14px; color: #606266; line-height: 1.6; white-space: pre-wrap; }
.mt-4 { margin-top: 16px; }

.dialog-footer-left { margin-right: auto; }
.dialog-footer-right { display: flex; gap: 10px; }
:deep(.el-dialog__footer) { display: flex; justify-content: space-between; }

.star-filter {
  /* Element Plus 입력창 텍스트 색상 변수를 황금색으로 변경 */
  --el-input-text-color: #ff9900 !important;
  font-weight: bold;
}

:deep(.star-filter .el-input__inner::placeholder) {
  color: #a8abb2 !important;
  -webkit-text-fill-color: #a8abb2 !important; /* Safari/Chrome 호환성 */
  font-weight: normal;
}

:deep(.star-filter .el-input__inner) {
    color: #ff9900 !important;
    -webkit-text-fill-color: #ff9900 !important; 
}
</style>