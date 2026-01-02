<template>
    <div class="page-container" v-loading="loading">
  
      <!-- ===== Header ===== -->
      <div class="header-row">
        <div class="title-area">
          <el-button @click="$router.go(-1)" circle class="mr-3">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <h2 class="page-title">견적 · 상담 상세</h2>
        </div>
      </div>
  
      <!-- ===== Detail Card ===== -->
      <el-card shadow="never" class="detail-card">
  
        <!-- 상단 요약 -->
        <div class="top">
          <div class="left">
            <div class="code">{{ quote.quoteCode || '-' }}</div>
            <div class="sub">
              <el-tag size="small" effect="light">
                {{ quote.channelName || '-' }}
              </el-tag>
              <span class="dot">•</span>
              <span>{{ formatDateTime(quote.quoteCounselingDate) }}</span>
              <span class="dot">•</span>
              <span>{{ quote.quoteProcessingTime ?? '-' }}분</span>
            </div>
          </div>
  
          <div class="right">
            <div class="label">상담사</div>
            <div class="value">{{ quote.quoteCounselor || '-' }}</div>
          </div>
        </div>
  
        <el-divider />
  
        <!-- 요약 -->
        <div class="section">
          <div class="section-title">요약</div>
          <div class="text">
            {{ quote.quoteSummary || '-' }}
          </div>
        </div>
  
        <!-- 상담 내용 -->
        <div class="section">
          <div class="section-title">상담 내용</div>
          <div class="text pre">
            {{ quote.quoteContent || '-' }}
          </div>
        </div>
  
        <el-divider />
  
        <!-- 고객 정보 -->
        <div class="section-title">고객 정보</div>
        <el-descriptions :column="2" border size="large">
          <el-descriptions-item label="기업명">
            {{ quote.customerName || '-' }}
          </el-descriptions-item>
  
          <el-descriptions-item label="담당자">
            {{ quote.customerInCharge || '-' }}
          </el-descriptions-item>
  
          <el-descriptions-item label="연락처">
            <a
              v-if="quote.customerCallNum"
              :href="`tel:${quote.customerCallNum}`"
            >
              {{ formatPhone(quote.customerCallNum) }}
            </a>
            <span v-else>-</span>
          </el-descriptions-item>
  
          <el-descriptions-item label="이메일">
            <a
              v-if="quote.customerEmail"
              :href="`mailto:${quote.customerEmail}`"
            >
              {{ quote.customerEmail }}
            </a>
            <span v-else>-</span>
          </el-descriptions-item>
  
          <el-descriptions-item label="주소" :span="2">
            {{ quote.customerAddr || '-' }}
          </el-descriptions-item>
        </el-descriptions>
  
        <!-- 메타 정보 -->
        <div class="meta mt-4">
          <span>quoteId: {{ quote.quoteId ?? '-' }}</span>
          <span class="dot">•</span>
          <span>customerId: {{ quote.quoteCumId ?? '-' }}</span>
          <span class="dot">•</span>
          <span>channelId: {{ quote.quoteChannelId ?? '-' }}</span>
        </div>
  
        <!-- 액션 버튼 -->
        <div class="action-footer mt-4">
          <div class="button-group-right">
            <el-button type="danger" plain @click="handleDelete">
              삭제
            </el-button>
            <el-button type="primary" plain @click="openEditModal">
              수정
            </el-button>
          </div>
        </div>
  
      </el-card>
  
      <!-- ===== 수정 모달 (기존 QuoteCreateModal 재사용) ===== -->
      <QuoteCreateModal
        v-if="editModalVisible"
        v-model="editModalVisible"
        :edit-data="quote"
        @refresh="fetchData"
      />
  
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ArrowLeft } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  
  import { getQuoteDetail, deleteQuote } from '@/api/quote'
  import QuoteCreateModal from './QuoteCreateModal.vue'
  
  /* =========================
     Router
  ========================= */
  const route = useRoute()
  const router = useRouter()
  
  /* =========================
     State
  ========================= */
  const loading = ref(false)
  const quote = ref({})
  const editModalVisible = ref(false)
  
  /* =========================
     Fetch
  ========================= */
  const fetchData = async () => {
    loading.value = true
    try {
      const id = route.params.id
      const res = await getQuoteDetail(id)
      quote.value = res?.data?.data ?? res?.data
    } catch (e) {
      console.error(e)
      ElMessage.error('견적 상담 상세 정보를 불러오지 못했습니다.')
      router.push('/quote')
    } finally {
      loading.value = false
    }
  }
  
  /* =========================
     Actions
  ========================= */
  const openEditModal = () => {
    editModalVisible.value = true
  }
  
  const handleDelete = () => {
    ElMessageBox.confirm(
      '정말로 이 상담 내역을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.',
      '삭제 확인',
      { type: 'warning' }
    ).then(async () => {
      try {
        await deleteQuote(quote.value.quoteId)
        ElMessage.success('삭제되었습니다.')
        router.push('/quote')
      } catch (e) {
        ElMessage.error('삭제 중 오류가 발생했습니다.')
      }
    })
  }
  
  /* =========================
     Utils
  ========================= */
  const formatDateTime = (v) => {
    if (!v) return '-'
    return v.replace('T', ' ')
  }
  
  const formatPhone = (v) =>
    v
      ? v.replace(
          /(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,
          '$1-$2-$3'
        )
      : '-'
  
  /* =========================
     Lifecycle
  ========================= */
  onMounted(fetchData)
  </script>
  
  <style scoped>
  .page-container {
    padding: 20px;
    max-width: 1000px;
    margin: 0 auto;
  }
  
  /* Header */
  .header-row {
    display: flex;
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
  .mr-3 {
    margin-right: 12px;
  }
  
  /* Card */
  .detail-card {
    border-radius: 8px;
    padding: 20px;
  }
  
  /* Top */
  .top {
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }
  .code {
    font-size: 18px;
    font-weight: 800;
    color: #111827;
  }
  .sub {
    margin-top: 6px;
    font-size: 12px;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .dot {
    color: #9ca3af;
  }
  .right {
    text-align: right;
  }
  .right .label {
    font-size: 12px;
    color: #6b7280;
  }
  .right .value {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    margin-top: 4px;
  }
  
  /* Section */
  .section {
    margin-bottom: 16px;
  }
  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 6px;
  }
  .text {
    font-size: 13px;
    color: #374151;
    line-height: 1.6;
  }
  .text.pre {
    white-space: pre-wrap;
  }
  
  /* Meta */
  .meta {
    font-size: 12px;
    color: #9ca3af;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  
  /* Footer */
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
  </style>
  