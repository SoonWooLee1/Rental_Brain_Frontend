<template>
  <div class="page-container" v-loading="loading">
    
    <div class="detail-header">
      <div class="header-left">
        <el-button @click="goList" circle plain>
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        
        <h2 class="company-name">{{ customer.name }}</h2>
        <el-tag :type="getSegmentColor(customer.segmentName)" effect="dark" class="segment-tag">
          {{ customer.segmentName || '일반' }}
        </el-tag>
      </div>

      <div class="header-right">
        <el-button type="primary" @click="enableEditMode" v-if="!isEditMode">
          <el-icon><Edit /></el-icon> 정보 수정
        </el-button>
        <el-button type="danger" plain @click="handleDelete" v-if="!isEditMode">
          <el-icon><Delete /></el-icon> 고객 삭제
        </el-button>
      </div>
    </div>

    <div class="info-grid">
      
      <el-card class="info-card" shadow="never">
        <template #header><span class="card-title">기본 정보</span></template>
        
        <el-descriptions :column="1" border v-if="!isEditMode">
          <el-descriptions-item label="기업명">{{ customer.name }}</el-descriptions-item>
          <el-descriptions-item label="담당자">{{ customer.inCharge }}</el-descriptions-item>
          <el-descriptions-item label="부서/직책">{{ customer.dept || '-' }}</el-descriptions-item>
          <el-descriptions-item label="연락처">{{ formatPhone(customer.phone) }}</el-descriptions-item>
          <el-descriptions-item label="이메일">{{ customer.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="주소">{{ customer.addr || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-form v-else :model="editForm" label-width="80px">
          <el-form-item label="기업명"><el-input v-model="editForm.name" /></el-form-item>
          <el-form-item label="담당자"><el-input v-model="editForm.inCharge" /></el-form-item>
          <el-form-item label="부서/직책"><el-input v-model="editForm.dept" /></el-form-item>
          <el-form-item label="연락처"><el-input v-model="editForm.phone" /></el-form-item>
          <el-form-item label="이메일"><el-input v-model="editForm.email" /></el-form-item>
          <el-form-item label="주소"><el-input v-model="editForm.addr" /></el-form-item>
          
          <div class="edit-buttons">
            <el-button @click="cancelEdit">취소</el-button>
            <el-button type="primary" @click="saveEdit">저장</el-button>
          </div>
        </el-form>
      </el-card>

      <el-card class="info-card" shadow="never">
        <template #header><span class="card-title">고객 메모</span></template>
        <el-input
          v-model="customer.memo"
          type="textarea"
          :rows="15"
          placeholder="메모 내용이 없습니다."
          :readonly="!isEditMode"
          class="memo-box"
        />
        <div v-if="isEditMode" class="memo-tip">
          * 메모 내용은 '저장' 버튼 클릭 시 함께 반영됩니다.
        </div>
      </el-card>

      <el-card class="info-card" shadow="never">
        <template #header><span class="card-title">고객 대응 히스토리</span></template>
        
        <el-scrollbar height="400px">
          <el-timeline v-if="customer.historyList && customer.historyList.length > 0">
            <el-timeline-item
              v-for="(item, index) in customer.historyList"
              :key="index"
              :timestamp="formatDate(item.date)"
              placement="top"
              :color="item.status === '완료' ? '#0bbd87' : '#409eff'"
            >
              <el-card class="history-item" shadow="hover">
                <div class="history-header">
                  <span class="history-type">[{{ item.type }}]</span>
                  <span class="history-performer">{{ item.performer }}</span>
                </div>
                <div class="history-content">{{ item.content }}</div>
                <div class="history-status">
                  <el-tag size="small" :type="item.status === '완료' ? 'success' : 'primary'">
                    {{ item.status }}
                  </el-tag>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="히스토리가 없습니다." :image-size="80" />
        </el-scrollbar>
      </el-card>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCustomerDetail, updateCustomer, deleteCustomer } from '@/api/customerlist';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Edit, Delete } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const customerId = route.params.id;

const loading = ref(false);
const customer = ref({});
const isEditMode = ref(false);
const editForm = ref({});

// 데이터 불러오기
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getCustomerDetail(customerId);
    customer.value = res.data;
  } catch (error) {
    console.error(error);
    ElMessage.error('고객 정보를 불러오는데 실패했습니다.');
  } finally {
    loading.value = false;
  }
};

// 수정 모드 활성화
const enableEditMode = () => {
  editForm.value = { ...customer.value }; // 현재 데이터 복사
  isEditMode.value = true;
};

// 수정 취소
const cancelEdit = () => {
  isEditMode.value = false;
  editForm.value = {};
};

// 수정 저장
const saveEdit = async () => {
  try {
    // 메모는 v-model로 customer.memo에 바인딩되어 있지만,
    // 저장 시에는 editForm에도 반영해줘야 할 수 있음 (여기선 editForm 위주로 전송)
    editForm.value.memo = customer.value.memo; 

    await updateCustomer(customerId, editForm.value);
    ElMessage.success('고객 정보가 수정되었습니다.');
    isEditMode.value = false;
    fetchData(); // 최신 데이터 재조회
  } catch (error) {
    console.error(error);
    ElMessage.error('수정 실패: ' + (error.response?.data || error.message));
  }
};

// 고객 삭제
const handleDelete = () => {
  ElMessageBox.confirm(
    '정말로 이 고객을 삭제하시겠습니까? (복구 가능)',
    '삭제 확인',
    { confirmButtonText: '삭제', cancelButtonText: '취소', type: 'warning' }
  ).then(async () => {
    try {
      await deleteCustomer(customerId);
      ElMessage.success('고객이 삭제되었습니다.');
      router.push('/customers'); // 목록으로 이동
    } catch (error) {
      ElMessage.error('삭제 실패: ' + error.message);
    }
  });
};

const goList = () => router.push('/customers');

// 포맷팅 함수들
const formatPhone = (v) => v ? v.replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3") : '-';
const formatDate = (d) => d ? d.substring(0, 10) : '';

const getSegmentColor = (s) => {
    if(!s) return 'info';
    if(s.includes('VIP')) return 'warning';
    if(s.includes('이탈')) return 'danger';
    if(s.includes('신규')) return 'success';
    return '';
};

onMounted(fetchData);
</script>

<style scoped>
.page-container { padding: 20px; max-width: 1600px; margin: 0 auto; }

/* 헤더 */
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 15px; }
.company-name { margin: 0; font-size: 24px; font-weight: 700; color: #333; }
.segment-tag { font-size: 14px; padding: 14px 10px; }

/* 그리드 레이아웃 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr; /* 3단 구성 */
  gap: 20px;
  align-items: start;
}

.info-card { min-height: 500px; display: flex; flex-direction: column; }
.card-title { font-weight: 700; font-size: 16px; }

/* 메모 박스 */
.memo-box :deep(.el-textarea__inner) {
  border: none; background-color: #f9f9f9; resize: none; font-size: 14px; line-height: 1.6; padding: 15px;
}
.memo-tip { margin-top: 10px; font-size: 12px; color: #888; text-align: right; }

/* 히스토리 */
.history-item { margin-bottom: 5px; }
.history-header { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; color: #666; }
.history-type { font-weight: bold; color: #409eff; }
.history-content { font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #333; }
.history-status { text-align: right; }

/* 수정 버튼 그룹 */
.edit-buttons { display: flex; justify-content: flex-end; margin-top: 15px; gap: 10px; }
</style>