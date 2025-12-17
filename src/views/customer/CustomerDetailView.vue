<template>
  <div class="page-container" v-loading="loading">
    <div class="top-nav">
      <el-button link @click="$router.back()">← 고객 목록으로 돌아가기</el-button>
    </div>
    
    <div class="header-section" v-if="customer">
      <div class="title-box">
        <h2 class="company-name">
          {{ customer.name }}
          <el-tag class="segment-tag">{{ customer.segmentName }}</el-tag>
        </h2>
      </div>
      <div class="btn-group">
        <el-button type="warning" @click="openEditModal">정보 수정</el-button>
        <el-popconfirm title="정말 삭제하시겠습니까?" @confirm="handleDelete">
          <template #reference>
            <el-button type="danger">고객 삭제</el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <div class="summary-row">
      <div class="summary-card">
        <div class="sc-label">총 거래액</div>
        <div class="sc-value">{{ (customer.totalTransactionAmount || 0).toLocaleString() }}원</div>
      </div>
      <div class="summary-card">
        <div class="sc-label">계약 수</div>
        <div class="sc-value">{{ customer.contractCount || 0 }}건</div>
      </div>
      <div class="summary-card">
        <div class="sc-label">세그먼트</div>
        <div class="sc-value">{{ customer.segmentName || '미지정' }}</div>
      </div>
      <div class="summary-card">
        <div class="sc-label">최근 렌탈</div>
        <div class="sc-value">{{ formatDate(customer.recentRentalDate) }}</div>
      </div>
    </div>

    <el-card shadow="never" class="detail-card">
      <el-tabs v-model="activeTab">
        
        <el-tab-pane label="종합 정보" name="general">
          <div class="info-grid">
            <div class="info-item"><label>기업명</label><div>{{ customer.name }}</div></div>
            <div class="info-item"><label>담당자</label><div>{{ customer.inCharge }}</div></div>
            <div class="info-item"><label>부서/직책</label><div>{{ customer.dept }}</div></div>
            <div class="info-item"><label>전화번호</label><div>{{ formatPhoneNumber(customer.callNum) }}</div></div>
            <div class="info-item"><label>휴대폰</label><div>{{ formatPhoneNumber(customer.phone) }}</div></div>
            <div class="info-item"><label>첫 계약일</label><div>{{ formatDate(customer.firstContractDate) }}</div></div>
            <div class="info-item full-width"><label>주소</label><div>{{ customer.addr }}</div></div>
          </div>
          
          <h4 class="section-title" style="margin-top:24px;">메모</h4>
          <div class="memo-box">{{ customer.memo || '등록된 메모가 없습니다.' }}</div>

          <h4 class="section-title" style="margin-top:24px;">고객 대응 히스토리</h4>
          <div class="history-list">
             <div v-for="(item, idx) in unifiedHistory" :key="idx" class="history-item">
               <div class="h-title">
                 <span>{{ item.title }}</span>
                 <el-tag size="small" :type="item.tagType">{{ item.status }}</el-tag>
               </div>
               <div class="h-desc">{{ item.content }}</div>
               <div class="h-date">{{ formatDateTime(item.date) }}</div>
             </div>
             <div v-if="unifiedHistory.length === 0" class="no-data">내역이 없습니다.</div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="문의 내역" name="inquiry">
          <el-table :data="customer.supportList || []">
            <el-table-column prop="title" label="제목" />
            <el-table-column prop="status" label="상태" />
            <el-table-column prop="createDate" label="접수일">
               <template #default="{row}">{{ formatDateTime(row.createDate) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="견적 내역" name="quote">
          <el-table :data="customer.quoteList || []">
            <el-table-column prop="summary" label="견적 요약" />
            <el-table-column prop="content" label="내용" show-overflow-tooltip />
            <el-table-column prop="counselingDate" label="상담일">
               <template #default="{row}">{{ formatDateTime(row.counselingDate) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="계약 내역" name="contract">
          <el-table :data="customer.contractList || []">
            <el-table-column prop="name" label="계약명" />
            <el-table-column prop="totalAmount" label="금액" align="right">
               <template #default="{row}">{{ row.totalAmount?.toLocaleString() }}원</template>
            </el-table-column>
            <el-table-column prop="startDate" label="시작일">
               <template #default="{row}">{{ formatDate(row.startDate) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="editModalVisible" title="정보 수정" width="500px">
        <el-form :model="editForm" label-width="100px">
            <el-form-item label="기업명"><el-input v-model="editForm.name" /></el-form-item>
            <el-form-item label="담당자"><el-input v-model="editForm.inCharge" /></el-form-item>
            <el-form-item label="부서/직책"><el-input v-model="editForm.dept" /></el-form-item>
            <el-form-item label="전화번호"><el-input v-model="editForm.callNum" /></el-form-item>
            <el-form-item label="휴대폰"><el-input v-model="editForm.phone" /></el-form-item>
            <el-form-item label="주소"><el-input v-model="editForm.addr" /></el-form-item>
            <el-form-item label="메모"><el-input v-model="editForm.memo" type="textarea" :rows="3" /></el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="editModalVisible = false">취소</el-button>
            <el-button type="primary" @click="handleEditSave">저장</el-button>
        </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCustomerDetail, updateCustomer, deleteCustomer } from '@/api/customerlist'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const customerId = route.params.id
