<template>
  <el-card shadow="never">
    <div class="search-area">
      <el-input
        v-model="keyword"
        placeholder="결재 코드 / 제목 검색"
        clearable
        style="width: 260px"
        @keyup.enter="onSearch"
      />
      <el-button type="primary" @click="onSearch">검색</el-button>
    </div>
    <el-table :data="list" style="width: 100%" empty-text="완료된 결재가 없습니다." @row-click="goContractDetail">
      <el-table-column
        prop="approvalCode"
        label="결재 코드"
        width="160"
      />

      <el-table-column
        prop="approvalTitle"
        label="제목"
      />

      <el-table-column label="결과" width="120">
        <template #default="{ row }">
          <el-tag
            :type="row.resultStatus === 'APPROVED' ? 'success' : 'danger'"
          >
            {{ row.resultStatus === 'APPROVED' ? '승인' : '반려' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        prop="rejectReason"
        label="반려 사유"
      />

      <el-table-column label="요청일" width="160">
        <template #default="{ row }">
          {{ formatDate(row.requestDate) }}
        </template>
      </el-table-column>

      <el-table-column label="처리일" width="160">
        <template #default="{ row }">
          {{ formatDate(row.lastProcessDate) }}
        </template>
      </el-table-column>
    </el-table>
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { getApprovalCompleted } from '@/api/approval'

/* router */
const router = useRouter()

/* pagination */
const page = ref(1)
const size = ref(10)
const total = ref(0)

const keyword = ref('')
const list = ref([])
const loading = ref(false)

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

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getApprovalCompleted(
      page.value,
      size.value,
      keyword.value
    )
    const data = res.contents ? res : res.data ?? res
    list.value = res?.data?.contents ?? []
    total.value = data.totalCount ?? 0
  } catch (e) {
    console.error('완료된 결재 조회 실패', e)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  page.value = 1
  fetchList()
}

const formatDate = d => {
  if (!d) return '-'
  return dayjs(d).format('YYYY-MM-DD')
}

defineExpose({ fetchList })

onMounted(fetchList)
</script>
<style scoped>
  .search-area {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .pagination-area {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
  </style>