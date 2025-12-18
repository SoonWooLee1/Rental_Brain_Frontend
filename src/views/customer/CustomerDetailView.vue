<template>
  <div class="detail-container" v-loading="loading">
    <div class="detail-header" v-if="customer.id">
      <div class="title-row">
        <h1 class="comp-name" style="color: #000;">{{ customer.name }}</h1>
        <el-button size="small" @click="openEdit">정보 수정</el-button>
      </div>
      <div class="sub-info">
        <span class="info-id" style="margin-right: 20px;">ID: {{ customer.customerCode }}</span>
        <el-tag effect="plain">{{ customer.segmentName }}</el-tag>
      </div>
      <div class="contact-info">
        <span>{{ formatPhone(customer.callNum) }}</span>
        <span class="sep">|</span>
        <span>{{ formatPhone(customer.phone) }}</span>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="custom-tabs">
      
      <el-tab-pane label="종합 정보" name="summary">
        <div class="pane-content">
          <h3>기본 정보</h3>
          <p><strong>담당자:</strong> {{ customer.inCharge }} <span v-if="customer.dept">({{ customer.dept }})</span></p>
          <p><strong>사업자번호:</strong> {{ customer.businessNum }}</p>
          <p><strong>주소:</strong> {{ customer.addr }}</p>

          <h3 class="mt-20">고객 대응 히스토리</h3>
          <ul class="timeline">
            <li v-for="(item, idx) in customer.historyList" :key="idx" class="timeline-item">
              <span class="date">{{ formatDate(item.date) }}</span>
              <el-tag size="small" class="badge">{{ item.type }}</el-tag>
              <span class="content">{{ item.content }}</span>
              <span class="performer" v-if="item.performer">- {{ item.performer }}</span>
              <span class="status">{{ item.status }}</span>
            </li>
            <li v-if="!customer.historyList?.length" class="no-data">이력이 없습니다.</li>
          </ul>
        </div>
      </el-tab-pane>

      <el-tab-pane label="문의 내역" name="inquiry">
        <el-table :data="customer.supportList" style="width: 100%">
          <el-table-column prop="createDate" label="접수일" width="120" :formatter="(r)=>formatDate(r.createDate)"/>
          <el-table-column prop="title" label="제목"/>
          <el-table-column prop="status" label="상태" width="100"/>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="견적 내역" name="quote">
        <el-table :data="customer.quoteList" style="width: 100%">
          <el-table-column prop="counselingDate" label="상담일" width="120" :formatter="(r)=>formatDate(r.counselingDate)"/>
          <el-table-column prop="summary" label="요약"/>
          <el-table-column prop="counselor" label="상담원" width="100"/>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="계약 내역" name="contract">
        <el-table :data="customer.contractList" style="width: 100%">
          <el-table-column prop="startDate" label="시작일" width="120" :formatter="(r)=>formatDate(r.startDate)"/>
          <el-table-column prop="contractName" label="계약명"/>
          <el-table-column prop="totalAmount" label="총 금액" align="right">
             <template #default="{row}">{{ row.totalAmount?.toLocaleString() }}원</template>
          </el-table-column>
          <el-table-column prop="status" label="상태" width="100"/>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="AS / 정기점검 내역" name="as">
        <el-table :data="customer.asList" style="width: 100%">
          <el-table-column prop="scheduleDate" label="예정일" width="120" :formatter="(r)=>formatDate(r.scheduleDate)"/>
          <el-table-column prop="type" label="구분" width="100"/>
          <el-table-column prop="contents" label="내용"/>
          <el-table-column prop="engineerName" label="담당기사" width="100"/>
          <el-table-column prop="status" label="상태" width="100"/>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="피드백 내역" name="feedback">
        <el-table :data="customer.feedbackList" style="width: 100%">
          <el-table-column prop="createDate" label="등록일" width="120" :formatter="(r)=>formatDate(r.createDate)"/>
          <el-table-column prop="title" label="제목"/>
          <el-table-column prop="star" label="평점" width="80">
             <template #default="{row}">{{ row.star }}점</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="캠페인 내역" name="campaign">
        <h4>보유 쿠폰</h4>
        <el-table :data="customer.couponList" style="width: 100%; margin-bottom: 20px;">
          <el-table-column prop="name" label="쿠폰명"/>
          <el-table-column prop="rate" label="할인율" width="100">
             <template #default="{row}">{{ row.rate }}%</template>
          </el-table-column>
          <el-table-column prop="status" label="상태" width="100"/>
        </el-table>

        <h4>참여 프로모션</h4>
        <el-table :data="customer.promotionList" style="width: 100%">
          <el-table-column prop="name" label="프로모션명"/>
          <el-table-column prop="status" label="상태" width="100"/>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="고객 메모" name="memo">
        <el-input 
          type="textarea" 
          v-model="customer.memo" 
          :rows="10" 
          readonly 
          placeholder="등록된 메모가 없습니다."
        />
        <el-button style="margin-top:10px" type="primary" @click="openEdit">메모 수정하기</el-button>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="editModal" title="기본 정보 및 메모 수정" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="담당자명">
          <el-input v-model="editForm.inCharge" />
        </el-form-item>
        <el-form-item label="부서/직책">
          <el-input v-model="editForm.dept" />
        </el-form-item>
        <el-form-item label="전화번호">
          <el-input v-model="editForm.callNum" placeholder="숫자만 입력 (예: 0212345678)" />
        </el-form-item>
        <el-form-item label="휴대폰">
          <el-input v-model="editForm.phone" placeholder="숫자만 입력 (예: 01012345678)" />
        </el-form-item>
        <el-form-item label="고객 메모">
          <el-input type="textarea" v-model="editForm.memo" :rows="5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editModal = false">취소</el-button>
        <el-button type="primary" @click="saveEdit">저장</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
