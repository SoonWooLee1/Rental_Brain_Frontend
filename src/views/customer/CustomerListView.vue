<template>
  <div class="page-container">
    <div class="header-row">
      <h2>고객 목록</h2>
      <el-button type="primary" :icon="Plus" @click="openRegisterModal">신규 기업 등록</el-button>
    </div>
    <el-card shadow="never" class="table-card">
      <el-table :data="customers" style="width: 100%" v-loading="loading">
        <el-table-column prop="customerCode" label="ID" width="100" />
        <el-table-column label="기업명" min-width="150">
          <template #default="scope">
            <span style="font-weight: 600; cursor: pointer" @click="goDetail(scope.row.id)">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="inCharge" label="담당자" width="100" />
        <el-table-column prop="dept" label="부서/직책" width="120" />
        <el-table-column label="연락처" width="130">
           <template #default="scope">{{ formatPhoneNumber(scope.row.callNum) }}</template>
        </el-table-column>
        <el-table-column label="첫 계약일" width="120">
          <template #default="scope">{{ formatDate(scope.row.firstContractDate) }}</template>
        </el-table-column>
        <el-table-column label="세그먼트" width="120">
          <template #default="scope">
            <el-tag :type="getSegmentColor(scope.row.segmentName)" effect="light">
              {{ scope.row.segmentName || '미지정' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="총 거래액" width="140" align="right">
          <template #default="scope">{{ (scope.row.totalTransactionAmount || 0).toLocaleString() }}원</template>
        </el-table-column>
        <el-table-column prop="contractCount" label="계약 수" width="80" align="center">
           <template #default="scope">{{ scope.row.contractCount }}건</template>
        </el-table-column>
        <el-table-column label="액션" width="100" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="goDetail(scope.row.id)">상세보기</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="totalCount"
          :page-size="pageSize"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="registerModalVisible" title="신규 기업 등록" width="600px">
      <el-form :model="registerForm" label-width="140px">
        <el-form-item label="기업명" required><el-input v-model="registerForm.name" placeholder="예: (주)데브옵스" /></el-form-item>
        <el-form-item label="담당자"><el-input v-model="registerForm.inCharge" placeholder="예: 홍길동" /></el-form-item>
        <el-form-item label="부서/직책"><el-input v-model="registerForm.dept" placeholder="예: 경영지원 / 대리" /></el-form-item>
        <el-form-item label="사업자번호"><el-input v-model="registerForm.businessNum" placeholder="예: 123-45-67890" /></el-form-item>
        <el-form-item label="전화번호"><el-input v-model="registerForm.callNum" placeholder="예: 02-1234-5678" /></el-form-item>
        <el-form-item label="휴대폰"><el-input v-model="registerForm.phone" placeholder="예: 010-1234-5678" /></el-form-item>
        <el-form-item label="이메일"><el-input v-model="registerForm.email" placeholder="예: example@email.com" /></el-form-item>
        <el-form-item label="주소"><el-input v-model="registerForm.addr" placeholder="주소를 입력하세요" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerModalVisible = false">취소</el-button>
        <el-button type="primary" @click="handleRegister">등록</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { getCustomerList, createCustomer } from '@/api/customerlist'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const customers = ref([])
const totalCount = ref(0)
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const registerModalVisible = ref(false)
const registerForm = ref({ name: '', inCharge: '', dept: '', businessNum: '', callNum: '', phone: '', email: '', addr: '' })

// 500 에러 해결: 외래키(channelId, segmentId) 기본값 설정
const handleRegister = async () => {
  try {
    const payload = {
      ...registerForm.value,
      channelId: 1, // DB에 존재하는 ID여야 함
      segmentId: 1  // DB에 존재하는 ID여야 함
    }
    // 하이픈 제거
    if(payload.businessNum) payload.businessNum = payload.businessNum.replace(/-/g, '')
    if(payload.callNum) payload.callNum = payload.callNum.replace(/-/g, '')
    if(payload.phone) payload.phone = payload.phone.replace(/-/g, '')

    await createCustomer(payload)
    ElMessage.success('등록되었습니다.')
    registerModalVisible.value = false
    fetchData()
  } catch(e) {
    ElMessage.error('등록 실패')
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: currentPage.value,
      amount: pageSize.value,
      keyword: searchKeyword.value
    }
    const res = await getCustomerList(params)
    customers.value = res.data.contents
    totalCount.value = res.data.totalCount
  } catch (e) { console.error(e) } 
  finally { loading.value = false }
}

const handlePageChange = (val) => { currentPage.value = val; fetchData() }
const goDetail = (id) => router.push(`/customers/${id}`)
const formatDate = (d) => d ? dayjs(d).format('YYYY-MM-DD') : '-'
const formatPhoneNumber = (num) => { /* 포맷팅 생략 */ return num }
const getSegmentColor = (seg) => { /* 색상 로직 생략 */ return 'success' }

onMounted(() => { fetchData() })
</script>