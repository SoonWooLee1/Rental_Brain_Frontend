<template>
  <el-card shadow="never">

    <!-- Search -->
    <div class="search-area">
      <el-input
        v-model="keyword"
        placeholder="결재 코드 / 제목 검색"
        clearable
        @keyup.enter="onSearch"
        style="width: 260px"
      />
      <el-button
        type="primary"
        @click="onSearch"
      >
        검색
      </el-button>
    </div>
    <!-- Table -->
    <el-table
      :data="list"
      v-loading="loading"
      style="width: 100%"
      empty-text="대기 중인 결재가 없습니다."
      @row-click="goContractDetail"
    >
      <el-table-column
        prop="approvalCode"
        label="결재 코드"
        width="160"
      />

      <el-table-column
        prop="approvalTitle"
        label="제목"
      />

      <el-table-column
        prop="employeeName"
        label="요청자"
        width="120"
      />

      <el-table-column
        prop="positionName"
        label="직위"
        width="140"
      />

      <el-table-column
        label="요청일"
        width="160"
      >
        <template #default="{ row }">
          {{ formatDate(row.requestDate) }}
        </template>
      </el-table-column>

      <el-table-column
        label="결재"
        width="180"
      >
        <template #default="{ row }">
          <el-button
            size="small"
            type="success"
            @click.stop="openApproveModal(row)"
          >
            승인
          </el-button>
        
          <el-button
            size="small"
            type="danger"
            @click.stop="openRejectModal(row)"
          >
            반려
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="pagination-area">
      <el-pagination
        layout="prev, pager, next"
        :total="total"
        :page-size="size"
        v-model:current-page="page"
        @current-change="fetchList"
      />
    </div>
  </el-card>
  <!-- 승인 확인 모달 -->
<el-dialog
  v-model="approveVisible"
  title="결재 승인"
  width="360px"
>
  <div class="approve-message">
    <p><strong>결재 코드:</strong> {{ selectedApproval?.approvalCode }}</p>
    <p>해당 결재를 승인하시겠습니까?</p>
  </div>

  <template #footer>
    <el-button @click="approveVisible = false">취소</el-button>
    <el-button
      type="success"
      :loading="approveLoading"
      @click="confirmApprove"
    >
      승인
    </el-button>
  </template>
</el-dialog>
  <!-- 반려 사유 입력 모달 -->
<el-dialog
  v-model="rejectVisible"
  title="결재 반려"
  width="400px"
>
  <el-form>
    <el-form-item label="반려 사유">
      <el-input
        v-model="rejectReason"
        type="textarea"
        rows="4"
        placeholder="반려 사유를 입력하세요"
        maxlength="200"
        show-word-limit
      />
    </el-form-item>
  </el-form>

  <template #footer>
    <el-button @click="rejectVisible = false">취소</el-button>
    <el-button type="danger" :loading="rejectLoading" @click="confirmReject">
      반려 처리
    </el-button>
  </template>
</el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { getApprovalPending } from '@/api/approval'
import { approveApproval, rejectApproval } from '@/api/approval'
import { ElMessage} from 'element-plus'
import { useToastStore } from '@/store/useToast'
import { useRouter } from 'vue-router'

/* router */
const router = useRouter()

const toastStore = useToastStore();
const emit = defineEmits(['changed'])
const keyword = ref('')

/* pagination */
const page = ref(1)
const size = ref(10)
const total = ref(0)

/* table */
const list = ref([])
const loading = ref(false)

const approveVisible = ref(false)
const approveLoading = ref(false)
const selectedApproval = ref(null)
const rejectVisible = ref(false)
const rejectLoading= ref(false)
const rejectReason = ref('')

const onSearch = () => {
  page.value = 1        // 검색 시 항상 1페이지
  fetchList()
}

/* api */
const fetchList = async () => {
  loading.value = true
  try {
    // interceptor로 response.data가 이미 벗겨진 상태
    const res = await getApprovalPending(page.value, size.value,keyword.value)
    console.log('pending res:', res)

    const data = res.contents ? res : res.data ?? res

    list.value = data.contents ?? []
    total.value = data.totalCount ?? 0
  } catch (e) {
    console.error('대기 결재 조회 실패', e)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const confirmApprove = async () => {
  if (!selectedApproval.value) return

  approveLoading.value = true
  try {
    await approveApproval(selectedApproval.value.approvalMappingId)
    emit('changed')
    toastStore.showToast('승인 처리되었습니다.');
    approveVisible.value = false
    fetchList()
  } catch (e) {
    console.error(e)
    toastStore.showToast('승인 처리 실패')
  } finally {
    approveLoading.value = false
  }
}

/* ===== 계약 상세 이동 ===== */
const goContractDetail = (row) => {
  if (!row.contractId) return

  router.push({
    name: 'contract-detail',
    params: {
      id: row.contractId
    }
  })
}

const openApproveModal = (row) => {
  selectedApproval.value = row
  approveLoading.value = false
  approveVisible.value = true
}

const openRejectModal = (row) => {
  selectedApproval.value = row
  rejectReason.value = ''
  rejectLoading.value = false
  rejectVisible.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('반려 사유를 입력하세요.')
    return
  }

  rejectLoading.value = true
  try {
    await rejectApproval(
      selectedApproval.value.approvalMappingId,
      { rejectReason: rejectReason.value }
    )
    emit('changed')
    toastStore.showToast('반려 처리되었습니다.')
    rejectVisible.value = false
    fetchList()
  } catch (e) {
    console.error(e)
    toastStore.showToast('반려 처리 실패')
  } finally {
    rejectLoading.value = false
  }
}

/* util */
const formatDate = (d) =>
  d ? dayjs(d).format('YYYY-MM-DD') : '-'

onMounted(fetchList)
</script>

<style scoped>
.pagination-area {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.approve-message {
  line-height: 1.6;
  font-size: 14px;
}
.approve-message p {
  margin: 6px 0;
}
.search-area {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
