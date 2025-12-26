<template>
  <el-dialog
    :model-value="visible"
    title="프로모션 추가"
    width="640px"
    @close="handleClose"
  >
    <!-- 유형 선택 -->
    <div class="type-toggle">
      <div
        class="type-card"
        :class="{ active: form.type === 'A' }"
        @click="form.type = 'A'"
      >
        <div class="type-title">자동 프로모션</div>
      </div>
      <div
        class="type-card"
        :class="{ active: form.type === 'M' }"
        @click="form.type = 'M'"
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

      <!-- 자동 프로모션: 발동 조건 필수 -->
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

      <!-- 일반 프로모션: 기간(시작일/종료일) 필수 -->
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

      <el-form-item label="상태" prop="status">
        <el-select v-model="form.status" placeholder="상태 선택">
            <!-- 자동 프로모션(A): 진행 중(A), 일시 정지(H) -->
            <template v-if="form.type === 'A'">
            <el-option label="진행 중" value="A" />
            <el-option label="일시 정지" value="H" />
            </template>

            <!-- 일반 프로모션(M): 시작 전(P), 진행 중(A), 기간 만료(C) -->
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
          등록
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
});

const emit = defineEmits(['update:visible', 'created']);

const formRef = ref(null);
const saving = ref(false);

// 날짜 범위(일반 프로모션용)
const dateRange = ref([]);

// 폼 모델
const form = reactive({
  name: '',
  startDate: null,
  endDate: null,
  status: 'A',
  type: 'A',
  triggerVal: '',
  content: '',
  segmentName: '',
});

// 유효성 검사 rules
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

// props.visible 변화 감지
watch(
  () => props.visible,
  (v) => {
    if (v) {
      resetForm();
    }
  }
);

const resetForm = () => {
  form.name = '';
  form.startDate = null;
  form.endDate = null;
  form.type = 'A';          // 기본: 자동
  form.triggerVal = '';
  form.content = '';
  form.segmentName = '';
  dateRange.value = [];
  formRef.value && formRef.value.clearValidate();
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
      }
    } else {
      // 자동: triggerVal 필수, 기간은 null
      form.startDate = null;
      form.endDate = null;
    }

    saving.value = true;
    try {
      await api.post('/promotion/insert', {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        type: form.type,
        triggerVal: form.triggerVal,
        content: form.content,
        segmentName: form.segmentName,
      });
      ElMessage.success('프로모션이 등록되었습니다.');
      emit('created');           // 부모에서 목록 재조회
      emit('update:visible', false);
    } catch (e) {
      ElMessage.error('프로모션 등록 중 오류가 발생했습니다.');
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
  margin-bottom: 20px;
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

.type-desc {
  font-size: 12px;
  color: #999;
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
