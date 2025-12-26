<template>
  <el-dialog
    :model-value="visible"
    title="프로모션 수정"
    width="640px"
    @close="handleClose"
  >
    <!-- 유형 선택은 수정 가능 여부에 따라 잠그고 싶으면 disabled 처리 -->
    <div class="type-toggle">
      <div
        class="type-card"
        :class="{ active: form.type === 'A' }"
        @click="changeType('A')"
      >
        <div class="type-title">자동 프로모션</div>
      </div>
      <div
        class="type-card"
        :class="{ active: form.type === 'M' }"
        @click="changeType('M')"
      >
        <div class="type-title">일반 프로모션</div>
      </div>
    </div>

    <el-form
      :model="form"
      :rules="rules"
      ref="formRef"
      label-width="120px"
      class="promo-form"
    >
      <el-form-item label="프로모션 이름" prop="name">
        <el-input
          v-model="form.name"
          placeholder="예: 신규 고객 환영 혜택"
        />
      </el-form-item>

      <el-form-item label="설명" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          rows="3"
          placeholder="예: 재계약 시 10% 할인"
        />
      </el-form-item>

      <!-- 자동: 발동 조건 -->
      <el-form-item
        v-if="form.type === 'A'"
        label="발동 조건"
        prop="triggerVal"
      >
        <el-input
          v-model="form.triggerVal"
          placeholder="예: 만료 3개월 전, VIP 등급 달성 시"
        />
      </el-form-item>

      <!-- 일반: 기간 -->
      <el-form-item
        v-if="form.type === 'M'"
        label="기간"
        prop="dateRange"
      >
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="~"
          start-placeholder="시작일"
          end-placeholder="종료일"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="대상 고객" prop="segmentName">
        <el-select
          v-model="form.segmentName"
          placeholder="대상 선택"
        >
          <el-option label="신규 고객" value="신규 고객" />
          <el-option label="일반 고객" value="일반 고객" />
          <el-option label="이탈 위험 고객" value="이탈 위험 고객" />
          <el-option label="VIP 고객" value="VIP 고객" />
          <el-option
            label="확장 의사 고객 (기회 고객)"
            value="확장 의사 고객 (기회 고객)"
          />
        </el-select>
      </el-form-item>

      <!-- 상태: 유형별 옵션 -->
      <el-form-item label="상태" prop="status">
        <el-select v-model="form.status" placeholder="상태 선택">
          <!-- 자동: 진행 중(A), 일시 정지(H) -->
          <template v-if="form.type === 'A'">
            <el-option label="진행 중" value="A" />
            <el-option label="일시 정지" value="H" />
          </template>
          <!-- 일반: 시작 전(P), 진행 중(A), 기간 만료(C) -->
          <template v-else>
            <el-option label="시작 전" value="P" />
            <el-option label="진행 중" value="A" />
            <el-option label="기간 만료" value="C" />
          </template>
        </el-select>
      </el-form-item>

    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">취소</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          수정 완료
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  // PromotionDetailModal에서 내려주는 상세 데이터
  promotion: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:visible', 'updated']);

const formRef = ref(null);
const saving = ref(false);

const form = reactive({
  promotionCode: '',
  name: '',
  startDate: null,
  endDate: null,
  status: 'A',
  type: 'A',
  triggerVal: '',
  content: '',
  segmentName: '',
});

const dateRange = ref([]);

const rules = {
  // 자동 프로모션일 때만 triggerVal 필수
  triggerVal: [
    {
      validator: (_, value, callback) => {
        if (form.type === 'A' && !value) {
          callback();
        } else {
          callback();
        }
      },
    },
  ],
  // 일반 프로모션일 때만 기간 필수
  dateRange: [
    {
      validator: (_, __, callback) => {
        if (form.type === 'M' && (!dateRange.value || dateRange.value.length !== 2)) {
          callback();
        } else {
          callback();
        }
      },
    },
  ],
};

