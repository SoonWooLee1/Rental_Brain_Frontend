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
          placeholder="상담사 이름을 입력하세요" 
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
          @input="handleInputChange"
          :trigger-on-focus="false"
        >
          <template #default="{ item }">
            <div class="customer-item">
              <span class="name">{{ item.value }}</span> 
              <span class="sub-text" v-if="item.ceo">({{ item.ceo }})</span>
            </div>
          </template>
        </el-autocomplete>
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

const isEditMode = computed(() => !!props.editData && Object.keys(props.editData).length > 0);

const initForm = {
  quoteId: null,
  quoteCounselor: '',
  quoteChannelId: 1,
  quoteCounselingDate: '', 
  quoteProcessingTime: 10,
  customerName: '',
  quoteCumId: null, 
  customerCallNum: '',
  quoteSummary: '',
  quoteContent: '',
};

const form = reactive({ ...initForm });

const setToday = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localIso = new Date(now.getTime() - offset).toISOString().slice(0, 19);
    form.quoteCounselingDate = localIso;
};

// 데이터 매핑 함수 분리
const mapDataToForm = () => {
    if (isEditMode.value && props.editData) {
        const data = props.editData;
        console.log("수정 데이터 로드:", data); // 디버깅용 로그

        // ID 매핑 강화 (다양한 필드명 대응)
        form.quoteId = data.quoteId || data.id || data.quote_id; 
        
        // 데이터가 잘 들어왔는지 확인
        if (!form.quoteId) {
            console.error("quoteId를 찾을 수 없습니다! 데이터 구조를 확인하세요:", data);
        }

        form.quoteCounselor = data.counselor || data.quoteCounselor;
        form.quoteChannelId = data.channelId || data.quoteChannelId || 1;
        
        form.quoteCounselingDate = data.counselingDate 
            ? data.counselingDate.replace(' ', 'T') 
            : (data.quoteCounselingDate ? data.quoteCounselingDate.replace(' ', 'T') : '');
            
        form.quoteProcessingTime = data.processingTime || data.quoteProcessingTime || 10;
        
        // 고객 정보 매핑
        form.customerName = data.customerName || data.customer?.name;
        form.quoteCumId = data.cumId || data.quoteCumId || data.customerId;
        
        form.customerCallNum = data.customerPhone || data.customerCallNum || data.customer?.phone || '';
        form.quoteSummary = data.summary || data.quoteSummary;
        form.quoteContent = data.content || data.quoteContent;
    } else {
        Object.assign(form, initForm);
        setToday();
    }
};

// 모달 열림 여부 및 editData 변경을 모두 감지
watch(
  [() => props.modelValue, () => props.editData],
  ([newOpen, newData]) => {
    if (newOpen) {
      mapDataToForm();
    }
  },
  { immediate: true }
);

// 기업 검색 (Autocomplete)
const querySearchCustomer = async (queryString, cb) => {
  if (!queryString) {
    cb([]);
    return;
  }
  try {
  const res = await getCustomerList({
    name: queryString,
    status: 'ACTIVE'
  });

  const dataList = res.data?.contents || res.data || [];

  const results = dataList.map(item => ({
  value: item.name,
  id: item.id,
  phone: item.phone || item.callNum,
  ceo: item.inCharge || '',
}));
  cb(results);
  } catch (e) {
    console.error('기업 검색 실패:', e);
    cb([]);
  }
};

const handleSelectCustomer = (item) => {
  form.customerName = item.value; 
  form.quoteCumId = item.id; 
  form.customerCallNum = item.phone || '';
};

const handleInputChange = () => {
  form.quoteCumId = null;
};

const handleSubmit = async () => {
  if (!form.quoteCounselor) return ElMessage.warning('상담사를 입력해주세요.');
  if (!form.customerName) return ElMessage.warning('기업명을 입력해주세요.');
  if (!form.quoteCumId) return ElMessage.warning('기업명을 검색하여 목록에서 선택해주세요.');
  if (!form.quoteSummary) return ElMessage.warning('요약 제목을 입력해주세요.');

  try {
    loading.value = true;
    const payload = { ...form };

    // 수정 시 ID가 없으면 중단
    if (isEditMode.value && !form.quoteId) {
        ElMessage.error('상담 ID가 누락되어 수정할 수 없습니다.');
        loading.value = false;
        return;
    }

    if (isEditMode.value) {
        await updateQuote(form.quoteId, payload);
        ElMessage.success('수정되었습니다.');
    } else {
        await createQuote(payload);
        ElMessage.success('상담 내역이 등록되었습니다.');
    }
    emit('refresh');
    handleClose();
  } catch (e) {
    console.error(e);
    const action = isEditMode.value ? '수정' : '등록';
    ElMessage.error(`${action} 중 오류가 발생했습니다.`);
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
.section-title { 
    font-size: 14px; 
    font-weight: 700; 
    color: #333; 
    margin-bottom: 12px; 
    margin-top: 4px; 
    border-left: 4px solid #409EFF; 
    padding-left: 8px;
}
.unit { margin-left: 8px; color: #666; font-size: 13px; }
.dialog-footer { display: flex; justify-content: flex-end; }

.customer-item { 
    display: flex; 
    justify-content: space-between;
    align-items: center; 
    width: 100%; 
    padding: 4px 0; 
}
.name { font-weight: bold; color: #333; }
.sub-text { font-size: 12px; color: #999; margin-left: 8px; }
</style>