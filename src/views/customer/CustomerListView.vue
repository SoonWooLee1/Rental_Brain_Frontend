<template>
  <div class="page-container">
    
    <div class="header-row">
      <h2 class="page-title">고객 목록</h2>
      <el-button type="primary" class="btn-register" @click="showRegisterModal = true">
        <el-icon><Plus /></el-icon> 신규 기업 등록
      </el-button>
    </div>

    <div class="search-area card-box">
      <div class="filter-wrapper">
        <el-input 
          v-model="searchKeyword" 
          placeholder="고객 회사명 또는 담당자명 검색" 
          class="search-input"
          @keyup.enter="handleSearch"
          clearable
          style="width: 300px;"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <el-select
          v-model="selectedSegments"
          multiple
          collapse-tags
          placeholder="세그먼트 필터"
          style="width: 240px;"
          @change="handleSearch"
        >
          <el-option label="잠재 고객" value="잠재 고객" />
          <el-option label="신규 고객" value="신규 고객" />
          <el-option label="일반 고객" value="일반 고객" />
          <el-option label="VIP 고객" value="VIP 고객" />
          <el-option label="이탈 위험 고객" value="이탈 위험 고객" />
          <el-option label="블랙리스트 고객" value="블랙리스트 고객" />
          <el-option label="확장 의사 고객" value="확장 의사 고객 (기회 고객)" />
        </el-select>

        <el-select 
          v-model="selectedStatus" 
          placeholder="상태 필터" 
          style="width: 120px;"
          @change="handleSearch"
        >
          <el-option label="전체" value="ALL" />
          <el-option label="활성" value="ACTIVE" />
          <el-option label="비활성" value="INACTIVE" />
        </el-select>

        <el-button type="primary" @click="handleSearch">검색</el-button>
        <el-button @click="resetSearch">초기화</el-button>
      </div>

      <el-button class="btn-guide" @click="showSegmentGuideModal = true">
        <el-icon><InfoFilled /></el-icon> 세그먼트 기준표
      </el-button>
    </div>

    <div class="kpi-wrapper">
      <div class="kpi-box">
        <span class="kpi-title">총 거래 기업</span>
        <span class="kpi-count">{{ kpiData.totalCustomers?.toLocaleString() || 0 }}개사</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-title">VIP 고객</span>
        <span class="kpi-count highlight">{{ kpiData.vipCustomers?.toLocaleString() || 0 }}개사</span>
      </div>
      <div class="kpi-box warning-box">
        <span class="kpi-title">이탈 위험</span>
        <span class="kpi-count warning">{{ kpiData.riskCustomers?.toLocaleString() || 0 }}개사</span>
      </div>
      <div class="kpi-box danger-box">
        <span class="kpi-title">블랙리스트</span>
        <span class="kpi-count danger">{{ kpiData.blacklistCustomers?.toLocaleString() || 0 }}개사</span>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table 
        :data="customerList" 
        style="width: 100%" 
        v-loading="loading"
        @sort-change="handleSortChange"
      >
        <el-table-column 
            prop="customerCode" 
            label="ID" 
            width="120" 
            align="center" 
            sortable="custom" 
        />

        <el-table-column prop="name" label="기업명" min-width="140" show-overflow-tooltip />
        <el-table-column prop="inCharge" label="담당자" width="100" align="center" />
        <el-table-column label="부서/직책" width="140" align="center">
          <template #default="{ row }">
            {{ row.dept || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="전화번호" width="140" align="center">
          <template #default="{ row }">{{ formatPhone(row.callNum) }}</template>
        </el-table-column>
        <el-table-column label="첫 계약일" width="120" align="center">
          <template #default="{ row }">{{ row.firstContractDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="세그먼트" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getSegmentColor(row.segmentName)" size="small" effect="dark">
              {{ formatSegmentName(row.segmentName) }}
            </el-tag>
          </template>
        </el-table-column>
      <el-table-column label="총 거래액" width="130" align="right">
        <template #default="{ row }">
          {{ formatMoneyMan(row.totalTransactionAmount) }} <!-- 새 금액 표시 포맷 --> 
        </template>
      </el-table-column>
        <el-table-column prop="contractCount" label="계약 수" width="80" align="center" />
        <el-table-column label="관리" width="100" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="goDetail(row.id)">상세보기</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-wrapper">
         <el-pagination
            layout="prev, pager, next"
            :total="totalCount"
            :page-size="pageSize"
            v-model:current-page="currentPage"
            @current-change="handlePageChange"
          />
      </div>
    </el-card>

    <el-dialog v-model="showRegisterModal" title="신규 기업 등록" width="600px">
      <el-form :model="regForm" label-width="100px">
        <el-form-item label="기업명" required><el-input v-model="regForm.name" placeholder="예: (주)렌탈브레인" /></el-form-item>
        <el-form-item label="사업자번호"><el-input v-model="regForm.businessNum" placeholder="예: 123-45-67890 (숫자만 입력)" /></el-form-item>
        <el-form-item label="전화번호"><el-input v-model="regForm.callNum" placeholder="예: 02-1234-5678" /></el-form-item>
        <el-form-item label="담당자"><el-input v-model="regForm.inCharge" placeholder="예: 홍길동" /></el-form-item>
        <el-form-item label="부서/직책"><el-input v-model="regForm.dept" placeholder="예: 경영지원팀 / 과장" /></el-form-item>
        <el-form-item label="휴대폰"><el-input v-model="regForm.phone" placeholder="예: 010-1234-5678" /></el-form-item>
        <el-form-item label="이메일"><el-input v-model="regForm.email" placeholder="예: email@company.com" /></el-form-item>
        <el-form-item label="주소"><el-input v-model="regForm.addr" placeholder="예: 서울특별시 강남구..." /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRegisterModal = false">취소</el-button>
        <el-button type="primary" @click="handleRegister">등록</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showSegmentGuideModal" title="고객 세그먼트 기준표" width="600px">
      <div class="segment-guide-content">
        <el-table :data="segmentGuideData" border style="width: 100%">
          <el-table-column prop="grade" label="등급" width="120" align="center">
             <template #default="{row}">
                <el-tag :type="getSegmentColor(row.grade)">{{ row.grade }}</el-tag>
             </template>
          </el-table-column>
          <el-table-column prop="criteria" label="선정 기준" />
        </el-table>
        </div>
      <template #footer>
        <el-button @click="showSegmentGuideModal = false">닫기</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCustomerList, getCustomerKpi, createCustomer } from '@/api/customerlist';
import { ElMessage } from 'element-plus';
import { Search, Plus, InfoFilled } from '@element-plus/icons-vue';

const router = useRouter();

// 상태 변수
const kpiData = ref({});
const customerList = ref([]);
const loading = ref(false);
const totalCount = ref(0);
const pageSize = ref(10);
const currentPage = ref(1);

// 검색 및 필터
const searchKeyword = ref('');
const selectedSegments = ref([]); 
const selectedStatus = ref('ACTIVE');

// [추가] 정렬 상태
const sortState = ref({
  sortBy: 'id',
  sortOrder: 'desc'
});

// 모달 상태
const showRegisterModal = ref(false);
const showSegmentGuideModal = ref(false);
const regForm = ref({});

const segmentGuideData = [
  { grade: 'VIP 고객', criteria: '연간 거래액 1억원 이상 또는 계약 건수 10건 이상' },
  { grade: '일반 고객', criteria: '최근 1년 내 거래 이력이 있는 고객' },
  { grade: '신규 고객', criteria: '최초 계약일로부터 3개월 이내 고객' },
  { grade: '이탈 위험 고객', criteria: '최근 6개월간 거래가 없거나 문의 감소' },
  { grade: '블랙리스트 고객', criteria: '미수금 발생 또는 악성 민원 제기' },
  { grade: '잠재 고객', criteria: '견적 문의 단계의 가망 고객' },
  { grade: '확장 의사 고객', criteria: '업셀링 대상, 결합 고객, 재계약 고객 포함' },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const kpiRes = await getCustomerKpi();
    if(kpiRes.data) kpiData.value = kpiRes.data;
    
    // [수정] 정렬 파라미터(sortBy, sortOrder) 추가
    const listRes = await getCustomerList({
        pageNum: currentPage.value, 
        amount: pageSize.value,
        name: searchKeyword.value,
        segments: selectedSegments.value, 
        status: selectedStatus.value,
        sortBy: sortState.value.sortBy,      // 추가
        sortOrder: sortState.value.sortOrder // 추가
    });

    // 백엔드 응답 구조에 따라 데이터 바인딩 (PageResponseDTO 기준)
    if(listRes.data) {
        // 백엔드가 contents를 쓰는지 data를 쓰는지 확인 (이전 코드 기반 contents 유지)
        customerList.value = listRes.data.contents || listRes.data.data || [];
        // totalCount 위치 확인
        if (listRes.data.pageInfo) {
             totalCount.value = listRes.data.pageInfo.total;
        } else {
             totalCount.value = listRes.data.totalCount || 0;
        }
    }
  } catch (e) {
    console.error(e);
    ElMessage.error('데이터를 불러오는데 실패했습니다.');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
    currentPage.value = 1;
    fetchData();
};

// [추가] 초기화 함수
const resetSearch = () => {
    searchKeyword.value = '';
    selectedSegments.value = [];
    selectedStatus.value = 'ACTIVE';
    currentPage.value = 1;
    
    // 정렬 초기화 (선택 사항)
    sortState.value.sortBy = 'id';
    sortState.value.sortOrder = 'desc';
    
    fetchData();
};

// [수정] 정렬 핸들러
const handleSortChange = ({ prop, order }) => {
    // 테이블의 prop="customerCode"를 백엔드가 아는 "id"로 변환
    if (prop === 'customerCode') { 
        sortState.value.sortBy = 'id';
        sortState.value.sortOrder = order === 'ascending' ? 'asc' : 'desc';
        fetchData(); // 데이터 재요청
    }
};

const handlePageChange = (page) => {
    currentPage.value = page;
    fetchData();
};

const handleRegister = async () => {
  const payload = { ...regForm.value };
  ['businessNum', 'callNum', 'phone'].forEach(k => {
    if(payload[k]) payload[k] = payload[k].replace(/-/g, '');
  });
  
  try {
    await createCustomer(payload);
    ElMessage.success('신규 기업이 등록되었습니다.');
    showRegisterModal.value = false;
    regForm.value = {}; 
    fetchData(); 
  } catch(e) { 
    ElMessage.error('등록 실패: ' + e.message); 
  }
};

const goDetail = (id) => router.push(`/customers/${id}`);
const formatPhone = (v) => v ? v.replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3") : '-';
const formatSegmentName = (name) => {
    if(!name) return '일반';
    return name.replace(' (기회 고객)', ''); 
}
const getSegmentColor = (s) => {
    if(!s) return '';
    if(s.includes('VIP')) return 'warning';
    if(s.includes('이탈')) return 'danger';
    if(s.includes('블랙')) return 'info';
    if(s.includes('신규')) return 'success';
    if(s.includes('확장')) return 'primary';
    return ''; 
};

/* 금액 포맷
 * 5,320,000   -> 532만원
 * 150,000,000 -> 1억 5000만원
 * 1,000,000,000 -> 10억
 */
const formatMoneyMan = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return '-'

  const EOK = 100_000_000   // 1억
  const MAN = 10_000        // 1만원

  const eok = Math.floor(n / EOK)
  const rest = n % EOK
  const man = Math.floor(rest / MAN)

  if (eok > 0 && man > 0) {
    return `${eok}억 ${man}만원`
  }

  if (eok > 0 && man === 0) {
    return `${eok}억`
  }

  return `${man}만원`
}

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
.danger { color: #374151; }
.warning-box { background-color: #fef2f2; border-color: #fee2e2; }
.danger-box { background-color: #f3f4f6; border-color: #e5e7eb; }

/* 테이블 영역 */
.table-card { border-radius: 8px; }
.pagination-wrapper { margin-top: 20px; display: flex; justify-content: center; }
</style>