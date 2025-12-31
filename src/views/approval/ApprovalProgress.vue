<template>
  <el-card shadow="never">

    <!-- Search -->
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

    <!-- Table -->
    <el-table
      :data="list"
      v-loading="loading"
      style="width: 100%"
      empty-text="진행 중인 결재가 없습니다."
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

      <el-table-column label="진행률" width="180">
        <template #default="{ row }">
          <el-progress :percentage="row.progressRate ?? 0" />
        </template>
      </el-table-column>

      <el-table-column label="다음 승인자">
        <template #default="{ row }">
          {{ row.nextApproverName || '완료 대기' }}
        </template>
      </el-table-column>

      <el-table-column label="다음 승인자 직책">
        <template #default="{ row }">
          {{ row.nextApproverPosition || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="요청일" width="160">
        <template #default="{ row }">
          {{ formatDate(row.requestDate) }}
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
</template>
<script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import dayjs from 'dayjs'
  import { getApprovalProgress } from '@/api/approval'
  
  /* router */
  const router = useRouter()
  
  /* pagination */
  const page = ref(1)
  const size = ref(10)
  const total = ref(0)
  
  /* search */
  const keyword = ref('')
  
  /* table */
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

  /* api */
  const fetchList = async () => {
    loading.value = true
    try {
      const res = await getApprovalProgress(
        page.value,
        size.value,
        keyword.value
      )
  
      const data = res.contents ? res : res.data ?? res
  
      list.value = data.contents ?? []
      total.value = data.totalCount ?? 0
    } catch (e) {
      console.error('결재 진행 목록 조회 실패', e)
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
  
  /* util */
  const formatDate = d =>
    d ? dayjs(d).format('YYYY-MM-DD') : '-'
  
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
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
  </style>
