<template>
  <div class="detail-container">
    <div class="page-header">
      <h2>문의 상세 정보</h2>
      <button class="btn-back" @click="$router.push('/cs/support')">목록으로</button>
    </div>

    <div v-if="loading" class="loading-area">로딩 중...</div>

    <BaseCard v-else-if="support" class="detail-card">
      <div class="header-section">
        <div class="title-row">
          <span class="type-badge">{{ support.csType }}</span>
          <h3 class="title-text">{{ support.csTitle }}</h3>
        </div>
        <div class="status-row">
          <span :class="['status-badge', support.csStatus === '처리완료' ? 'completed' : 'pending']">
            {{ support.csStatus }}
          </span>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="label">작성자</span>
          <span class="value">{{ support.customerName }} ({{ support.customerId }})</span>
        </div>
        <div class="meta-item">
          <span class="label">등록일</span>
          <span class="value">{{ formatDate(support.createdAt) }}</span>
        </div>
      </div>
      
      <div class="body-content">
        <label>문의 내용</label>
        <div class="content-box">{{ support.csContent }}</div>
      </div>

      <div class="divider"></div>

      <div class="response-section">
        <h3>처리 내역</h3>
        
        <div v-if="support.csStatus === '처리완료' || support.responseContent" class="response-view">
          <div class="response-meta">
            <span>담당자: {{ support.responderName || '관리자' }}</span>
            <span>처리일: {{ formatDate(support.respondedAt) }}</span>
          </div>
          <div class="content-box response-box">{{ support.responseContent }}</div>
        </div>
        
        <div v-else class="response-form">
          <el-input 
            type="textarea" 
            v-model="responseContent" 
            rows="5" 
            placeholder="답변 및 처리 내용을 입력하세요. 등록 시 '처리완료'로 변경됩니다." 
          />
          <div class="form-actions">
            <el-button type="primary" @click="handleUpdateSupport">답변 등록 (완료 처리)</el-button>
          </div>
        </div>
      </div>
    </BaseCard>
    
    <div v-else class="error-msg">문의 정보를 찾을 수 없습니다.</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSupportDetail, updateSupport } from '@/api/customersupport';
import BaseCard from '@/components/common/BaseCard.vue';
import { useToastStore } from '@/store/useToast';

const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const support = ref(null);
const loading = ref(false);
const responseContent = ref('');

const formatDate = (d) => d ? new Date(d).toLocaleString() : '-';

const loadData = async () => {
  const id = route.params.id;
  loading.value = true;
  try {
    const res = await getSupportDetail(id);
    if (res.data) {
      support.value = res.data;
      if(res.data.responseContent) {
        responseContent.value = res.data.responseContent;
      }
    }
  } catch (e) {
    console.error("문의 상세 조회 실패:", e);
    toast.error('데이터 로드 실패');
  } finally {
    loading.value = false;
  }
};

const handleUpdateSupport = async () => {
  if(!responseContent.value.trim()) return toast.warning('내용을 입력하세요.');
  try {
    const updateData = {
      ...support.value,
      responseContent: responseContent.value,
      csStatus: '처리완료' // 상태 변경
    };

    await updateSupport(support.value.csId, updateData);
    
    toast.success('처리가 완료되었습니다.');
    await loadData();
  } catch(e) {
    console.error(e);
    toast.error('등록 실패');
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.detail-container { max-width: 900px; margin: 20px auto; padding: 0 20px; }
.page-header { display: flex; justify-content: space-between; margin-bottom: 20px; align-items: center; }
.btn-back { padding: 8px 16px; background: white; border: 1px solid #dcdfe6; border-radius: 4px; cursor: pointer; }
.detail-card { padding: 30px; }

.header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
.title-row { display: flex; align-items: center; gap: 10px; }
.type-badge { background: #ecf5ff; color: #409eff; padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: bold; }
.title-text { margin: 0; font-size: 20px; color: #303133; }

.status-badge { padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; }
.status-badge.completed { background: #f0f9eb; color: #67c23a; }
.status-badge.pending { background: #fdf6ec; color: #e6a23c; }

.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #fafafa; padding: 15px; border-radius: 4px; }
.meta-item { display: flex; flex-direction: column; gap: 5px; }
.meta-item .label { font-size: 12px; color: #909399; }
.meta-item .value { font-size: 15px; color: #303133; font-weight: 500; }

.body-content label { display: block; font-weight: bold; margin-bottom: 10px; color: #606266; }
.content-box { background: #fff; padding: 20px; border: 1px solid #e4e7ed; border-radius: 4px; line-height: 1.6; min-height: 120px; white-space: pre-wrap; }
.response-box { background: #f0f9eb; border-color: #e1f3d8; }

.divider { margin: 40px 0; border-top: 1px dashed #dcdfe6; }
.response-meta { margin-bottom: 10px; color: #909399; font-size: 13px; display: flex; gap: 15px; }
.form-actions { margin-top: 15px; text-align: right; }
.loading-area, .error-msg { text-align: center; padding: 40px; color: #909399; }
</style>