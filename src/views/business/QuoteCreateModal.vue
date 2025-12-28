<template>
  <el-dialog
    :title="isEditMode ? '상담 내역 수정' : '상담 내역 등록'"
    :model-value="modelValue"
    width="600px"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @close="handleClose"
  >
    <el-form :model="form" label-width="100px" ref="formRef">
      
      <div class="section-title">기본 정보</div>
      
      <el-form-item label="상담사" required>
        <el-input 
          v-model="form.quoteCounselor" 
          placeholder="상담사 이름을 입력하세요 (예: 박영희)" 
        />
      </el-form-item>
      
      <el-form-item label="상담 유형" required>
        <el-select v-model="form.quoteChannelId" placeholder="유형 선택" style="width: 100%">
           <el-option label="전화" :value="1" />
           <el-option label="이메일" :value="2" />
           <el-option label="웹(채팅, 게시판)" :value="3" />
           <el-option label="SNS" :value="4" />
           <el-option label="방문" :value="5" />
           <el-option label="기타" :value="6" />
        </el-select>
      </el-form-item>

      <el-form-item label="상담 일시" required>
         <el-date-picker
            v-model="form.quoteCounselingDate"
            type="datetime"
            placeholder="날짜 및 시간 선택"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss" 
          />
      </el-form-item>

       <el-form-item label="소요 시간">
        <el-input-number v-model="form.quoteProcessingTime" :min="0" :step="5" />
        <span class="unit">분</span>
      </el-form-item>

      <el-divider />

      <div class="section-title">고객 정보</div>
      
      <el-form-item label="기업명" required>
        <el-autocomplete
          v-model="form.customerName"
          :fetch-suggestions="querySearchCustomer"
          placeholder="기업명을 입력하면 자동 검색됩니다"
          style="width: 100%"
          @select="handleSelectCustomer"
          :trigger-on-focus="false"
          :disabled="isEditMode"
        >
          <template #default="{ item }">
            <div class="customer-item">
              <span class="name">{{ item.customerName }}</span>
              <span class="info">{{ item.customerInCharge || '담당자미정' }}</span>
            </div>
          </template>
        </el-autocomplete>
      </el-form-item>

      <el-form-item label="담당자">
        <el-input v-model="form.customerInCharge" placeholder="고객사 담당자 이름" />
      </el-form-item>
      <el-form-item label="연락처">
        <el-input v-model="form.customerCallNum" placeholder="010-0000-0000" />
      </el-form-item>

      <el-divider />

      <div class="section-title">상담 상세</div>
      <el-form-item label="요약 제목" required>
        <el-input v-model="form.quoteSummary" placeholder="상담 내용을 한 줄로 요약해주세요" />
      </el-form-item>
      <el-form-item label="상세 내용">
        <el-input
          v-model="form.quoteContent"
          type="textarea"
          :rows="5"
          placeholder="상세 상담 내용을 입력하세요"
        />
      </el-form-item>

    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">취소</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEditMode ? '수정' : '등록' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { createQuote, updateQuote } from '@/api/quote';
import { getCustomerList } from '@/api/customerlist';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  editData: { type: Object, default: null },
});

const emit = defineEmits(['update:modelValue', 'close', 'refresh']);

const loading = ref(false);
const formRef = ref(null);

const isEditMode = computed(() => !!props.editData);

const initForm = {
  quoteId: null,
  quoteCounselor: '',
  quoteChannelId: 1,
  quoteCounselingDate: '', 
  quoteProcessingTime: 10,
  customerName: '',
  quoteCumId: null, 
  customerInCharge: '',
  customerCallNum: '',
  quoteSummary: '',
  quoteContent: '',
};

const form = reactive({ ...initForm });

// 오늘 날짜 세팅
const setToday = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localIso = new Date(now.getTime() - offset).toISOString().slice(0, 19);
    form.quoteCounselingDate = localIso;
};

// 모달 초기화
watch(() => props.modelValue, (val) => {
    if (val) {
        if (props.editData) {
            const data = props.editData;
            form.quoteId = data.quoteId ?? data.id;
            form.quoteCounselor = data.quoteCounselor;
            form.quoteChannelId = data.quoteChannelId;
            form.quoteCounselingDate = data.quoteCounselingDate 
                ? data.quoteCounselingDate.replace(' ', 'T') 
                : '';
            form.quoteProcessingTime = data.quoteProcessingTime;
            form.customerName = data.customerName;
            form.quoteCumId = data.quoteCumId;
            form.customerInCharge = data.customerInCharge;
            form.customerCallNum = data.customerCallNum;
            form.quoteSummary = data.quoteSummary;
            form.quoteContent = data.quoteContent;
        } else {
            Object.assign(form, initForm);
            setToday();
        }
    }
});

// [중요 수정] 고객 검색 로직
const querySearchCustomer = async (queryString, cb) => {
  if (!queryString) {
    cb([]);
    return;
  }
  try {
    const res = await getCustomerList({ 
        customerName: queryString, 
        page: 1, 
        size: 20 
    });
    const dataList = res.data.contents || [];
    
    // [핵심] el-autocomplete는 각 객체의 'value' 속성을 화면에 표시합니다.
    // 따라서 API 결과에 value 속성을 추가해서 매핑해야 합니다.
    const results = dataList.map(item => ({
      ...item,
      value: item.customerName // 목록에 표시될 텍스트 지정
    }));
    
    cb(results);
  } catch (e) {
    console.error(e);
    cb([]);
  }
};

const handleSelectCustomer = (item) => {
  form.customerName = item.customerName;
  form.quoteCumId = item.customerId;
  form.customerInCharge = item.customerInCharge || '';
  form.customerCallNum = item.customerCallNum || '';
};

const handleSubmit = async () => {
  if (!form.quoteCounselor) return ElMessage.warning('상담사를 입력해주세요.');
  if (!form.quoteChannelId) return ElMessage.warning('상담 유형을 선택해주세요.');
  if (!form.quoteCounselingDate) return ElMessage.warning('상담 일시를 선택해주세요.');
  if (!form.customerName) return ElMessage.warning('기업명을 입력해주세요.');
  if (!form.quoteSummary) return ElMessage.warning('요약 제목을 입력해주세요.');

  try {
    loading.value = true;
    if (isEditMode.value) {
        await updateQuote(form.quoteId, form);
        ElMessage.success('수정되었습니다.');
    } else {
        await createQuote(form);
        ElMessage.success('상담 내역이 등록되었습니다.');
    }
    emit('refresh');
    handleClose();
  } catch (e) {
    console.error(e);
    const action = isEditMode.value ? '수정' : '등록';
    const errorMsg = e.response?.data?.message || `${action} 중 오류가 발생했습니다.`;
    ElMessage.error(errorMsg);
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
};
</script>

<style scoped>
.section-title { font-size: 14px; font-weight: 700; color: #333; margin-bottom: 12px; margin-top: 4px; }
.unit { margin-left: 8px; color: #666; font-size: 13px; }
.dialog-footer { display: flex; justify-content: flex-end; }

/* 검색 결과 아이템 스타일 */
.customer-item { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.name { font-weight: bold; color: #333; }
.info { font-size: 12px; color: #999; margin-left: 10px; }
</style>