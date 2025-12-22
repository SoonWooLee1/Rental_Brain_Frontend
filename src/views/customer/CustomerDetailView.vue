<template>
  <div class="page-container" v-loading="loading">
    
    <div class="detail-header">
      <div class="header-left">
        <el-button @click="goList" circle plain>
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h2 class="company-name">
          {{ customer.name }}
          <el-tag v-if="customer.isDeleted === 'Y'" type="danger" effect="dark" class="ml-2">비활성</el-tag>
        </h2>
        <el-tag :type="getSegmentColor(customer.segmentName)" effect="light" class="segment-tag">
          {{ customer.segmentName || '일반' }}
        </el-tag>
      </div>

      <div class="header-right">
        <template v-if="!isEditMode && customer.isDeleted !== 'Y'">
          <el-button type="primary" @click="enableEditMode">
            <el-icon><Edit /></el-icon> 정보 수정
          </el-button>
          <el-button type="danger" plain @click="handleDelete">
            <el-icon><Delete /></el-icon> 고객 삭제
          </el-button>
        </template>

        <template v-if="customer.isDeleted === 'Y'">
          <el-button type="success" @click="handleRestore">
            <el-icon><RefreshLeft /></el-icon> 고객 복구
          </el-button>
        </template>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="detail-tabs">
      
      <el-tab-pane label="종합 정보" name="general">
        <div class="info-grid">
          
          <el-card class="info-card basic-info" shadow="never">
            <template #header><span class="card-title">기본 정보</span></template>
            
            <el-descriptions :column="1" border v-if="!isEditMode">
              <el-descriptions-item label="고객 코드">{{ customer.customerCode }}</el-descriptions-item>
              <el-descriptions-item label="담당자">{{ customer.inCharge }}</el-descriptions-item>
              <el-descriptions-item label="부서 / 직책">{{ customer.dept || '-' }}</el-descriptions-item>
              <el-descriptions-item label="연락처">{{ formatPhone(customer.callNum) }}</el-descriptions-item>
              <el-descriptions-item label="이메일">{{ customer.email }}</el-descriptions-item>
              <el-descriptions-item label="첫 계약일">{{ customer.firstContractDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="주소">{{ customer.addr || '-' }}</el-descriptions-item>
            </el-descriptions>

            <el-form v-else :model="editForm" label-width="80px">
              <el-form-item label="담당자"><el-input v-model="editForm.inCharge" /></el-form-item>
              <el-form-item label="부서/직책"><el-input v-model="editForm.dept" /></el-form-item>
              <el-form-item label="연락처"><el-input v-model="editForm.callNum" /></el-form-item>
              <el-form-item label="이메일"><el-input v-model="editForm.email" /></el-form-item>
              <el-form-item label="주소"><el-input v-model="editForm.addr" /></el-form-item>
              <div class="edit-buttons">
                <el-button @click="cancelEdit">취소</el-button>
                <el-button type="primary" @click="saveEdit">저장</el-button>
              </div>
            </el-form>
          </el-card>

          <el-card class="info-card memo-info" shadow="never">
            <template #header><span class="card-title">고객 메모</span></template>
            <el-input
              v-model="customer.memo"
              type="textarea"
              :rows="12"
              placeholder="메모 내용이 없습니다."
              :readonly="!isEditMode"
              class="memo-textarea"
            />
            <div v-if="isEditMode" class="tip-text text-right mt-2">* '저장' 클릭 시 반영됩니다.</div>
          </el-card>

          <el-card class="info-card history-info" shadow="never">
            <template #header><span class="card-title">고객 대응 히스토리</span></template>
            <el-scrollbar height="400px">
              <el-timeline v-if="customer.historyList && customer.historyList.length > 0">
                <el-timeline-item
                  v-for="(item, index) in customer.historyList"
                  :key="index"
                  :timestamp="formatDate(item.date)"
                  placement="top"
                  :color="getStatusColor(item.status)"
                >
                  <el-card class="history-item-card" shadow="hover">
                    <div class="history-header">
                      <span class="history-type">[{{ item.type }}]</span>
                      <span class="history-performer">{{ item.performer }}</span>
                    </div>
                    <div class="history-content">{{ item.content }}</div>
                    <div class="history-status">
                       <el-tag size="small" :type="getStatusType(item.status)">{{ item.status }}</el-tag>
                    </div>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="히스토리가 없습니다." />
            </el-scrollbar>
          </el-card>

        </div>
      </el-tab-pane>

      <el-tab-pane label="문의 내역" name="support">
        <el-table :data="customer.supportList" border stripe style="width: 100%">
          <el-table-column prop="customerSupportCode" label="문의 번호" width="140" align="center" />
          <el-table-column prop="createDate" label="접수일자" width="120" align="center" :formatter="dateFormatter" />
          <el-table-column prop="categoryName" label="카테고리" width="120" align="center" />
          <el-table-column prop="title" label="제목" min-width="150" show-overflow-tooltip />
          <el-table-column prop="channelName" label="접수 채널" width="100" align="center" />
          <el-table-column prop="empName" label="담당자" width="100" align="center" />
          <el-table-column prop="status" label="진행 상태" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getSupportStatusTag(row.status)">{{ formatSupportStatus(row.status) }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="견적 내역" name="quote">
        <el-table :data="customer.quoteList" border stripe>
          <el-table-column prop="quoteCode" label="견적 번호" width="140" align="center" />
          <el-table-column prop="quoteCounselingDate" label="상담 일자" width="120" align="center" :formatter="dateFormatter" />
          <el-table-column prop="quoteSummary" label="견적 요약" min-width="200" />
          <el-table-column prop="quoteCounselor" label="상담원" width="100" align="center" />
          <el-table-column prop="channelName" label="채널" width="100" align="center" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="계약 내역" name="contract">
        <el-table :data="customer.contractList" border stripe>
          <el-table-column prop="contract_code" label="계약 번호" width="140" align="center" />
          <el-table-column prop="conName" label="계약명" min-width="180" />
          <el-table-column prop="start_date" label="계약 시작일" width="120" align="center" :formatter="dateFormatter" />
          <el-table-column prop="contract_period" label="기간(개월)" width="100" align="center" />
          
          <el-table-column prop="monthly_payment" label="월 납입금" width="150" align="right">
            <template #default="{row}">{{ row.monthly_payment?.toLocaleString() }}원</template>
          </el-table-column>
          
          <el-table-column prop="status" label="계약 상태" width="100" align="center">
             <template #default="{row}">
               <el-tag :type="getContractStatusTag(row.status)">{{ formatContractStatus(row.status) }}</el-tag>
             </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="AS / 정기점검" name="as">
        <el-table :data="customer.asList" border stripe>
          <el-table-column prop="after_service_code" label="관리 번호" width="140" align="center" />
          <el-table-column prop="dueDate" label="예정일" width="120" align="center" :formatter="dateFormatter" />
          <el-table-column prop="type" label="유형" width="100" align="center">
             <template #default="{row}">
               <el-tag :type="row.type === 'R' ? 'success' : 'warning'" effect="plain">
                  {{ row.type === 'R' ? '정기 점검' : 'AS' }}
               </el-tag>
             </template>
          </el-table-column>
          <el-table-column prop="contents" label="내용" min-width="200" show-overflow-tooltip />
          <el-table-column prop="engineer" label="기사님" width="100" align="center" />
          <el-table-column prop="status" label="처리 상태" width="100" align="center">
            <template #default="{row}">
               <el-tag :type="getAsStatusTag(row.status)">{{ formatAsStatus(row.status) }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="피드백 내역" name="feedback">
        <el-table :data="customer.feedbackList" border stripe>
          <el-table-column prop="feedbackCode" label="피드백 번호" width="140" align="center" />
          <el-table-column prop="createDate" label="등록일" width="120" align="center" :formatter="dateFormatter" />
          <el-table-column prop="categoryName" label="카테고리" width="120" align="center" />
          <el-table-column prop="title" label="제목" min-width="150" />
          <el-table-column prop="empName" label="담당자" width="100" align="center" />
          <el-table-column prop="star" label="만족도" width="140" align="center">
             <template #default="{row}">
               <el-rate v-model="row.star" disabled show-score text-color="#ff9900" />
             </template>
          </el-table-column>
          <el-table-column prop="action" label="조치 내용" min-width="150" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="캠페인 내역" name="campaign">
        <h4>🎟️ 보유 쿠폰</h4>
        <el-table :data="customer.couponList" border stripe class="mb-20">
          <el-table-column prop="couponCode" label="쿠폰 코드" width="140" align="center" />
          <el-table-column prop="name" label="쿠폰명" />
          <el-table-column prop="rate" label="할인율" width="100" align="center">
            <template #default="{row}">{{ row.rate }}%</template>
          </el-table-column>
          <el-table-column prop="status" label="사용 여부" width="100" align="center">
             <template #default="{row}">
                <el-tag :type="row.status === 'Y' ? 'info' : 'success'">
                  {{ row.status === 'Y' ? '사용 완료' : '사용 가능' }}
                </el-tag>
             </template>
          </el-table-column>
        </el-table>

        <h4>🎁 프로모션 참여</h4>
        <el-table :data="customer.promotionList" border stripe>
          <el-table-column prop="promotionCode" label="프로모션 코드" width="140" align="center" />
          <el-table-column prop="name" label="프로모션명" />
          <el-table-column prop="status" label="상태" width="100" align="center">
             <template #default="{row}">
               <el-tag>{{ row.status === 'A' ? '진행중' : '종료' }}</el-tag>
             </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="세그먼트 변경 이력" name="history">
        <el-timeline style="padding: 20px;">
          <el-timeline-item
            v-for="(item, index) in customer.segmentHistoryList"
            :key="index"
            :timestamp="formatDate(item.changedAt)"
            placement="top"
            color="#409eff"
          >
            <el-card shadow="hover">
              <div class="history-item">
                <strong>
                  {{ item.previousSegmentName || '가입' }} 
                  <el-icon style="vertical-align: middle;"><Right /></el-icon> 
                  {{ item.currentSegmentName }}
                </strong>
                <p class="history-reason">
                    사유: {{ item.reason }} 
                    <el-tag size="small" effect="plain" class="ml-2">{{ item.triggerType }}</el-tag>
                </p>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCustomerDetail, updateCustomer, deleteCustomer, restoreCustomer } from '@/api/customerlist';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Edit, Delete, RefreshLeft, Right } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const customerId = route.params.id;

const loading = ref(false);
const activeTab = ref('general');
const isEditMode = ref(false);
const customer = ref({
    historyList: [], segmentHistoryList: [], supportList: [], quoteList: [],
    contractList: [], asList: [], feedbackList: [], couponList: [], promotionList: []
});
const editForm = ref({});

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getCustomerDetail(customerId);
    customer.value = res.data;
  } catch (error) {
    ElMessage.error('데이터 로드 실패');
  } finally {
    loading.value = false;
  }
};

