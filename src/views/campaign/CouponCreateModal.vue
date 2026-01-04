<template>
  <el-dialog
    :model-value="visible"
    title="쿠폰 추가"
    width="720px"
    @close="handleClose"
  >
    <el-form
      :model="form"
      :rules="rules"
      ref="formRef"
      label-width="140px"
      class="coupon-form"
    >
      <!-- 쿠폰명 -->
      <el-form-item label="쿠폰명" prop="name">
        <el-input
          v-model="form.name"
          placeholder="예: 신규 기업 환영 쿠폰"
        />
      </el-form-item>

      <!-- 할인 유형 / 할인률(또는 금액) -->
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="할인 유형" prop="type">
            <el-select v-model="form.type" placeholder="할인 유형 선택">
              <el-option label="비율 할인" value="R" />
              <el-option label="금액 할인" value="A" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="할인률(%) / 금액" prop="rate">
            <el-input
              v-model.number="form.rate"
              type="number"
              :placeholder="ratePlaceholder"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 대상 세그먼트 / 최소 렌탈료 -->
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="대상 세그먼트" prop="segmentName">
            <el-select
              v-model="form.segmentName"
              placeholder="세그먼트 선택"
            >
              <el-option label="잠재 고객" value="잠재 고객" />
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
        </el-col>

        <el-col :span="12">
          <el-form-item label="최소 렌탈료" prop="minFee">
            <el-input
              v-model.number="form.minFee"
              type="number"
              placeholder="예: 500000 (원 단위)"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 유효기간 설정 방식 -->
      <el-form-item label="유효기간 설정 방식">
        <div class="period-toggle">
          <button
            type="button"
            class="period-btn"
            :class="{ active: periodMode === 'RANGE' }"
            @click="periodMode = 'RANGE'"
          >
            기간 설정
          </button>
          <button
            type="button"
            class="period-btn"
            :class="{ active: periodMode === 'PERIOD' }"
            @click="periodMode = 'PERIOD'"
          >
            발급 후 기간
          </button>
        </div>
      </el-form-item>

      <!-- 기간 설정: 시작일 / 마감일 -->
      <template v-if="periodMode === 'RANGE'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="시작일" prop="startDate">
              <el-date-picker
                v-model="dateRange[0]"
                type="date"
                placeholder="연도. 월. 일."
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="마감일" prop="endDate">
              <el-date-picker
                v-model="dateRange[1]"
                type="date"
                placeholder="연도. 월. 일."
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <!-- 발급 후 기간: N일 -->
      <template v-else>
        <el-form-item label="발급 후 사용 가능 기간" prop="datePeriod">
          <el-input
            v-model.number="form.datePeriod"
            type="number"
            placeholder="예: 30"
          />
          <div class="help-text">
            쿠폰 발급일로부터 N일간 사용 가능합니다.
          </div>
        </el-form-item>
      </template>

      <!-- 발급 가능 갯수 -->
      <el-form-item label="발급 가능 갯수" prop="maxNum">
        <el-input
          v-model.number="form.maxNum"
          type="number"
          placeholder="예: 100 (미입력 시 무제한)"
        />
        <div class="help-text">
          발급 가능한 최대 쿠폰 갯수를 설정합니다 (선택사항).
        </div>
      </el-form-item>

      <!-- 상세 설명 -->
      <el-form-item label="상세 설명" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          rows="4"
          placeholder="쿠폰에 대한 상세 설명을 입력하세요."
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">취소</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          + 추가
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/api/axios';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  recommendId: [Number, String, null]
});

const emit = defineEmits(['update:visible', 'created']);

const formRef = ref(null);
const saving = ref(false);

// 폼 데이터
const form = reactive({
  name: '',
  rate: null,
  content: '',
  type: 'R',          // 기본: 비율 할인
  startDate: null,
  endDate: null,
  datePeriod: null,
  minFee: null,
  maxNum: null,
  segmentName: '',
});

const fetchRecommendCoupon = async (id) => {
  try {
    const res = await api.get(`/recommend/coupon/read-one/${id}`)
    const data = res.data
    
    // 입력창 초기값 세팅
    form.name = data.name
    form.rate = data.rate
    form.content = data.content || ''
    form.segmentName = data.segmentName
    
    ElMessage.success('추천 데이터를 불러왔습니다')
  } catch (e) {
    ElMessage.error('추천 데이터를 불러오지 못했습니다')
    console.error(e)
  }
}

