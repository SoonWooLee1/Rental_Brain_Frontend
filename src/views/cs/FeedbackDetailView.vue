<template>
  <div class="detail-container">
    <div class="page-header">
      <h2>피드백 상세 정보</h2>
      <button class="btn-back" @click="$router.push('/cs/feedback')">목록으로</button>
    </div>

    <div v-if="loading" class="loading-area">데이터를 불러오는 중입니다...</div>

    <BaseCard v-else-if="feedback" class="detail-card">
      <div class="detail-row">
        <label>작성자</label>
        <span>{{ feedback.authorName || '익명' }} ({{ feedback.authorId || '-' }})</span>
      </div>
      <div class="detail-row">
        <label>카테고리</label>
        <span>{{ getCategoryName(feedback.category) }}</span> 
      </div>
      <div class="detail-row">
        <label>평점</label>
        <el-rate v-model="feedback.star" disabled text-color="#ff9900" show-score score-template="{value}점" />
      </div>
      <div class="detail-row">
        <label>작성일</label>
        <span>{{ formatDate(feedback.createdAt) }}</span>
      </div>
      <div class="detail-row">
        <label>상태</label>
        <el-tag :type="feedback.status === '답변완료' ? 'success' : 'warning'">
          {{ feedback.status || '미답변' }}
        </el-tag>
      </div>
      
      <div class="detail-content">
        <label>피드백 내용</label>
        <div class="content-box">{{ feedback.feedbackContent }}</div>
      </div>

      <div class="divider"></div>

      <div class="response-section">
        <h3>관리자 조치사항</h3>
        
        <div v-if="feedback.status === '답변완료' || feedback.responseContent" class="response-view">
          <div class="response-meta">
            <span>처리자: {{ feedback.responderName || '관리자' }}</span>
            <span>처리일: {{ formatDate(feedback.respondedAt) }}</span>
          </div>
          <div class="content-box response-box">{{ feedback.responseContent }}</div>
        </div>
        
        <div v-else class="response-form">
          <el-input
            v-model="responseContent"
            type="textarea"
            rows="5"
            placeholder="조치사항 내용을 입력하세요. 등록 시 상태가 '답변완료'로 변경됩니다."
          />
          <div class="form-actions">
            <el-button type="primary" @click="handleUpdateAction">조치사항 등록 (완료 처리)</el-button>
          </div>
        </div>
      </div>
    </BaseCard>
    
    <div v-else class="error-msg">데이터를 찾을 수 없습니다.</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFeedbackDetail, updateFeedback } from '@/api/feedback';
import BaseCard from '@/components/common/BaseCard.vue';
import { useToastStore } from '@/store/useToast';

const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const feedback = ref(null);
const loading = ref(false);
const responseContent = ref('');

const categoryMap = { 5: '서비스 만족', 6: '제품 불량', 7: '제품 품질', 8: 'AS 관련' };
const getCategoryName = (code) => categoryMap[code] || '기타';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
};

const loadData = async () => {
  const id = route.params.id;
  loading.value = true;
  try {
    const res = await getFeedbackDetail(id);
    if (res.data) {
      feedback.value = res.data;
      if (res.data.responseContent) {
        responseContent.value = res.data.responseContent;
      }
    }
  } catch (error) {
    console.error("상세 조회 실패:", error);
    toast.error('피드백 정보를 불러오지 못했습니다.');
  } finally {
    loading.value = false;
  }
};

const handleUpdateAction = async () => {
  if (!responseContent.value.trim()) return toast.warning('조치 내용을 입력하세요.');
  
  try {
    // [핵심] 기존 updateFeedback API를 사용하여 내용과 상태를 함께 업데이트
    const updateData = {
      ...feedback.value,           // 기존 데이터 유지
      responseContent: responseContent.value, // 조치 내용
      status: '답변완료'           // 상태 변경
    };

    // ID와 수정할 데이터를 전달
    await updateFeedback(feedback.value.feedbackId, updateData);
    
    toast.success('조치사항이 등록되었습니다.');
    await loadData(); // 데이터 갱신
  } catch (error) {
    console.error(error);
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
.btn-back { padding: 8px 16px; border: 1px solid #dcdfe6; background: white; cursor: pointer; border-radius: 4px; }
.detail-card { padding: 30px; }
.detail-row { display: flex; margin-bottom: 15px; align-items: center; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; }
.detail-row label { width: 120px; font-weight: bold; color: #606266; }
.detail-content { margin-top: 20px; }
.detail-content label { display: block; font-weight: bold; margin-bottom: 10px; color: #606266; }
.content-box { background: #f5f7fa; padding: 20px; border-radius: 4px; min-height: 100px; white-space: pre-wrap; line-height: 1.6; color: #303133; border: 1px solid #e4e7ed; }
.divider { height: 1px; background: #ebeef5; margin: 30px 0; }
.response-section h3 { margin-bottom: 15px; font-size: 18px; color: #303133; }
.response-meta { margin-bottom: 10px; font-size: 13px; color: #909399; display: flex; gap: 15px; }
.response-box { background: #f0f9eb; border-color: #e1f3d8; color: #606266; }
.form-actions { margin-top: 15px; text-align: right; }
.loading-area, .error-msg { text-align: center; padding: 50px; color: #909399; }
</style>