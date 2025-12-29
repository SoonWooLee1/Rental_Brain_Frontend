<template>
  <el-dialog
    :model-value="visible"
    width="600px"
    :title="detail?.name || '쿠폰 상세'"
    @close="handleClose"
  >
    <el-skeleton v-if="loading" rows="6" animated />

    <div v-else-if="detail">
      <!-- 기본 정보 -->
      <div class="section">
        <div class="label">쿠폰 코드</div>
        <div class="value">{{ detail.couponCode }}</div>
      </div>

      <div class="section">
        <div class="label">할인 유형</div>
        <div class="value">
          {{ typeLabel }} ({{ detail.rate }}{{ detail.type === 'R' ? '%' : '원' }})
        </div>
      </div>

      <div class="section">
        <div class="label">대상 세그먼트</div>
        <div class="value">{{ detail.segmentName }}</div>
      </div>

      <div class="section">
        <div class="label">최소 렌탈료</div>
        <div class="value">{{ formatToManWon(detail.minFee) }}</div>
      </div>

      <!-- 유효 기간 / 발급 후 기간 -->
      <div class="section">
        <div class="label">유효기간</div>
        <div class="value">
          <template v-if="detail.startDate && detail.endDate">
            {{ formatDate(detail.startDate) }} ~
            {{ formatDate(detail.endDate) }}
          </template>
          <template v-else-if="detail.datePeriod">
            발급 후 {{ detail.datePeriod }}일
          </template>
          <template v-else>
            -
          </template>
        </div>
      </div>

      <div class="section">
        <div class="label">상세 설명</div>
        <div class="value">{{ detail.content }}</div>
      </div>

      <!-- 사용 현황 -->
      <div class="usage-wrapper">
        <div class="usage-header">사용 현황</div>
        <div class="usage-stats">
          <div class="usage-item">
            <div class="usage-number blue">{{ detail.issued }}건</div>
            <div class="usage-label">발급 건수</div>
          </div>
          <div class="usage-item">
            <div class="usage-number green">{{ detail.used }}건</div>
            <div class="usage-label">사용 건수</div>
          </div>
          <div class="usage-item">
            <div class="usage-number purple">{{ detail.usedRate }}%</div>
            <div class="usage-label">사용률</div>
          </div>
        </div>
        <div class="usage-bar">
          <div class="usage-bar-track">
            <div
              class="usage-bar-fill"
              :style="{ width: Math.min(detail.usedRate || 0, 100) + '%' }"
            ></div>
          </div>
          <div class="usage-bar-scale">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="left-actions"></div>
        <div class="right-actions">
          <el-button @click="openEdit" :disabled="!detail">수정</el-button>
          <el-button
            type="danger"
            @click="handleDelete"
            :loading="deleting"
            :disabled="!detail"
          >
            삭제
          </el-button>
        </div>
      </div>

      <!-- 수정 모달 -->
      <CouponEditModal
        v-model:visible="editVisible"
        :coupon="detail"
        @updated="handleUpdatedFromEdit"
      />
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/axios';
import CouponEditModal from './CouponEditModal.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  couponCode: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['update:visible', 'updated', 'deleted']);

const detail = ref(null);
const loading = ref(false);
const deleting = ref(false);
const editVisible = ref(false);

const typeLabel = computed(() => {
  if (!detail.value) return '';
  return detail.value.type === 'R' ? '비율 할인' : '금액 할인';
});

const formatDate = (iso) => {
  if (!iso) return '';
  return iso.slice(0, 10);
};

const formatToManWon = (value) => {
  if (value == null) return '0';
  const num = Number(value);
  if (Number.isNaN(num)) return '0';
  const man = num / 10000;
  const fixed = Number(man.toFixed(1));
  if (fixed === 0) return '0';
  if (Number.isInteger(fixed)) return `${fixed}만원`;
  return `${fixed}만원`;
};

// 상세 조회
const loadDetail = async () => {
  if (!props.couponCode || !props.visible) return;
  loading.value = true;
  try {
    const res = await api.get(`/coupon/read-detail/${props.couponCode}`);
    detail.value = res.data;
    console.log('detail', detail.value);
  } catch (e) {
    ElMessage.error('쿠폰 상세를 불러오지 못했습니다.');
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
  () => props.couponCode,
  () => {
    if (props.visible) {
      loadDetail();
    }
  }
);

const openEdit = () => {
  if (!detail.value) return;
  editVisible.value = true;
};

const handleUpdatedFromEdit = () => {
  loadDetail();
  emit('updated');
};

const handleDelete = async () => {
  if (!detail.value) return;
  try {
    await ElMessageBox.confirm(
      '정말로 이 쿠폰을 삭제하시겠습니까?',
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
    await api.delete(`/coupon/delete/${detail.value.couponCode}`);
    ElMessage.success('쿠폰이 삭제되었습니다.');
    emit('deleted');
    emit('update:visible', false);
  } catch (e) {
    ElMessage.error('쿠폰 삭제 중 오류가 발생했습니다.');
    console.error(e);
  } finally {
    deleting.value = false;
  }
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
  width: 120px;
  color: #909399;
}
.value {
  flex: 1;
}

/* 사용 현황 */
.usage-wrapper {
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}
.usage-header {
  font-weight: 600;
  margin-bottom: 12px;
}
.usage-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}
.usage-item {
  text-align: center;
  flex: 1;
}
.usage-number {
  font-size: 20px;
  font-weight: 700;
}
.usage-number.blue {
  color: slateblue;
}
.usage-number.green {
  color: slateblue;
}
.usage-number.purple {
  color: skyblue;
}
.usage-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.usage-bar {
  margin-top: 4px;
}
.usage-bar-track {
  height: 10px;
  width: 500px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}
.usage-bar-fill {
  height: 100%;
  background: skyblue;
}
.usage-bar-scale {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

/* footer */
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.right-actions {
  display: flex;
  gap: 8px;
}
</style>