// props.promotion이 들어올 때 폼 초기화
watch(
  () => props.promotion,
  (p) => {
    if (!p) return;
    form.promotionCode = p.promotionCode;
    form.name = p.name;
    form.type = p.type;
    form.status = p.status;
    form.triggerVal = p.triggerVal || '';
    form.content = p.content || '';
    form.segmentName = p.segmentName || '';

    if (p.type === 'M' && p.startDate && p.endDate) {
      // ISO 문자열에서 날짜만 추출
      const start = p.startDate.slice(0, 10);
      const end = p.endDate.slice(0, 10);
      dateRange.value = [start, end];
      form.startDate = p.startDate;
      form.endDate = p.endDate;
    } else {
      dateRange.value = [];
      form.startDate = null;
      form.endDate = null;
    }

    // 유형별 기본 상태 조정은 필요 시 추가
    formRef.value && formRef.value.clearValidate();
  },
  { immediate: true }
);

// 모달이 열릴 때도 validate 초기화
watch(
  () => props.visible,
  (v) => {
    if (v) {
      formRef.value && formRef.value.clearValidate();
    }
  }
);

const changeType = (t) => {
  form.type = t;
  // 타입 변경 시 상태 기본값 조정
  if (t === 'A' && !['A', 'H'].includes(form.status)) {
    form.status = 'A';
  }
  if (t === 'M' && !['P', 'A', 'C'].includes(form.status)) {
    form.status = 'P';
  }
};

const handleClose = () => {
  emit('update:visible', false);
};

const handleSubmit = () => {
    if (!form.name) {
        ElMessage.warning('프로모션 이름을 입력하세요.')
        return
    }
    if (form.type === 'A' && !form.triggerVal) {
        ElMessage.warning('발동 조건을 입력하세요.')
        return
    }
    if (form.type === 'M' && !dateRange.value) {
        console.log("수정시 타입:", form.type);
        console.log("유효기간:", form.startDate, form.endDate, dateRange.value);
        ElMessage.warning('유효기간을 선택하세요.')
        return
    }
    if (!form.segmentName) {
        ElMessage.warning('대상 고객을 선택하세요.')
        return
    }
    if (!form.status) {
        ElMessage.warning('상태를 선택하세요.')
        return
    }

  formRef.value.validate(async (valid) => {
    if (!valid) return;

    // type에 따라 startDate / endDate / triggerVal 세팅
    if (form.type === 'M') {
      // 일반: 기간 필수, triggerVal는 null
      form.triggerVal = null;
      if (dateRange.value && dateRange.value.length === 2) {
        form.startDate = dateRange.value[0] + 'T00:00:00';
        form.endDate = dateRange.value[1] + 'T23:59:59';
        console.log("유효기간:", form.startDate, form.endDate);
        console.log("발동조건:", form.triggerVal);
      }
    } else {
      // 자동: triggerVal 필수, 기간은 null
      console.log("프로모션 유형:", form.type);
      form.startDate = null;
      form.endDate = null;
    }


    

    saving.value = true;
    try {
      await api.put(`/promotion/update/${form.promotionCode}`, {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        type: form.type,
        triggerVal: form.triggerVal,
        content: form.content,
        segmentName: form.segmentName,
      });
      ElMessage.success('프로모션이 수정되었습니다.');
      emit('updated');
      emit('update:visible', false);
    } catch (e) {
      ElMessage.error('프로모션 수정 중 오류가 발생했습니다.');
      console.error(e);
    } finally {
      saving.value = false;
    }
  });
};
</script>

<style scoped>
.type-toggle {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}
.type-card {
  width: 200px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
}

.type-card.active {
  border-color: #248efff2;
}
.type-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.promo-form {
  margin-top: 8px;
}
.info-box {
  margin: 8px 0 0 120px;
  font-size: 12px;
  color: #606266;
}
</style>