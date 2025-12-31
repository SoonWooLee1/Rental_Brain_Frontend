<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/api/axios'
import StatusBadge from '@/components/overdue/StatusBadge.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const overdueId = route.params.overdueId
const detail = ref(null)
const loading = ref(false)

const paidDate = ref(new Date())

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
    <div class="detail-page" v-loading="loading">
    <!-- 헤더 -->
        <div class="header">
        <h2>수납 연체 상세</h2>
            <el-button @click="router.back()">목록으로</el-button>
        </div>

    <!-- 요약 카드 -->
    <div class="summary">
        <div class="summary-left">
            <h3>{{ detail?.payOverdueCode }}</h3>
            <StatusBadge :status="detail?.status" />
        </div>

        <el-button
            v-if="detail?.status === 'P'"
            type="primary"
            @click="resolveOverdue" > 해결 처리 </el-button>
    </div>

    <!-- 상세 정보 -->
    <el-descriptions
        :column="2"
        border
        class="desc-box">
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
            {{ formatDate(detail?.dueDate) }}1
        </el-descriptions-item>

        <el-descriptions-item label="연체 기간">
            <span class="danger">
            {{ detail?.overduePeriod }}일
            </span>
        </el-descriptions-item>

        <el-descriptions-item label="납부 완료일">
    <!-- 미해결 상태: 날짜 선택 -->
    <el-date-picker
        v-if="detail?.status === 'P'"
        v-model="paidDate"
        type="date"
        placeholder="납부 완료일 선택"
        :disabled-date="disableFutureDate" />

    <!-- 해결 완료 상태: 날짜 표시 -->
    <span v-else> {{ formatDate(detail?.paidDate) }} </span>
    </el-descriptions-item>
    </el-descriptions>
    </div>
</template>

<style scoped>
.detail-page { padding: 24px; }

/* 헤더 */
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

/* 요약 */
.summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #fafafa;
    border-radius: 12px;
    margin-bottom: 20px;
}

.summary-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.summary h3 { margin: 0 }

/* 설명 */
.desc-box { background: #fff; }

/* 강조 */
.danger { color: #ff4d4f; font-weight: 600; }

/* 반응형 */
@media (max-width: 768px) {
    .summary {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
}
</style>
