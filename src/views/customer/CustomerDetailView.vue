<template>
  <div class="page-container" v-loading="loading">
    <div class="top-nav">
      <el-button link @click="$router.back()">← 고객 목록으로 돌아가기</el-button>
    </div>
    
    <div class="header-section" v-if="customer">
      <div class="title-box">
        <div class="logo-box">🏢</div>
        <div>
          <h2 class="company-name">{{ customer.name }}
            <el-tag effect="dark" size="small" type="info" class="ml-2">{{ customer.customerCode }}</el-tag>
            <el-tag effect="plain" round class="ml-2" :type="getSegmentColor(customer.segmentName)">
              {{ customer.segmentName }}
            </el-tag>
          </h2>
        </div>
      </div>
      <el-button type="warning">정보 수정</el-button>
    </div>

    <div class="summary-cards">
      <div class="card">
        <span class="lbl">총 거래액</span>
        <span class="val blue">4,200만원</span>
      </div>
      <div class="card">
        <span class="lbl">계약 수</span>
        <span class="val green">{{ customer.contractList?.length || 0 }}건</span>
      </div>
      <div class="card">
        <span class="lbl">세그먼트</span>
        <span class="val purple">{{ customer.segmentName }}</span>
      </div>
      <div class="card">
        <span class="lbl">최근 거래일</span>
        <span class="val orange">{{ formatDate(customer.lastTransaction) }}</span>
      </div>
    </div>

    <el-card shadow="never" class="detail-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="종합 정보" name="general">
          <div class="info-grid">
            <div class="info-item">
              <label>기업명</label>
              <div>{{ customer.name }}</div>
            </div>
            <div class="info-item">
              <label>담당자</label>
              <div>{{ customer.inCharge }}</div>
            </div>
            <div class="info-item">
              <label>부서/직책</label>
              <div>{{ customer.dept }}</div>
            </div>
            <div class="info-item">
              <label>연락처</label>
              <div>{{ customer.callNum }} / {{ customer.phone }}</div>
            </div>
            <div class="info-item">
              <label>이메일</label>
              <div>{{ customer.email }}</div>
            </div>
            <div class="info-item">
              <label>주소</label>
              <div>{{ customer.addr }}</div>
            </div>
          </div>

          <el-divider content-position="left">메모</el-divider>
          <div class="memo-box">
            {{ customer.memo || '등록된 메모가 없습니다.' }}
          </div>

          <h4 class="section-title">고객 대응 히스토리 (최근 5건)</h4>
          <div class="history-list">
            <div 
              class="history-item" 
              v-for="support in (customer.supportList || []).slice(0, 5)" 
              :key="support.id"
            >
              <div class="icon-area"><el-icon><ChatLineSquare /></el-icon></div>
              <div class="content-area">
                <div class="h-title">
                  {{ support.title }}
                  <el-tag size="small" :type="support.status === '완료' ? 'success' : 'warning'">
                    {{ support.status || '접수' }}
                  </el-tag>
                </div>
                <div class="h-desc">{{ support.content }}</div>
              </div>
              <el-button link>상세보기</el-button>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="문의 내역" name="support">
          <el-table :data="customer.supportList || []">
            <el-table-column prop="customerSupportCode" label="코드" width="120" />
            <el-table-column prop="title" label="제목" />
            <el-table-column prop="status" label="상태" width="100">
               <template #default="{ row }">
                 <el-tag size="small">{{ row.status || '처리중' }}</el-tag>
               </template>
            </el-table-column>
            <el-table-column prop="createDate" label="접수일" width="180">
              <template #default="{ row }">{{ formatDateTime(row.createDate) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="계약 내역" name="contract">
          <el-table :data="customer.contractList || []">
            <el-table-column prop="contractCode" label="계약코드" />
            <el-table-column prop="name" label="계약명" />
            <el-table-column prop="totalAmount" label="금액">
               <template #default="{ row }">{{ row.totalAmount?.toLocaleString() }}원</template>
            </el-table-column>
            <el-table-column prop="status" label="상태" />
            <el-table-column prop="startDate" label="시작일">
               <template #default="{ row }">{{ formatDate(row.startDate) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="AS/정기점검" name="as">
           <el-table :data="customer.asList || []">
             <el-table-column prop="afterServiceCode" label="AS코드" />
             <el-table-column prop="itemName" label="대상장비" />
             <el-table-column prop="type" label="유형" />
             <el-table-column prop="status" label="상태" />
             <el-table-column prop="dueDate" label="예정일">
               <template #default="{ row }">{{ formatDate(row.dueDate) }}</template>
             </el-table-column>
           </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ChatLineSquare } from '@element-plus/icons-vue'
import { getCustomerDetail } from '@/api/customerlist'
import dayjs from 'dayjs'

const route = useRoute()
const customerId = route.params.id
const loading = ref(false)
const customer = ref({})
const activeTab = ref('general')

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getCustomerDetail(customerId)
    customer.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const formatDate = (d) => d ? dayjs(d).format('YYYY-MM-DD') : '-'
const formatDateTime = (d) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'

const getSegmentColor = (seg) => {
  if(!seg) return 'info'
  if(seg.includes('VIP')) return 'warning'
  return 'primary'
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.page-container { max-width: 1400px; margin: 0 auto; }
.top-nav { margin-bottom: 20px; }
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.title-box { display: flex; align-items: center; gap: 16px; }
.logo-box { width: 56px; height: 56px; background: #ff7d39; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: white; }
.company-name { margin: 0; font-size: 24px; font-weight: 700; display: flex; align-items: center; }
.summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.card { background: white; padding: 20px; border-radius: 8px; border: 1px solid #eee; display: flex; flex-direction: column; }
.card .lbl { font-size: 13px; color: #888; margin-bottom: 8px; }
.card .val { font-size: 20px; font-weight: 700; }
.val.blue { color: #2563eb; }
.val.green { color: #16a34a; }
.val.purple { color: #9333ea; }
.val.orange { color: #ea580c; }
.detail-card { border-radius: 8px; }
.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px 40px; background: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
.info-item label { display: block; font-size: 13px; color: #6b7280; margin-bottom: 4px; }
.info-item div { font-size: 15px; font-weight: 500; color: #1f2937; }
.memo-box { background: #fffbeb; border: 1px solid #fcd34d; padding: 16px; border-radius: 6px; color: #92400e; margin-bottom: 30px; }
.section-title { font-size: 16px; color: #4b5563; margin-bottom: 12px; margin-top: 10px; display: flex; align-items: center; gap: 6px;}
.history-list { display: flex; flex-direction: column; gap: 12px; }
.history-item { display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #eee; border-radius: 8px; background: white; }
.icon-area { color: #4f46e5; font-size: 20px; background: #eef2ff; padding: 8px; border-radius: 8px; }
.content-area { flex: 1; }
.h-title { font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
.h-desc { font-size: 13px; color: #666; }
</style>