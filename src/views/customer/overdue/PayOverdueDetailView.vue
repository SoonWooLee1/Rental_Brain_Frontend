<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/api/axios'
import StatusBadge from '@/components/overdue/StatusBadge.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth.store'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore();

const overdueId = route.params.overdueId
const detail = ref(null)
const loading = ref(false)

const paidDate = ref(new Date())

/** 연체 해결 처리 권한 */
const canProcessOverdue = computed(() =>
  authStore.hasAuth("OVERDUE_PROCESS")
);

/* 상세 조회 */
const fetchDetail = async () => {
    loading.value = true
    try {
        const overdueId = route.params.overdueId

        const { data } = await axios.get(
        `/customers/overdues/pay/${overdueId}`
        )
        detail.value = data
    } catch (e) {
        console.error('수납 연체 상세 조회 실패', e)
    } finally {
        loading.value = false
    }
}

/* 날짜 포맷 */
const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ko-KR')
}

/* 미래 날짜 선택 방지 */ 
const disableFutureDate = (date) => {
    return date.getTime() > Date.now()
}

/* 해결 처리 */
const resolveOverdue = async () => {
    if (!paidDate.value) {
        ElMessage.warning('납부 완료일을 선택해주세요.')
        return
    }

    try {
        const year = paidDate.value.getFullYear()
        const month = String(paidDate.value.getMonth() + 1).padStart(2, '0')
        const day = String(paidDate.value.getDate()).padStart(2, '0')
        const dateOnly = `${year}-${month}-${day}`

        await ElMessageBox.confirm(
        `납부 완료일을 ${formatDate(paidDate.value)}로 처리하시겠습니까?`, '수납 연체 해결',
        { type: 'warning' })

    await axios.put(
        `/customers/overdues/pay/${overdueId}`,
        { paidDate: dateOnly } )

    ElMessage.success('수납 연체가 해결 처리되었습니다.')
    fetchDetail()
    } catch (e) {
        if (e !== 'cancel') {
        console.error('수납 연체 해결 처리 실패', e)
        ElMessage.error('연체 해결 처리 중 오류가 발생했습니다.')
        }
    }
}

/* 연락처 포맷: 02-6100-0060 / 010-1234-5678 */
const formatPhone = (value) => {
  if (!value) return '-'
  const d = String(value).replace(/\D/g, '')

  // 02 지역번호
  if (d.startsWith('02')) {
    if (d.length === 9)  return d.replace(/^(\d{2})(\d{3})(\d{4})$/, '$1-$2-$3')   // 02-123-4567
    if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, '$1-$2-$3')  // 02-1234-5678
  }

  // 휴대폰/기타 지역번호(3자리)
  if (d.length === 10) return d.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')    // 031-123-4567
  if (d.length === 11) return d.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3')    // 010-1234-5678

  return value
}

/* 금액 포맷: 5,320,000 -> 532만원 (제품목록 스타일) */
const formatMoneyMan = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  const man = Math.round(n / 10000)   // 정수 만원 단위 (반올림)
  return `${man}만원`
}

onMounted(fetchDetail)
</script>

<template>
  <div class="page-container" v-loading="loading">
    <!-- 헤더 -->
    <div class="header-row">
      <div class="title-area">
        <el-button @click="$router.go(-1)" circle class="mr-3">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h2 class="page-title">수납 연체 상세</h2>
      </div>

      <!-- 액션 버튼 -->
      <div>
        <!-- 권한 없음 -->
        <el-tooltip
          v-if="detail?.status === 'P' && !canProcessOverdue"
          content="연체 처리 권한이 없습니다"
          placement="bottom"
        >
          <span>
            <el-button type="primary" disabled>해결 처리</el-button>
          </span>
        </el-tooltip>

        <!-- 권한 있음 -->
        <el-button
          v-else-if="detail?.status === 'P'"
          type="primary"
          @click="resolveOverdue"
        >
          해결 처리
        </el-button>
      </div>
    </div>

    <!-- 상세 카드 -->
    <el-card shadow="never" class="detail-card">
      <!-- 요약 -->
      <div class="summary-box">
        <h3>{{ detail?.payOverdueCode }}</h3>
        <StatusBadge :status="detail?.status" />
      </div>

      <!-- 기본 정보 -->
      <el-descriptions :column="2" border size="large">
        <el-descriptions-item label="기업명">
          {{ detail?.customerName }}
        </el-descriptions-item>

        <el-descriptions-item label="담당자">
          {{ detail?.inCharge }}
        </el-descriptions-item>

        <el-descriptions-item label="연락처">
          {{ formatPhone(detail?.callNum) }}
        </el-descriptions-item>

        <el-descriptions-item label="계약 ID">
          {{ detail?.contractCode }}
        </el-descriptions-item>

        <el-descriptions-item label="월 납부 금액">
          {{ formatMoneyMan(detail?.monthlyPayment) }}
        </el-descriptions-item>

        <el-descriptions-item label="납부 예정일">
          {{ formatDate(detail?.dueDate) }}
        </el-descriptions-item>

        <el-descriptions-item label="연체 기간">
          <span class="danger">{{ detail?.overduePeriod }}일</span>
        </el-descriptions-item>

        <el-descriptions-item label="납부 완료일">
          <!-- 미해결 -->
          <el-date-picker
            v-if="detail?.status === 'P'"
            v-model="paidDate"
            type="date"
            placeholder="납부 완료일 선택"
            :disabled-date="disableFutureDate"
          />
          <!-- 해결 완료 -->
          <span v-else>
            {{ formatDate(detail?.paidDate) }}
          </span>
        </el-descriptions-item>

        <el-descriptions-item label="상태">
          <StatusBadge :status="detail?.status" />
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>


<style scoped>
.page-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.header-row {
  display: flex;
  justify-content: space-between;
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

.detail-card {
  border-radius: 8px;
  padding: 20px;
}

.summary-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.danger {
  color: #ff4d4f;
  font-weight: 600;
}

.mr-3 {
  margin-right: 12px;
}

</style>
