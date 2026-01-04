<template>
  <div class="page-container" v-loading="loading">
    <div class="header-row">
      <div class="title-area">
        <el-button @click="$router.go(-1)" circle class="mr-3">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h2 class="page-title">문의 상세 정보</h2>
      </div>
    </div>

    <el-card shadow="never" class="detail-card">
      
      <el-descriptions :column="2" border size="large">
        <el-descriptions-item label="문의 번호">{{ supportInfo.customerSupportCode }}</el-descriptions-item>
        <el-descriptions-item label="담당자">{{ supportInfo.empName || '미배정' }}</el-descriptions-item>
        <el-descriptions-item label="기업명">{{ supportInfo.customerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="카테고리">{{ supportInfo.categoryName }}</el-descriptions-item>
        
        <el-descriptions-item label="유입 채널">{{ supportInfo.channelName }}</el-descriptions-item>
        
        <el-descriptions-item label="상태">
          <el-tag :type="supportInfo.status === '완료' || supportInfo.status === 'C' ? 'success' : 'warning'">
            {{ (supportInfo.status === '완료' || supportInfo.status === 'C') ? '처리 완료' : '진행 중' }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="접수일시" :span="2">
          {{ formatDateTime(supportInfo.createDate) }}
        </el-descriptions-item>

        <el-descriptions-item label="제목" :span="2">
            <strong>{{ supportInfo.title }}</strong>
        </el-descriptions-item>
      </el-descriptions>

      <div class="content-section mt-4">
        <h3 class="section-title">문의 내용</h3>
        <div class="content-box">
          {{ supportInfo.content }}
        </div>
      </div>

      <div class="content-section mt-4">
        <h3 class="section-title">조치 결과</h3>
        <div class="content-box bg-gray">
          {{ supportInfo.action || '아직 조치 내용이 등록되지 않았습니다.' }}
        </div>
      </div>

      <div class="action-footer mt-4">
        <div class="button-group-right">

  <!-- 삭제 -->
  <el-tooltip
    v-if="!canProcessSupport"
    content="문의 처리 권한이 없습니다"
    placement="top"
  >
    <span>
      <el-button
        type="danger"
        plain
        :disabled="true"
        class="mr-2"
      >
        삭제
      </el-button>
    </span>
  </el-tooltip>

  <el-button
    v-else
    type="danger"
    plain
    class="mr-2"
    @click="handleDelete"
  >
    삭제
  </el-button>

  <!-- 수정 -->
  <el-tooltip
    v-if="!canProcessSupport"
    content="문의 처리 권한이 없습니다"
    placement="top"
  >
    <span>
      <el-button
        type="primary"
        plain
        :disabled="true"
        class="mr-2"
      >
        수정
      </el-button>
    </span>
  </el-tooltip>

  <el-button
    v-else
    type="primary"
    plain
    class="mr-2"
    @click="openEditModal"
  >
    수정
  </el-button>

  <!-- 상태 변경 -->
  <el-tooltip
    v-if="!canProcessSupport"
    content="문의 처리 권한이 없습니다"
    placement="top"
  >
    <span>
      <el-button
        :type="supportInfo.status === 'C' || supportInfo.status === '완료'
          ? 'warning'
          : 'success'"
        :disabled="true"
      >
        {{
          supportInfo.status === 'C' || supportInfo.status === '완료'
            ? '진행 중으로 변경'
            : '처리 완료로 변경'
        }}
      </el-button>
    </span>
  </el-tooltip>

  <el-button
    v-else
    :type="supportInfo.status === 'C' || supportInfo.status === '완료'
      ? 'warning'
      : 'success'"
    @click="supportInfo.status === 'C' || supportInfo.status === '완료'
      ? handleReopen()
      : handleComplete()"
  >
    {{
      supportInfo.status === 'C' || supportInfo.status === '완료'
        ? '진행 중으로 변경'
        : '처리 완료로 변경'
    }}
  </el-button>

</div>
      </div>
    </el-card>

    <el-dialog v-model="editModalVisible" title="문의 내역 수정" width="600px" destroy-on-close>
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="기업명">
          <el-input :model-value="supportInfo.customerName" disabled />
        </el-form-item>
        <el-form-item label="담당자">
           <el-select v-model="editForm.empId" placeholder="선택" style="width: 100%">
             <el-option v-for="emp in inChargeList" :key="emp.id" :label="emp.name" :value="emp.id" />
           </el-select>
        </el-form-item>
        <el-form-item label="제목">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="내용">
          <el-input v-model="editForm.content" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item label="조치사항">
          <el-input v-model="editForm.action" type="textarea" :rows="3" />
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
import { getSupportDetail, updateSupport, deleteSupport, getInChargeList } from '@/api/customersupport';
import { useAuthStore } from '@/store/auth.store';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const supportInfo = ref({});
const editModalVisible = ref(false);
const inChargeList = ref([]);
const authStore = useAuthStore();

const editForm = reactive({
  empId: null,
  title: '',
  content: '',
  action: '',
});

/** 문의 처리 권한 */
const canProcessSupport = computed(() =>
  authStore.hasAuth("CS_PROCESS")
);

const fetchData = async () => {
  loading.value = true;
  try {
    const id = route.params.id;
    const res = await getSupportDetail(id);
    if (res.data) {
      supportInfo.value = res.data;
    }
  } catch (e) {
    ElMessage.error('상세 정보를 불러오지 못했습니다.');
    router.push('/cs/supports');
  } finally {
    loading.value = false;
  }
};

const fetchInCharge = async () => {
    try {
        const res = await getInChargeList();
        if(res.data) inChargeList.value = res.data;
    } catch(e) {
        console.error("담당자 목록 로드 실패");
    }
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  return dateStr.replace('T', ' ');
};

const openEditModal = () => {
  Object.assign(editForm, {
    empId: supportInfo.value.empId,
    title: supportInfo.value.title,
    content: supportInfo.value.content,
    action: supportInfo.value.action
  });
  editModalVisible.value = true;
};

const submitUpdate = async () => {
  try {
    // DTO에 맞게 필드 구성 (기본 필드 외에 ID 등은 유지)
    const payload = {
        ...editForm,
        // 필요시 DTO에 맞는 추가 필드 매핑
    };
    await updateSupport(supportInfo.value.id, payload);
    ElMessage.success('수정되었습니다.');
    editModalVisible.value = false;
    fetchData();
  } catch (e) {
    ElMessage.error('수정 실패');
  }
};

const handleComplete = async () => {
  try {
    await updateSupport(supportInfo.value.id, { status: 'C' });
    ElMessage.success('완료 처리되었습니다.');
    fetchData();
  } catch (e) {
    ElMessage.error('처리 실패');
  }
};

const handleReopen = async () => {
  try {
    await updateSupport(supportInfo.value.id, { status: 'P' });
    ElMessage.success('진행 중으로 변경되었습니다.');
    fetchData();
  } catch (e) {
    ElMessage.error('처리 실패');
  }
};

const handleDelete = () => {
  ElMessageBox.confirm('정말 삭제하시겠습니까?', '경고', { type: 'warning' })
    .then(async () => {
      await deleteSupport(supportInfo.value.id);
      ElMessage.success('삭제되었습니다.');
      router.push('/cs/supports');
    });
};

onMounted(() => {
  fetchData();
  fetchInCharge();
});
</script>

<style scoped>
.page-container { padding: 20px; max-width: 1000px; margin: 0 auto; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.title-area { display: flex; align-items: center; gap: 10px; }
.page-title { margin: 0; font-size: 22px; font-weight: 700; color: #333; }
.mr-3 { margin-right: 12px; }

.detail-card { border-radius: 8px; padding: 20px; }

.section-title { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 10px; border-left: 4px solid #409eff; padding-left: 10px; }
.content-box { padding: 20px; border: 1px solid #eee; border-radius: 4px; min-height: 100px; white-space: pre-wrap; line-height: 1.6; color: #555; }
.bg-gray { background-color: #f9fafb; }

/* [변경] 버튼을 우측 정렬하기 위한 스타일 */
.action-footer { display: flex; justify-content: flex-end; border-top: 1px solid #eee; padding-top: 20px; }
.button-group-right { display: flex; gap: 8px; }

.mt-4 { margin-top: 24px; }
.mb-4 { margin-bottom: 16px; }
.mr-2 { margin-right: 8px; }
</style>