<template>
  <el-dialog
    :model-value="modelValue"
    width="760px"
    :title="dialogTitle"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @close="handleClose"
  >
    <div v-loading="loading" class="wrap">


      <div class="top">
        <div class="left">
          <div class="code">{{ detail?.quoteCode || '-' }}</div>
          <div class="sub">
            <el-tag size="small" effect="light">{{ detail?.channelName || '-' }}</el-tag>
            <span class="dot">•</span>
            <span>{{ (detail?.quoteCounselingDate) }}</span>
            <span class="dot">•</span>
            <span>{{ (detail?.quoteProcessingTime ?? '-') }}분</span>
          </div>
        </div>

        <div class="right">
          <div class="label">상담사</div>
          <div class="value">{{ detail?.quoteCounselor || '-' }}</div>
        </div>
      </div>

      <el-divider />

      <div class="section">
        <div class="section-title">요약</div>
        <div class="text">{{ detail?.quoteSummary || '-' }}</div>
      </div>

      <div class="section">
        <div class="section-title">상담 내용</div>
        <div class="text pre">{{ detail?.quoteContent || '-' }}</div>
      </div>

      <el-divider />

      <div class="section-title">고객 정보</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="기업명">
          {{ detail?.customerName || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="담당자">
          {{ detail?.customerInCharge || '-' }}
        </el-descriptions-item>

        <el-descriptions-item label="연락처">
          <a v-if="detail?.customerCallNum" :href="`tel:${detail.customerCallNum}`">
            {{ formatPhone(detail.customerCallNum) }}
          </a>
          <span v-else>-</span>
        </el-descriptions-item>

        <el-descriptions-item label="이메일">
          <a v-if="detail?.customerEmail" :href="`mailto:${detail.customerEmail}`">
            {{ detail.customerEmail }}
          </a>
          <span v-else>-</span>
        </el-descriptions-item>

        <el-descriptions-item label="주소" :span="2">
          {{ detail?.customerAddr || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <div class="meta">
        <span>quoteId: {{ detail?.quoteId ?? '-' }}</span>
        <span class="dot">•</span>
        <span>customerId: {{ detail?.quoteCumId ?? '-' }}</span>
        <span class="dot">•</span>
        <span>channelId: {{ detail?.quoteChannelId ?? '-' }}</span>
      </div>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <el-button type="primary" @click="handleEditRequest">수정</el-button>
        <el-button type="danger" @click="handleDelete" :loading="loading">삭제</el-button>
        <el-button @click="handleClose">닫기</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { getQuoteDetail, deleteQuote } from '@/api/quote'; // [수정] deleteQuote 추가

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  quoteId: { type: [Number, String], required: true },
});

// [수정] request-edit 추가
const emit = defineEmits(['update:modelValue', 'close', 'refresh', 'request-edit']);

const loading = ref(false);
const detail = ref(null);


// 연락처 하이픈 추가
const formatPhone = (v) => v ? v.replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3") : '-';


const dialogTitle = computed(() => {
  const name = detail.value?.customerName ? ` - ${detail.value.customerName}` : '';
  return `상담 상세${name}`;
});

// ✅ function 선언(호이스팅)로 TDZ 방지
async function fetchDetail() {
  if (!props.quoteId) return;

  loading.value = true;
  detail.value = null;

  try {
    console.log('[Modal] GET /quote/' + props.quoteId);
    const res = await getQuoteDetail(props.quoteId);
    detail.value = res?.data?.data ?? res?.data;
    console.log('[Modal] detail=', detail.value);
  } catch (e) {
    console.error('[Modal] error=', e);
    ElMessage.error('상담 상세 조회 실패');
  } finally {
    loading.value = false;
  }
}

// 수정 요청
const handleEditRequest = () => {
  if (!detail.value) return;
  // 현재 창 닫고, 부모에게 수정할 데이터를 보냄
  emit('update:modelValue', false); 
  emit('request-edit', detail.value);
};

// 삭제 처리
const handleDelete = async () => {
  if (!confirm('정말로 이 상담 내역을 삭제하시겠습니까?')) return;
  try {
    loading.value = true;
    await deleteQuote(props.quoteId); // DELETE /quote/delete/{id}
    ElMessage.success('삭제되었습니다.');
    emit('refresh'); // 목록 갱신
    handleClose();
  } catch (e) {
    console.error(e);
    ElMessage.error('삭제 중 오류가 발생했습니다.');
  } finally {
    loading.value = false;
  }
};

// ✅ immediate로 "처음 열릴 때"도 호출되게
watch(
  () => props.modelValue,
  (open) => {
    if (open) fetchDetail();
  },
  { immediate: true }
);

// ✅ quoteId가 나중에 세팅/변경돼도 재조회
watch(
  () => props.quoteId,
  (id) => {
    if (props.modelValue && id) fetchDetail();
  },
  { immediate: true }
);

const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
};
</script>


<style scoped>
.wrap { padding: 2px 2px 10px; }
.top { display:flex; justify-content:space-between; gap:16px; }
.code { font-size:18px; font-weight:800; color:#111827; }
.sub { margin-top:6px; font-size:12px; color:#6b7280; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.dot { color:#9ca3af; }
.right { text-align:right; }
.right .label { font-size:12px; color:#6b7280; }
.right .value { font-size:14px; font-weight:700; color:#111827; margin-top:4px; }
.section { margin-bottom:14px; }
.section-title { font-size:13px; font-weight:700; color:#111827; margin-bottom:6px; }
.text { font-size:13px; color:#374151; line-height:1.6; }
.text.pre { white-space:pre-wrap; }
a { color:#2563eb; text-decoration:none; }
a:hover { text-decoration:underline; }
</style>