// 유효기간 설정 방식: RANGE(기간 설정) / PERIOD(발급 후 기간)
const periodMode = ref('RANGE');
const dateRange = ref([null, null]);

const ratePlaceholder = computed(() =>
  form.type === 'R' ? '예: 15 (%)' : '예: 50000 (원)'
);

// 유효성 검증
const rules = {
  name: [{ required: true, message: '쿠폰명을 입력하세요.' }],
  type: [{ required: true, message: '할인 유형을 선택하세요.' }],
  rate: [{ required: true, message: '할인률 또는 금액을 입력하세요.' }],
  segmentName: [{ required: true, message: '대상 세그먼트를 선택하세요.' }],
  minFee: [{ required: true, message: '최소 렌탈료를 입력하세요.' }],
  // 기간 설정일 때만 start/end 필요
  startDate: [
    {
      validator: (_, __, cb) => {
        if (periodMode.value === 'RANGE' && !dateRange.value[0]) {
          cb(new Error('시작일을 선택하세요.'));
        } else cb();
      },
    },
  ],
  endDate: [
    {
      validator: (_, __, cb) => {
        if (periodMode.value === 'RANGE' && !dateRange.value[1]) {
          cb(new Error('마감일을 선택하세요.'));
        } else cb();
      },
    },
  ],
  // 발급 후 기간 모드일 때만 datePeriod 필요
  datePeriod: [
    {
      validator: (_, value, cb) => {
        if (periodMode.value === 'PERIOD' && !value) {
          cb(new Error('발급 후 사용 가능 기간(일)을 입력하세요.'));
        } else cb();
      },
    },
  ],
};


const resetForm = () => {
  form.name = '';
  form.rate = null;
  form.content = '';
  form.type = 'R';
  form.startDate = null;
  form.endDate = null;
  form.datePeriod = null;
  form.minFee = null;
  form.maxNum = null;
  form.segmentName = '';
  periodMode.value = 'RANGE';
  dateRange.value = [null, null];
  formRef.value && formRef.value.clearValidate();
};

watch([() => props.recommendId, () => props.visible], async ([newId, isVisible]) => {
  if (newId && isVisible) {
    await fetchRecommendCoupon(newId)
  } else if (!isVisible) {
    resetForm()
  }
}, { immediate: true })

const handleClose = () => {
  emit('update:visible', false);
};

const handleSubmit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;

    // 기간 설정 방식에 따라 값 세팅
    if (periodMode.value === 'RANGE') {
      if (dateRange.value[0]) {
        form.startDate = dateRange.value[0] + 'T00:00:00';
      } else {
        form.startDate = null;
      }
      if (dateRange.value[1]) {
        form.endDate = dateRange.value[1] + 'T23:59:59';
      } else {
        form.endDate = null;
      }
      form.datePeriod = null;
    } else {
      // 발급 후 기간
      form.startDate = null;
      form.endDate = null;
      // datePeriod는 이미 form.datePeriod에 숫자로 들어있음
    }

    // maxNum은 선택사항: 빈 값이면 null 처리
    if (form.maxNum === '' || form.maxNum == null) {
      form.maxNum = null;
    }

    saving.value = true;
    try {
      await api.post('/coupon/insert', {
        name: form.name,
        rate: form.rate,
        content: form.content,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        datePeriod: form.datePeriod,
        minFee: form.minFee,
        maxNum: form.maxNum,
        segmentName: form.segmentName,
      });
      if (props.recommendId) {
        await api.put(`/recommend/coupon/update/${props.recommendId}`);
      }
      ElMessage.success('쿠폰이 등록되었습니다.');
      emit('created');
      emit('update:visible', false);
    } catch (e) {
      ElMessage.error('쿠폰 등록 중 오류가 발생했습니다.');
      console.error(e);
    } finally {
      saving.value = false;
    }
  });
};
</script>

<style scoped>
.coupon-form {
  margin-top: 8px;
}

.period-toggle {
  display: flex;
  width: 250px;
  gap: 8px;
}

.period-btn {
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  background: #fff;
  cursor: pointer;
}

.period-btn.active {
  border-color: #ff8a00;
  background: #fff7e6;
}

.help-text {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}
</style>
