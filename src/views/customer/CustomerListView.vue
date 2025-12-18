<template>
  <div class="page-container">
    <div class="kpi-wrapper">
      <div class="kpi-box">
        <span class="kpi-title">총 거래 고객</span>
        <span class="kpi-count">{{ kpiData.totalCustomers?.toLocaleString() || 0 }}명</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-title">VIP 고객</span>
        <span class="kpi-count highlight">{{ kpiData.vipCustomers?.toLocaleString() || 0 }}명</span>
      </div>
      <div class="kpi-box warning-box">
        <span class="kpi-title">이탈 위험</span>
        <span class="kpi-count warning">{{ kpiData.riskCustomers?.toLocaleString() || 0 }}명</span>
      </div>
      <div class="kpi-box danger-box">
        <span class="kpi-title">블랙리스트</span>
        <span class="kpi-count danger">{{ kpiData.blacklistCustomers?.toLocaleString() || 0 }}명</span>
      </div>
    </div>

    <div class="action-header">
      <h2>고객 목록</h2>
      <div class="btn-group">
        <el-button class="btn-filter" @click="showFilterModal = true">
          <img src="@/assets/Icon-1.svg" width="14" style="margin-right:5px"/> 필터 설정
        </el-button>
        <el-button type="primary" @click="showRegisterModal = true">신규 기업 등록</el-button>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <el-table :data="customerList" style="width: 100%" v-loading="loading">
        <el-table-column prop="customerCode" label="ID" width="120" />
        <el-table-column label="기업명" min-width="150">
          <template #default="{ row }">
            <span class="link-name" @click="goDetail(row.id)">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="inCharge" label="담당자" width="100" />
        <el-table-column label="연락처" width="140">
          <template #default="{ row }">{{ formatPhone(row.callNum) }}</template>
        </el-table-column>
        <el-table-column label="세그먼트" width="150">
          <template #default="{ row }">
            <el-tag :type="getSegmentColor(row.segmentName)">{{ row.segmentName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="상태" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isDeleted === 'N' ? 'success' : 'info'" size="small">
              {{ row.isDeleted === 'N' ? '활성' : '비활성' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showFilterModal" title="필터 설정" width="450px">
      <div class="filter-section">
        <p class="label">고객 세그먼트</p>
        <el-checkbox-group v-model="filter.segments" class="segment-grid">
          <el-checkbox label="VIP 고객" border>VIP</el-checkbox>
          <el-checkbox label="신규 고객" border>신규</el-checkbox>
          <el-checkbox label="일반 고객" border>일반</el-checkbox>
          <el-checkbox label="이탈 위험 고객" border>이탈위험</el-checkbox>
          <el-checkbox label="블랙리스트 고객" border>블랙리스트</el-checkbox>
          <el-checkbox label="확장 의사 고객 (기회 고객)" border>확장/기회</el-checkbox>
        </el-checkbox-group>
      </div>
      <div class="filter-section">
        <p class="label">활성화 상태</p>
        <el-radio-group v-model="filter.status">
          <el-radio label="ALL">전체</el-radio>
          <el-radio label="ACTIVE">활성</el-radio>
          <el-radio label="INACTIVE">비활성</el-radio>
        </el-radio-group>
      </div>
      <template #footer>
        <el-button @click="showFilterModal = false">닫기</el-button>
        <el-button type="primary" @click="fetchData">적용</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRegisterModal" title="신규 기업 등록" width="600px">
      <el-form :model="regForm" label-width="120px">
        <el-form-item label="기업명" required><el-input v-model="regForm.name" /></el-form-item>
        <el-form-item label="사업자번호"><el-input v-model="regForm.businessNum" placeholder="하이픈 없이 숫자만 입력" /></el-form-item>
        <el-form-item label="전화번호"><el-input v-model="regForm.callNum" placeholder="하이픈 없이 숫자만 입력" /></el-form-item>
        <el-form-item label="휴대폰"><el-input v-model="regForm.phone" placeholder="하이픈 없이 숫자만 입력" /></el-form-item>
        <el-form-item label="담당자"><el-input v-model="regForm.inCharge" /></el-form-item>
        <el-form-item label="이메일"><el-input v-model="regForm.email" /></el-form-item>
        <el-form-item label="주소"><el-input v-model="regForm.addr" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRegisterModal = false">취소</el-button>
        <el-button type="primary" @click="handleRegister">등록</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCustomerList, getCustomerKpi, createCustomer } from '@/api/customerlist';
import { ElMessage } from 'element-plus';

const router = useRouter();
const kpiData = ref({
  totalCustomers: 0,
  vipCustomers: 0,
  riskCustomers: 0,
  blacklistCustomers: 0
});
const customerList = ref([]);
const loading = ref(false);
const showFilterModal = ref(false);
const showRegisterModal = ref(false);
const filter = ref({ segments: [], status: 'ACTIVE' });
const regForm = ref({});

const fetchData = async () => {
  loading.value = true;
  showFilterModal.value = false;
  try {
    const kpiRes = await getCustomerKpi();
    if(kpiRes.data) kpiData.value = kpiRes.data;
    
    // 필터 조건 전송
    const listRes = await getCustomerList({
        pageNum: 1, 
        amount: 10,
        segments: filter.value.segments, // 선택된 세그먼트 배열 전송
        status: filter.value.status
    });
    customerList.value = listRes.data.contents;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  const payload = { ...regForm.value };
  ['businessNum', 'callNum', 'phone'].forEach(k => {
    if(payload[k]) payload[k] = payload[k].replace(/-/g, '');
  });
  
  try {
    await createCustomer(payload);
    ElMessage.success('등록되었습니다.');
    showRegisterModal.value = false;
    regForm.value = {}; // 초기화
    fetchData();
  } catch(e) { 
    ElMessage.error('등록 실패'); 
  }
};

const formatPhone = (v) => v ? v.replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3") : '-';
const getSegmentColor = (s) => {
    if(s === 'VIP 고객') return 'warning';
    if(s === '이탈 위험 고객') return 'danger';
    if(s === '블랙리스트 고객') return 'info';
    return '';
};
const goDetail = (id) => router.push(`/customers/${id}`);

onMounted(fetchData);
</script>

<style scoped>
.kpi-wrapper { display: flex; gap: 15px; margin-bottom: 20px; }
.kpi-box { flex: 1; background: #fff; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
.kpi-title { font-size: 14px; color: #666; margin-bottom: 8px; display: block; }
.kpi-count { font-size: 24px; font-weight: bold; }
.highlight { color: #f59e0b; } .warning { color: #ef4444; } .danger { color: #374151; }
.action-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.link-name { font-weight: 600; cursor: pointer; color: #2c3e50; }
.segment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
.filter-section { margin-bottom: 20px; }
</style>