const enableEditMode = () => { editForm.value = { ...customer.value }; isEditMode.value = true; };
const cancelEdit = () => { isEditMode.value = false; editForm.value = {}; };
const saveEdit = async () => {
  try { editForm.value.memo = customer.value.memo; await updateCustomer(customerId, editForm.value); ElMessage.success('저장되었습니다.'); isEditMode.value = false; fetchData(); } catch (e) { ElMessage.error('저장 실패: ' + e.message); }
};
const handleDelete = () => { ElMessageBox.confirm('정말 삭제(비활성화) 하시겠습니까?', '경고', { type: 'warning' }).then(async () => { try { await deleteCustomer(customerId); ElMessage.success('비활성화 되었습니다.'); fetchData(); } catch (e) { ElMessage.error('삭제 실패'); } }); };
const handleRestore = () => { ElMessageBox.confirm('고객을 다시 활성화 하시겠습니까?', '복구 확인', { type: 'success' }).then(async () => { try { await restoreCustomer(customerId); ElMessage.success('고객이 복구되었습니다.'); fetchData(); } catch (e) { ElMessage.error('복구 실패'); } }); };
const goList = () => router.push('/customers');

// ▼ 상태 코드 변환 함수 ▼
const formatContractStatus = (status) => {
    const map = { P: '진행 중', C: '완료', W: '승인 대기', R: '반려', T: '해지', I: '만료 임박' };
    return map[status] || status;
};
const getContractStatusTag = (status) => {
    const map = { P: 'primary', C: 'success', W: 'warning', R: 'danger', T: 'info', I: 'danger' };
    return map[status] || 'info';
};

