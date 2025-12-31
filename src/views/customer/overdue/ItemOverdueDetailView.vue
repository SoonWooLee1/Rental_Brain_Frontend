<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/api/axios'
import StatusBadge from '@/components/overdue/StatusBadge.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const overdueId = route.params.overdueId
const loading = ref(false)
const detail = ref(null)
const items = ref([])

/* 수정용 */
const editCount = ref(0)

/* 상세 조회 */
const fetchDetail = async () => {
    loading.value = true
    try {
        const { data } = await axios.get(`/customers/overdues/item/${overdueId}`)
        detail.value = data.detail ?? null
        items.value = data.items ?? []
        editCount.value = data.detail?.count ?? 0
    } finally {
        loading.value = false
    }
}

/* 날짜 포맷 */
const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toISOString().slice(0, 10)
}

/* 수정 가능 여부: 미해결(P)만 가능 */
const editable = computed(() => detail.value?.status === 'P')

/* 수량 저장 */
const saveCount = async () => {
    if (editCount.value < 0) {
        ElMessage.warning('수량은 0 이상이어야 합니다.')
        return
    }

    const isResolve = editCount.value === 0

    await ElMessageBox.confirm(
        isResolve
        ? '수량이 0입니다. 제품 연체를 해결 처리하시겠습니까?'
        : '연체 수량을 수정하시겠습니까?',
        '제품 연체 수정',
        { type: 'warning' }
    )

    await axios.put(`/customers/overdues/item/${overdueId}`, {
        count: editCount.value,
        resolved: isResolve
    })

    ElMessage.success(
        isResolve ? '제품 연체가 해결 처리되었습니다.' : '연체 수량이 수정되었습니다.'
    )

    fetchDetail()
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

onMounted(fetchDetail)
</script>

<template>
    <div class="detail-page" v-loading="loading">
        <!-- 헤더 -->
        <div class="header">
        <h2>제품 연체 상세</h2>
        <el-button @click="router.back()">목록으로</el-button>
    </div>

    <!-- 요약 -->
    <div class="summary">
        <div class="summary-left">
            <h3>{{ detail?.itemOverdueCode }}</h3>
            <StatusBadge :status="detail?.status" />
        </div>

        <el-button
            v-if="editable"
            type="primary"
            @click="saveCount" >
            수정 저장
        </el-button>
    </div>

    <!-- 기본 정보 -->
    <el-descriptions :column="2" border class="desc-box">
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

        <el-descriptions-item label="반납 예정일">
            {{ formatDate(detail?.dueDate) }}
        </el-descriptions-item>

        <el-descriptions-item label="연체 기간">
            <span class="danger">{{ detail?.overduePeriod }}일</span>
        </el-descriptions-item>

        <!-- 연체 수량 -->
        <el-descriptions-item label="연체 수량">
            <el-input-number
            v-if="editable"
            v-model="editCount"
            :min="0" />
        <span v-else>{{ detail?.count }}개</span>
        </el-descriptions-item>

        <el-descriptions-item label="상태">
            <StatusBadge :status="detail?.status" />
        </el-descriptions-item>
    </el-descriptions>

    <!-- 연체 제품 목록 -->
    <h3 class="section-title">연체된 제품 목록</h3>

    <el-table :data="items">
        <el-table-column prop="itemCode" label="제품 코드" />
        <el-table-column prop="itemName" label="제품명" />
        <el-table-column prop="itemStatus" label="상태" />
    </el-table>
    </div>
</template>


<style scoped>
.detail-page { padding: 24px; }

/* 헤더 */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

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

/* 강조 */
.danger {
    color: #ff4d4f;
    font-weight: 600;
}

/* 섹션 */
.section-title {
    margin: 24px 0 12px;
}

/* 반응형 */
@media (max-width: 768px) {
    .summary {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
}
</style>
