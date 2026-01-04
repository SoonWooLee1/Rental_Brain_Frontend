<template>
  <div class="page-container" v-loading="loading">

    <!-- ===== Header ===== -->
    <div class="detail-header">
      <div class="header-left">
        <el-button circle plain @click="goList">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>

        <div>
          <h2 class="title">{{ vm.contractName }}</h2>
          <p class="sub">{{ vm.contractCode }}</p>
        </div>
      </div>
      <div class="header-right">
        <!-- 계약 해지 가능 상태 -->
<template v-if="vm.contractStatus === 'P' || vm.contractStatus === 'I'">

  <!-- 권한 없음 -->
  <el-tooltip
    v-if="!canTerminateContract"
    content="계약 해지 권한이 없습니다"
    placement="top"
  >
    <span>
      <el-button type="danger" plain disabled>
        계약 해지
      </el-button>
    </span>
  </el-tooltip>

  <!-- 권한 있음 -->
  <el-button
    v-else
    type="danger"
    plain
    @click="openTerminateModal"
  >
    계약 해지
  </el-button>

</template>
      </div>
    </div>

    <!-- ===== Progress / KPI ===== -->
    <el-card shadow="never" class="summary-card">
      <div class="summary-grid">
        <div>
          <div class="progress-label">계약 진행률</div>
          <el-progress :percentage="vm.progressRate" :stroke-width="12" />
        </div>

        <div class="kpi">
          <p class="kpi-title">월 납부액</p>
          <p class="kpi-value">{{ money(vm.monthlyPayment) }}</p>
        </div>

        <div class="kpi">
          <p class="kpi-title">총 계약 금액</p>
          <p class="kpi-value">{{ money(vm.totalAmount) }}</p>
        </div>

        <div class="kpi danger">
          <p class="kpi-title">연체 건수</p>
          <p class="kpi-value">{{ vm.overdueCount }}건</p>
        </div>
      </div>
    </el-card>

    <!-- ===== Tabs ===== -->
    <el-tabs
      v-model="activeTab"
      type="border-card"
      class="detail-tabs"
    >

      <!-- 계약 개요 -->
      <el-tab-pane label="계약 개요" name="overview">
        <div class="overview-grid">
        
          <!-- ===== 계약 기본 정보 ===== -->
          <el-card class="overview-card basic-info" shadow="never">
            <template #header>
              <span class="card-title">계약 기본 정보</span>
            </template>
          
            <el-descriptions :column="3" border>
              <el-descriptions-item label="계약 코드">{{ vm.contractCode }}</el-descriptions-item>
              <el-descriptions-item label="고객 코드">{{ vm.customerCode }}</el-descriptions-item>
              <el-descriptions-item label="고객명">{{ vm.customerName }}</el-descriptions-item> 
              
              <el-descriptions-item label="담당자">{{ vm.inCharge }}</el-descriptions-item>
              <el-descriptions-item label="연락처">{{ formatPhone(vm.callNum) }}</el-descriptions-item>
              <el-descriptions-item label="계약 시작일">{{ formatDate(vm.startDate) }}</el-descriptions-item>
              
              <el-descriptions-item label="계약 기간">{{ vm.contractPeriod }} 개월</el-descriptions-item>
              <el-descriptions-item label="결제 방식">{{ vm.payMethodLabel }}</el-descriptions-item>
              <el-descriptions-item label="렌탈 자산 수">{{ vm.productCount }} 종</el-descriptions-item>
            </el-descriptions>
          </el-card>
        
          <!-- ===== 특이 사항 (메모) ===== -->
          <el-card class="overview-card memo-info" shadow="never">
            <template #header>
              <span class="card-title">특이 사항</span>
            </template>
          
            <el-input
              v-model="vm.specialContent"
              type="textarea"
              :rows="14"
              readonly
              placeholder="특이 사항이 없습니다."
              class="memo-textarea"
            />
          </el-card>
        
        </div>
      </el-tab-pane>

      <!-- 렌탈 자산 -->
      <el-tab-pane label="렌탈 자산" name="items">
        <el-row :gutter="20">
        
          <!-- ===== 요약 영역 ===== -->
          <el-col :span="8">
            <el-card shadow="never">
              <template #header>
                <div class="card-title">상품 요약</div>
                <div class="hint">상품을 클릭하면 상세 표시됩니다</div>
              </template>
            
              <el-table
                :data="itemSummary"
                highlight-current-row
                :row-class-name="summaryRowClass"
                style="width: 100%"
                @row-click="row => selectedItemName = row.itemName"
              >
                <el-table-column
                  prop="itemName"
                  label="상품명"
                />
                <el-table-column
                  prop="quantity"
                  label="수량"
                  width="80"
                  align="center"
                />
              </el-table>
            </el-card>
          </el-col>
        
          <!-- ===== 상세 영역 ===== -->
          <el-col :span="16">
            <el-card shadow="never">
              <template #header>
                <span class="card-title">
                  {{ selectedItemName ? `${selectedItemName} 상세` : '상품 선택' }}
                </span>
              </template>
            
              <el-table
                :data="filteredItems"
                border
                stripe
                empty-text="상품을 선택하세요"
              >
                <el-table-column prop="itemCode" label="자산 코드" width="160" />
                <el-table-column prop="name" label="자산명" />
                <el-table-column
                  prop="latelyInspectDate"
                  label="최근 점검일"
                  width="140"
                />
              </el-table>
            </el-card>
          </el-col>
        
        </el-row>
      </el-tab-pane>

      <!-- 결제 내역 -->
      <el-tab-pane label="결제 내역" name="payments">
        <el-table :data="payments" border stripe size="large">
          <el-table-column label="납부 예정일" width="210">
            <template #default="{ row }">{{ formatDate(row.paymentDue) }}</template>
          </el-table-column>

          <el-table-column label="실제 납부일" width="210">
            <template #default="{ row }">
              {{ row.paymentActual ? formatDate(row.paymentActual) : '-' }}
            </template>
          </el-table-column>

          <el-table-column label="상태" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="paymentStatusTag(row.paymentStatus)">
                {{ paymentStatusLabel(row.paymentStatus) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="연체 일수" width="120" align="center">
            <template #default="{ row }">
            <span :class="row.overdueDays > 0 ? 'overdue' : ''">
              {{ row.overdueDays !== null ? row.overdueDays : '-' }}
            </span>
            </template>
          </el-table-column>

          <el-table-column label="납부 처리" width="260">
            <template #default="{ row }">
            
              <!-- 납부 가능 조건 -->
              <template v-if="canPay(row)">
                <el-date-picker
                  v-model="row._editPaymentActual"
                  type="date"
                  size="small"
                  placeholder="납부일 선택"
                  style="width: 140px"
                  :disabled="false"
                />
              
                <el-button
                  size="small"
                  type="primary"
                  @click="completePayment(row)"
                  :disabled="!row._editPaymentActual"
                >
                  완납
                </el-button>
              </template>
            
              <!-- 납부 불가 -->
              <template v-else>
                <span class="text-muted">
                  {{ row.paymentStatus === 'N' ? '연체' : '완납' }}
                </span>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

    </el-tabs>
  </div>
  <el-dialog
  v-model="terminateDialogVisible"
  title="계약 해지 확인"
  width="420px"
  :close-on-click-modal="false"
>
  <div class="terminate-desc">
    <p><strong>해당 계약을 해지하시겠습니까?</strong></p>
    <p class="warn">
      계약 해지 시 렌탈 중인 상품은 즉시 <b>연체 상태</b>로 변경됩니다.<br />
      (수리 중인 상품은 제외)
    </p>
  </div>

  <template #footer>
      <el-button @click="terminateDialogVisible = false">
        취소
      </el-button>
      <el-button
        type="danger"
        :loading="terminateLoading"
        @click="confirmTerminate"
      >
        해지
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useToastStore } from '@/store/useToast'
import { getContractBasic, getContractItems, getContractPayments, patchCompletePayment, patchTerminateContract} from '@/api/contract'
import { useAuthStore } from '@/store/auth.store'
import { ElMessage } from 'element-plus'

const terminateDialogVisible = ref(false)
const terminateLoading = ref(false)

const itemSummary = ref([])
const selectedItemName = ref(null)

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const activeTab = ref('overview')

const toastStore = useToastStore();
const authStore = useAuthStore();

/* =========================
   State
========================= */
const vm = ref(initVm())
const items = ref([])
const payments = ref([])

const basicLoaded = ref(false)
const itemsLoaded = ref(false)
const paymentsLoaded = ref(false)

function initVm() {
  return {
    contractName: '',
    contractCode: '',
    contractPeriod: 0,
    startDate: '',
    customerCode: '',
    inCharge: '',
    callNum: '',
    monthlyPayment: 0,
    totalAmount: 0,
    payMethodLabel: '',
    specialContent: '',
    productCount: 0,
    progressRate: 0,
    overdueCount: 0
  }
}

/* =========================
   API
========================= */
const canTerminateContract = computed(() =>
  authStore.hasAuth('CONTRACT_APPROVE')
)

function openTerminateModal() {
  terminateDialogVisible.value = true
}

async function confirmTerminate() {
  try {
    terminateLoading.value = true

    await patchTerminateContract(route.params.id)

    ElMessage.success('계약이 해지되었습니다.');

    terminateDialogVisible.value = false

    // 상세 재조회 (또는 목록 이동 중 택1)
    basicLoaded.value = false

    router.push({ name: 'contract-list' })

  } catch (e) {
    console.error(e)
  } finally {
    terminateLoading.value = false
  }
}


async function fetchBasic(contractId) {
  if (!contractId || basicLoaded.value) return

  loading.value = true
  try {
    const { data: b } = await getContractBasic(contractId)
    const payMethodMap = { A: '자동이체', B: '계좌이체' }

    vm.value = {
      contractName: b.overview.contractName,
      contractCode: b.overview.contractCode,
      contractPeriod: b.overview.contractPeriod,
      startDate: b.overview.startDate,
      customerCode: b.overview.customerCode,
      customerName: b.overview.customerName,
      inCharge: b.overview.inCharge,
      callNum: b.overview.callNum,
      monthlyPayment: b.overview.monthlyPayment,
      totalAmount: b.overview.totalAmount,
      payMethodLabel: payMethodMap[b.overview.payMethod] ?? '-',
      specialContent: b.overview.specialContent,
      contractStatus: b.overview.contractStatus,
      productCount: b.productCount,
      progressRate: b.progress?.progressRate ?? 0,
      overdueCount: b.overdueCount ?? 0
    }

    basicLoaded.value = true
  } finally {
    loading.value = false
  }
}

async function fetchItems() {
  if (itemsLoaded.value) return
  loading.value = true
  try {
    const res = await getContractItems(route.params.id)
    items.value = res.data?.contractItemDetail ?? []
    itemSummary.value = res.data?.contractItemSummary ?? []

    // 기본 선택 (첫 상품)
    if (itemSummary.value.length > 0) {
      selectedItemName.value = itemSummary.value[0].itemName
    }

    itemsLoaded.value = true
  } finally {
    loading.value = false
  }
}

const filteredItems = computed(() => {
  if (!selectedItemName.value) return []
  return items.value.filter(
    item => item.name === selectedItemName.value
  )
})

async function fetchPayments() {
  if (paymentsLoaded.value){
    return
  } 
  loading.value = true
  try {
    const res = await getContractPayments(route.params.id)
    payments.value = (res.data ?? []).map(p => ({
    id: p.id,
    paymentDue: p.paymentDue,
    paymentActual: p.paymentActual,
    paymentStatus: p.paymentStatus,
    overdueDays: p.overdueDays,

    // 🔹 프론트 전용 필드
    _editPaymentActual: null
  }))
    console.log('[FETCH PAYMENTS] mapped payments:', payments.value)
    paymentsLoaded.value = true
  } finally {
    loading.value = false
  }
}

async function completePayment(row) {
  try {
    loading.value = true

    await patchCompletePayment(row.id,
      {
        paymentActual: row._editPaymentActual
      }
    )
    toastStore.showToast('결제가 완료되었습니다.');
    // ✅ 목록 초기화 후 재조회
    paymentsLoaded.value = false
    payments.value = []
    await fetchPayments()

  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function canPay(row) {
  if (row.paymentStatus !== 'P') return false

  const today = new Date()
  const dueDate = new Date(row.paymentDue)

  // 날짜만 비교
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)

  return today <= dueDate
}

/* =========================
   Tab Handler
========================= */
watch(activeTab, (tab) => {
  if (tab === 'items') fetchItems()
  if (tab === 'payments') fetchPayments()
})

/* =========================
   Lifecycle
========================= */
onMounted(() => {
  fetchBasic(route.params.id)
})

watch(
  () => route.params.id,
  (newId) => {
    vm.value = initVm()
    items.value = []
    payments.value = []
    activeTab.value = 'overview'

    basicLoaded.value = false
    itemsLoaded.value = false
    paymentsLoaded.value = false

    fetchBasic(newId)
  }
)

/* =========================
   Utils
========================= */
const goList = () => router.push({ name: 'contract-list' })
const money = v => {
  if (typeof v !== 'number') return '-'
  if (v >= 100000000) {
    return (v / 100000000).toLocaleString('ko-KR') + '억원'
  }
  return (v / 10000).toLocaleString('ko-KR') + '만원'
}
const formatDate = v => (v ? String(v).substring(0, 10) : '-')

const summaryRowClass = ({ row }) => {
  return row.itemName === selectedItemName.value
    ? 'is-selected'
    : ''
}

const formatPhone = v =>
  v
    ? String(v).replace(
        /(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,
        '$1-$2-$3'
      )
    : '-'

const paymentStatusLabel = s => ({ P: '예정', C: '완납', N: '연체' }[s] ?? '-')
const paymentStatusTag = s => ({ P: 'info', C: 'success', N: 'danger' }[s] ?? 'info')
</script>

<style scoped>
.page-container { padding: 24px; max-width: 1600px; margin: 0 auto; }
.detail-header { display: flex; align-items: center; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 12px; }
.title { font-size: 24px; font-weight: 700; }
.sub { font-size: 13px; color: #888; }
.summary-card { margin-bottom: 24px; }
.summary-grid { display: grid; grid-template-columns: 2fr repeat(3, 1fr); gap: 20px; align-items: center; }
.progress-label { font-size: 14px; margin-bottom: 8px; }
.kpi { text-align: center; }
.kpi-title { font-size: 13px; color: #666; }
.kpi-value { font-size: 20px; font-weight: 700; }
.kpi.danger .kpi-value { color: #d32f2f; }
.detail-tabs { margin-top: 20px; }
.header-right {
  margin-left: auto;
}

.terminate-desc {
  font-size: 14px;
  line-height: 1.6;
}

.terminate-desc .warn {
  margin-top: 10px;
  color: #d32f2f;
}

/* ===== 계약 개요 그리드 ===== */

.overview-card {
  display: flex;
  flex-direction: column;
}

.overview-card :deep(.el-card__body) {
  flex: 1;
}
.card-title {
  font-weight: 700;
  font-size: 16px;
}

/* 특이사항 메모 스타일 (고객 메모 재사용) */
.memo-textarea :deep(.el-textarea__inner) {
  resize: none;
  border: none;
  background-color: #f9f9f9;
  font-size: 14px;
  line-height: 1.6;
  padding: 15px;
}

:deep(.el-table .is-selected td) {
  background-color: #eef5ff !important;
  font-weight: 600;
}

:deep(.el-table__row) {
  cursor: pointer;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hint {
  font-size: 12px;
  color: #999;
}

.payments-card {
  min-height: 420px;
}

.payments-table {
  min-height: 360px;
}

.payments-card {
  margin-top: 12px;
  min-height: 420px;
}

.payments-table {
  min-height: 360px;
}

/* 테이블 내부 텍스트 조금 더 여유 있게 */
.payments-table :deep(.el-table__cell) {
  padding-top: 14px;
  padding-bottom: 14px;
  font-size: 14px;
}
.overdue { color: #d32f2f; font-weight: 600; }
</style>
