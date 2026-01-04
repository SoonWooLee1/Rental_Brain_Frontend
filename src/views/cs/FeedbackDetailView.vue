<template>
  <div class="page-container" v-loading="loading">
    <div class="header-row">
      <div class="title-area">
        <el-button @click="$router.go(-1)" circle class="mr-3">
          <el-icon>
            <ArrowLeft />
          </el-icon>
        </el-button>
        <h2 class="page-title">피드백 상세 정보</h2>
      </div>
    </div>

    <el-card shadow="never" class="detail-card">
      <el-descriptions :column="2" border size="large">
        <el-descriptions-item label="피드백 번호">{{ feedbackInfo.feedbackCode }}</el-descriptions-item>
        <el-descriptions-item label="담당자">{{ feedbackInfo.empName || '미배정' }}</el-descriptions-item>
        <el-descriptions-item label="기업명">{{ feedbackInfo.customerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="카테고리">{{ feedbackInfo.categoryName }}</el-descriptions-item>
        <el-descriptions-item label="유입 채널">{{ feedbackInfo.channelName }}</el-descriptions-item>

        <el-descriptions-item label="상태">
          <el-tag :type="hasAction(feedbackInfo.action) ? 'success' : 'info'">
            {{ hasAction(feedbackInfo.action) ? '조치 완료' : '미조치' }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="평점">
          <el-rate v-model="feedbackInfo.star" disabled text-color="#ff9900" show-score score-template="{value}점" />
        </el-descriptions-item>

        <el-descriptions-item label="접수일시">
          {{ formatDateTime(feedbackInfo.createDate) }}
        </el-descriptions-item>

        <el-descriptions-item label="제목" :span="2"><strong>{{ feedbackInfo.title }}</strong></el-descriptions-item>
      </el-descriptions>

      <div class="content-section mt-4">
        <h3 class="section-title">피드백 내용</h3>
        <div class="content-box">
          {{ feedbackInfo.content }}
        </div>
      </div>

      <div class="content-section mt-4">
        <h3 class="section-title">조치 결과</h3>
        <div class="content-box bg-gray">
          {{ feedbackInfo.action || '아직 조치 내용이 등록되지 않았습니다.' }}
        </div>
      </div>

      <div class="action-footer mt-4">
        <div class="button-group-right">
          <el-tooltip v-if="!canModifyFeedBack" content="피드백 처리 권한이 없습니다" placement="bottom">
            <span>
              <el-button type="danger" plain class="mr-2" :disabled="true">
                <el-icon>
                  <Plus />
                </el-icon> 삭제
              </el-button>
            </span>
          </el-tooltip>

          <el-button v-else type="danger" plain class="mr-2" @click="handleDelete">
            <el-icon>
              <Plus />
            </el-icon> 삭제
          </el-button>

          <el-tooltip v-if="!canModifyFeedBack" content="피드백 처리 권한이 없습니다" placement="bottom">
            <span>
              <el-button type="primary" plain :disabled="true">
                <el-icon>
                  <Plus />
                </el-icon> 수정
              </el-button>
            </span>
          </el-tooltip>

          <el-button v-else type="primary" plain @click="openEditModal">
            <el-icon>
              <Plus />
            </el-icon> 수정
          </el-button>

        </div>
      </div>
    </el-card>

    <el-dialog v-model="editModalVisible" title="피드백 수정" width="600px" destroy-on-close>
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="기업명">
          <el-input :model-value="feedbackInfo.customerName" disabled />
        </el-form-item>
        <el-form-item label="평점">
          <el-rate v-model="editForm.star" />
        </el-form-item>
        <el-form-item label="제목">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="내용">
          <el-input v-model="editForm.content" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item label="조치사항">
          <el-input v-model="editForm.action" type="textarea" :rows="3" placeholder="내용 입력 시 자동으로 '조치 완료' 상태로 표시됩니다." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editModalVisible = false">취소</el-button>
        <el-button type="primary" @click="submitUpdate">수정 저장</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getFeedbackDetail, updateFeedback, deleteFeedback } from '@/api/feedback';
import { useAuthStore } from '@/store/auth.store';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const feedbackInfo = ref({});
const editModalVisible = ref(false);
const authStore = useAuthStore();

const editForm = reactive({
  star: 5,
  title: '',
  content: '',
  action: ''
});

// 권한 접근 제한
const canModifyFeedBack = computed(() =>
  authStore.hasAuth("CS_PROCESS")
);

// 조치사항 유무 체크 함수 (빈 공백만 있는 경우도 미조치로 간주)
const hasAction = (action) => {
  return action && action.trim().length > 0;
};

const fetchData = async () => {
  loading.value = true;
  try {
    const id = route.params.id;
    const res = await getFeedbackDetail(id);
    if (res.data) {
      feedbackInfo.value = res.data;
    }
  } catch (e) {
    ElMessage.error('상세 정보를 불러오지 못했습니다.');
    router.push('/cs/feedbacks');
  } finally {
    loading.value = false;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  return dateStr.replace('T', ' ');
};

const openEditModal = () => {
  Object.assign(editForm, {
    star: feedbackInfo.value.star,
    title: feedbackInfo.value.title,
    content: feedbackInfo.value.content,
    action: feedbackInfo.value.action
  });
  editModalVisible.value = true;
};

const submitUpdate = async () => {
  try {
    const payload = {
      title: editForm.title,
      content: editForm.content,
      star: editForm.star,
      action: editForm.action,
      // 필수 ID값 매핑 (500 에러 방지)
      empId: feedbackInfo.value.empId,
      cumId: feedbackInfo.value.cumId,
      categoryId: feedbackInfo.value.categoryId,
      channelId: feedbackInfo.value.channelId
    };

    await updateFeedback(feedbackInfo.value.id, payload);
    ElMessage.success('수정되었습니다.');
    editModalVisible.value = false;
    fetchData(); // 데이터 재조회 (화면 갱신)
  } catch (e) {
    console.error(e);
    ElMessage.error('수정 실패: ' + (e.response?.data?.message || '서버 오류'));
  }
};

const handleDelete = () => {
  ElMessageBox.confirm('정말 삭제하시겠습니까?', '경고', { type: 'warning' })
    .then(async () => {
      await deleteFeedback(feedbackInfo.value.id);
      ElMessage.success('삭제되었습니다.');
      router.push('/cs/feedbacks');
    });
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.page-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #333;
}

.detail-card {
  border-radius: 8px;
  padding: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.content-box {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 4px;
  min-height: 100px;
  white-space: pre-wrap;
  line-height: 1.6;
  color: #555;
}

.bg-gray {
  background-color: #f9fafb;
}

/* 버튼 우측 정렬 */
.action-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.button-group-right {
  display: flex;
  gap: 8px;
}

.mt-4 {
  margin-top: 24px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mr-2 {
  margin-right: 8px;
}

.mr-3 {
  margin-right: 12px;
}
</style>