// api/customerlist.js에 정의된 함수 import
import { getCustomerDetail, updateCustomer } from '@/api/customerlist';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';

const route = useRoute();
const customer = ref({});
// 기본 탭: 종합 정보
const activeTab = ref('summary');
const loading = ref(false);
const editModal = ref(false);
const editForm = ref({});

// 데이터 로드
const loadData = async () => {
  loading.value = true;
  try {
    const res = await getCustomerDetail(route.params.id);
    customer.value = res.data;
  } catch (e) {
    console.error(e);
    ElMessage.error('고객 정보를 불러오는데 실패했습니다.');
  } finally {
    loading.value = false;
  }
};

// 수정 모달 열기
const openEdit = () => {
  // 현재 데이터를 복사해서 수정 폼에 할당
  editForm.value = { ...customer.value };
  editModal.value = true;
};

// 수정 내용 저장
const saveEdit = async () => {
  try {
    // 하이픈이 있다면 제거하고 저장 (DB 스키마에 맞춤)
    const payload = { ...editForm.value };
    if (payload.callNum) payload.callNum = payload.callNum.replace(/-/g, '');
    if (payload.phone) payload.phone = payload.phone.replace(/-/g, '');

    await updateCustomer(customer.value.id, payload);
    
    ElMessage.success('정보가 수정되었습니다.');
    editModal.value = false;
    // 최신 데이터 다시 로드
    loadData();
  } catch (e) {
    console.error(e);
    ElMessage.error('수정에 실패했습니다.');
  }
};

// 전화번호 포맷팅 함수 (0261000060 -> 02-6100-0060)
const formatPhone = (value) => {
  if (!value) return '';
  const clean = value.replace(/[^0-9]/g, '');
  
  if (clean.length < 4) return clean;

  // 서울 지역번호 (02)
  if (clean.startsWith('02')) {
    // 02-123-4567 or 02-1234-5678
    return clean.replace(/(\d{2})(\d{3,4})(\d{4})/, '$1-$2-$3');
  } 
  // 그 외 (010, 031 등)
  else {
    // 010-1234-5678
    return clean.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
  }
};

// 날짜 포맷팅 (YYYY-MM-DD)
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY-MM-DD');
};

// 컴포넌트 마운트 시 데이터 로드
onMounted(loadData);
</script>

<style scoped>
.detail-container {
  padding: 20px;
  background-color: #fff;
  min-height: 100vh;
}

/* 헤더 스타일 */
.detail-header {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comp-name {
  font-size: 28px;
  font-weight: bold;
  color: #000; /* 검은색 */
  margin: 0;
}

.sub-info {
  margin-top: 10px;
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.info-id {
  margin-right: 20px; /* ID와 세그먼트 사이 간격 */
}

.contact-info {
  margin-top: 10px;
  font-size: 15px;
  color: #333;
}

.sep {
  margin: 0 10px;
  color: #ddd;
}

/* 탭 컨텐츠 스타일 */
.pane-content {
  padding: 10px 0;
}

.mt-20 {
  margin-top: 30px;
  margin-bottom: 15px;
}

/* 타임라인 스타일 */
.timeline {
  list-style: none;
  padding: 0;
  margin: 0;
}

.timeline-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.date {
  width: 100px;
  color: #888;
  font-size: 13px;
}

.badge {
  margin-right: 12px;
  min-width: 60px;
  text-align: center;
}

.content {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.performer {
  margin-left: 10px;
  color: #666;
  font-size: 13px;
}

.status {
  width: 80px;
  text-align: right;
  color: #555;
  font-size: 13px;
}

.no-data {
  padding: 20px 0;
  color: #999;
  text-align: center;
}
</style>