const formatSupportStatus = (status) => {
    const map = { P: '처리 중', C: '완료', W: '대기' };
    return map[status] || status;
};
const getSupportStatusTag = (status) => {
    const map = { P: 'primary', C: 'success', W: 'warning' };
    return map[status] || 'info';
};

const formatAsStatus = (status) => {
    const map = { P: '방문 예정', C: '처리 완료', R: '접수됨' };
    return map[status] || status;
};
const getAsStatusTag = (status) => {
    const map = { P: 'warning', C: 'success', R: 'info' };
    return map[status] || 'info';
};

// 유틸
const formatDate = (d) => d ? d.substring(0, 10) : '';
const dateFormatter = (row, col, val) => formatDate(val);
const formatPhone = (v) => v ? v.replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3") : '-';
const getSegmentColor = (s) => { if(!s) return 'info'; if(s.includes('VIP')) return 'warning'; if(s.includes('이탈')) return 'danger'; if(s.includes('신규')) return 'success'; return ''; };
const getStatusColor = (status) => status === '완료' ? '#0bbd87' : '#409eff';
const getStatusType = (status) => status === '완료' ? 'success' : 'primary';

onMounted(fetchData);
</script>

<style scoped>
.page-container { padding: 20px; max-width: 1600px; margin: 0 auto; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 10px; }
.company-name { margin: 0; font-size: 24px; font-weight: 700; color: #333; }
.ml-2 { margin-left: 10px; }
.segment-tag { margin-left: 10px; }

/* 3단 그리드 레이아웃 */
.info-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.2fr;
  gap: 20px;
  align-items: stretch;
}
.info-card { height: 100%; display: flex; flex-direction: column; }
.card-title { font-weight: 700; font-size: 16px; }

/* 텍스트 영역 스타일 */
.memo-textarea :deep(.el-textarea__inner),
.memo-box :deep(.el-textarea__inner) {
    resize: none; border: none; background-color: #f9f9f9; font-size: 14px; line-height: 1.6; padding: 15px;
}
.tip-text { font-size: 12px; color: #999; }
.text-right { text-align: right; }
.mt-2 { margin-top: 10px; }
.mb-20 { margin-bottom: 20px; }

/* 히스토리 스타일 */
.history-item-card { margin-bottom: 5px; }
.history-header { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; color: #666; }
.history-type { font-weight: bold; color: #409eff; }
.history-content { font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #333; }
.history-status { text-align: right; }
.history-item p { margin: 5px 0 0; }
.history-reason { font-size: 13px; color: #666; }

.edit-buttons { display: flex; justify-content: flex-end; margin-top: 20px; gap: 10px; }
</style>