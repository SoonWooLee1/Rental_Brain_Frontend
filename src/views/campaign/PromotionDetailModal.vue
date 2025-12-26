<template>
  <el-dialog
    :model-value="visible"
    width="540px"
    :title="detail?.name || '프로모션 상세'"
    @close="handleClose"
  >
    <el-skeleton v-if="loading" rows="6" animated />

    <div v-else-if="detail">
      <!-- 기본 정보 -->
      <div class="section">
        <div class="label">프로모션 ID</div>
        <div class="value">{{ detail.promotionCode }}</div>
      </div>

      <div class="section">
        <div class="label">유형</div>
        <div class="value">
          <el-tag type="info" effect="light">
            {{ typeLabel }}
          </el-tag>
        </div>
      </div>

      <div class="section">
        <div class="label">상태</div>
        <div class="value">
          <el-tag :type="statusTagType" effect="light">
            {{ statusLabel }}
          </el-tag>
        </div>
      </div>

      <!-- 자동 프로모션: 발동 조건 -->
      <div v-if="detail.type === 'A'" class="section">
        <div class="label">발동 조건</div>
        <div class="value">{{ detail.triggerVal || '-' }}</div>
      </div>

      <!-- 일반 프로모션: 유효 기간 -->
      <div v-else class="section">
        <div class="label">유효 기간</div>
        <div class="value">
          <span v-if="detail.startDate && detail.endDate">
            {{ formatDate(detail.startDate) }} ~
            {{ formatDate(detail.endDate) }}
          </span>
          <span v-else>-</span>
        </div>
      </div>

      <div class="section">
        <div class="label">대상 고객</div>
        <div class="value">{{ detail.segmentName }}</div>
      </div>

      <div class="section">
        <div class="label">제공 혜택</div>
        <div class="value">{{ detail.content }}</div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <!-- 자동 프로모션일 때만 시작/정지 버튼 -->
        <div class="left-actions" v-if="detail && detail.type === 'A'">
          <el-button
            v-if="detail.status === 'H'"
            type="primary"
            :loading="statusChanging"
            @click="changeStatus('A')"
          >
            시작
          </el-button>
          <el-button
            v-else-if="detail.status === 'A'"
            type="warning"
            :loading="statusChanging"
            @click="changeStatus('H')"
          >
            정지
          </el-button>
        </div>

        <div class="right-actions">
          <el-button @click="handleEdit" :disabled="!detail">
            수정
          </el-button>
          <el-button type="danger" @click="handleDelete" :disabled="deleting || !detail">
            삭제
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
  <PromotionEditModal
  v-model:visible="editModalVisible"
  :promotion="detail"
  @updated="handleEdited"
/>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/axios';
import PromotionEditModal from './PromotionEditModal.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  promotionCode: {
    type: String,
    default: null,
  },
});

const emit = defineEmits([
  'update:visible',
  'updated',
  'deleted',
  'edit', // 추후 PromotionEditModal 열 때 사용
]);

const detail = ref(null);
const loading = ref(false);
const statusChanging = ref(false);
const deleting = ref(false);

const typeLabel = computed(() => {
  if (!detail.value) return '';
  return detail.value.type === 'A' ? '자동 프로모션' : '일반 프로모션';
});

const statusLabel = computed(() => {
  if (!detail.value) return '';
  const s = detail.value.status;
  if (s === 'A') return '진행 중';
  if (s === 'H') return '일시 정지';
  if (s === 'P') return '시작 전';
  if (s === 'C') return '기간 만료';
  return '알수없음';
});

const statusTagType = computed(() => {
  if (!detail.value) return 'default';
  const s = detail.value.status;
  if (s === 'A') return 'success';
  if (s === 'H') return 'info';
  if (s === 'P') return 'warning';
  if (s === 'C') return 'default';
  return 'default';
});

// 날짜 포맷 (YYYY-MM-DD만)
const formatDate = (iso) => {
  if (!iso) return '';
  return iso.slice(0, 10);
};

const loadDetail = async () => {
  if (!props.promotionCode || !props.visible) return;
  loading.value = true;
  try {
    const res = await api.get(`/promotion/read-detail/${props.promotionCode}`);
    detail.value = res.data;
  } catch (e) {
    ElMessage.error('프로모션 상세를 불러오지 못했습니다.');
    console.error(e);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  (v) => {
    if (v) {
      loadDetail();
    } else {
      detail.value = null;
    }
  }
);

watch(
  () => props.promotionCode,
  () => {
    if (props.visible) {
      loadDetail();
    }
  }
);

// 상태 변경 (자동 프로모션 시작/정지)
const changeStatus = async (nextStatus) => {
  if (!detail.value) return;
  statusChanging.value = true;
  try {
    await api.put(`/promotion/update/${detail.value.promotionCode}`, {
      status: nextStatus,
    });
    ElMessage.success('상태가 변경되었습니다.');
    detail.value.status = nextStatus;
    emit('updated');
  } catch (e) {
    ElMessage.error('상태 변경 중 오류가 발생했습니다.');
    console.error(e);
  } finally {
    statusChanging.value = false;
  }
};

const handleDelete = async () => {
  if (!detail.value) return;
  try {
    await ElMessageBox.confirm(
      '정말로 이 프로모션을 삭제하시겠습니까?',
      '삭제 확인',
      {
        type: 'warning',
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
      }
    );
  } catch {
    return;
  }

  deleting.value = true;
  try {
    await api.delete(`/promotion/delete/${detail.value.promotionCode}`);
    ElMessage.success('프로모션이 삭제되었습니다.');
    emit('deleted');
    emit('update:visible', false);
  } catch (e) {
    ElMessage.error('삭제 중 오류가 발생했습니다.');
    console.error(e);
  } finally {
    deleting.value = false;
  }
};

const handleEdit = () => {
  if (!detail.value) return;
  editModalVisible.value = true;
};

const editModalVisible = ref(false);

const handleEdited = () => {
  // 수정 후 상세/목록 새로고침
  loadDetail();
  emit('updated');
};

const handleClose = () => {
  emit('update:visible', false);
};
</script>

<style scoped>
.section {
  display: flex;
  margin-bottom: 8px;
}
.label {
  width: 100px;
  color: #909399;
}
.value {
  flex: 1;
}
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.left-actions {
  display: flex;
  gap: 8px;
}
.right-actions {
  display: flex;
  margin-left: auto;
  gap: 3px;
}
</style>