const loading = ref(false)
const customer = ref({})
const activeTab = ref('general')
const editModalVisible = ref(false)
const editForm = ref({})

// [수정됨] 통합 히스토리 (DDL 필드명 반영)
const unifiedHistory = computed(() => {
  let list = []
  const c = customer.value
  
  // 1. 문의 내역
  if(c.supportList) {
    list.push(...c.supportList.map(i => ({ 
      title: '[문의] ' + i.title, 
      content: i.content, 
      date: i.createDate, 
      status: i.status || '완료', 
      tagType: 'success'
    })))
  }
  
  // 2. 계약 내역
  if(c.contractList) {
    list.push(...c.contractList.map(i => ({ 
      title: '[계약] ' + i.name, 
      content: `${i.totalAmount?.toLocaleString()}원 계약`, 
      date: i.startDate, 
      status: '진행중', 
      tagType: 'primary'
    })))
  }

  // 3. 견적 내역 (DDL: summary, content, counseling_date)
  if(c.quoteList) {
    list.push(...c.quoteList.map(i => ({
      title: '[견적] ' + (i.summary || '견적 요청'), // DDL: summary
      content: i.content, // DDL: content
      date: i.counselingDate, // DDL: counseling_date -> counselingDate
      status: '상담완료',
      tagType: 'warning'
    })))
  }

  // 날짜 내림차순 정렬
  return list.sort((a,b) => new Date(b.date) - new Date(a.date))
})

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getCustomerDetail(customerId)
    customer.value = res.data
  } catch(e) { ElMessage.error('로드 실패') } 
  finally { loading.value = false }
}

const handleEditSave = async () => {
  try {
    const payload = { ...editForm.value }
    // DDL상 call_num 등으로 저장됨
    if(payload.callNum) payload.callNum = payload.callNum.replace(/-/g, '')
    if(payload.phone) payload.phone = payload.phone.replace(/-/g, '')
    if(payload.businessNum) payload.businessNum = payload.businessNum.replace(/-/g, '')

    await updateCustomer(customerId, payload)
    ElMessage.success('수정되었습니다.')
    editModalVisible.value = false
    fetchDetail()
  } catch(e) { ElMessage.error('수정 실패') }
}

const handleDelete = async () => {
  try {
    await deleteCustomer(customerId)
    ElMessage.success('삭제되었습니다.')
    router.push('/customers')
  } catch(e) { ElMessage.error('삭제 실패') }
}

const openEditModal = () => { editForm.value = { ...customer.value }; editModalVisible.value = true; }
const formatDateTime = (d) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'
const formatDate = (d) => d ? dayjs(d).format('YYYY-MM-DD') : '-'
const formatPhoneNumber = (num) => { if(!num) return '-'; return num.replace(/(\d{2,3})(\d{3,4})(\d{4})/, '$1-$2-$3'); }

onMounted(() => fetchDetail())
</script>

<style scoped>
/* 기존 스타일 유지 */
.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
.summary-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #eee; }
.sc-label { color: #888; font-size: 13px; margin-bottom: 4px; }
.sc-value { font-size: 18px; font-weight: bold; color: #333; }
.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.full-width { grid-column: span 3; }
.history-list { display: flex; flex-direction: column; gap: 12px; }
.history-item { padding: 12px; border: 1px solid #eee; border-radius: 8px; }
.h-title { font-weight: bold; display: flex; justify-content: space-between; margin-bottom: 4px; }
.h-date { color: #aaa; font-size: 12px; text-align: right; }
.no-data { text-align: center; color: #999; padding: 20px; }
</style>