<template>
  <div class="page-container" v-loading="loading">

    <div class="detail-header">
      <div class="header-left">
        <el-button @click="goList" circle plain>
          <el-icon>
            <ArrowLeft />
          </el-icon>
        </el-button>
        <h2 class="company-name">
          {{ customer.name }}
          <el-tag v-if="customer.isDeleted === 'Y'" type="danger" effect="dark" class="ml-2">비활성</el-tag>
        </h2>

        <template v-if="isEditMode">
          <el-select v-model="editForm.segmentId" placeholder="세그먼트 선택" class="ml-2" style="width: 220px;">
            <el-option
              v-for="opt in segmentOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </template>

        <template v-else>
          <el-tag :color="getSegmentHexColor(customer.segmentName)" effect="dark" class="segment-tag"
            style="border: none; color: #fff;">
            {{ customer.segmentName || '일반 고객' }}
          </el-tag>
        </template>
      </div>

      <div class="header-right">
        <template v-if="!isEditMode && customer.isDeleted !== 'Y'">
          <el-tooltip content="수정 권한이 없습니다" placement="top" :disabled="canUpdateCustomer">
            <el-button type="primary" :disabled="!canUpdateCustomer" @click="canUpdateCustomer && enableEditMode()">
              <el-icon>
                <Edit />
              </el-icon> 정보 수정
            </el-button>
          </el-tooltip>
          <el-tooltip content="삭제 권한이 없습니다" placement="top" :disabled="canDeleteCustomer">
            <el-button type="danger" plain :disabled="!canDeleteCustomer" @click="canDeleteCustomer && handleDelete()">
              <el-icon>
                <Delete />
              </el-icon> 고객 삭제
            </el-button>
          </el-tooltip>
        </template>

        <template v-if="customer.isDeleted === 'Y'">
          <el-tooltip content="복구 권한이 없습니다" placement="top" :disabled="canDeleteCustomer">
            <el-button type="success" :disabled="!canDeleteCustomer" @click="canDeleteCustomer && handleRestore()">
              <el-icon>
                <RefreshLeft />
              </el-icon> 고객 복구
            </el-button>
          </el-tooltip>
        </template>
      </div>
    </div>

    <el-tabs 
      v-model="activeMainTab" 
      type="border-card" 
      class="detail-tabs main-tabs"
      :before-leave="handleTabLeave"
    >
      
      <el-tab-pane label="종합 정보" name="main_general">
        <div class="info-grid two-columns">
          <el-card class="info-card basic-info" shadow="never">
            <template #header><span class="card-title">기본 정보</span></template>

            <el-descriptions :column="1" border v-if="!isEditMode">
              <el-descriptions-item label="고객 코드">{{ customer.customerCode }}</el-descriptions-item>
              <el-descriptions-item label="담당자">{{ customer.inCharge }}</el-descriptions-item>
              <el-descriptions-item label="부서 / 직책">{{ customer.dept || '-' }}</el-descriptions-item>
              <el-descriptions-item label="연락처">{{ formatPhone(customer.callNum) }}</el-descriptions-item>
              <el-descriptions-item label="이메일">{{ customer.email }}</el-descriptions-item>
              <el-descriptions-item label="첫 계약일">{{ customer.firstContractDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="주소">{{ customer.addr || '-' }}</el-descriptions-item>
              <el-descriptions-item label="총 거래액">
                 {{ formatMoneyMan(customer.totalTransactionAmount) }}
              </el-descriptions-item>
            </el-descriptions>

            <el-form v-else :model="editForm" label-width="80px">
              <el-form-item label="담당자"><el-input v-model="editForm.inCharge" /></el-form-item>
              <el-form-item label="부서/직책"><el-input v-model="editForm.dept" /></el-form-item>
              <el-form-item label="연락처"><el-input v-model="editForm.callNum" /></el-form-item>
              <el-form-item label="이메일"><el-input v-model="editForm.email" /></el-form-item>
              <el-form-item label="주소"><el-input v-model="editForm.addr" /></el-form-item>
              <el-form-item label="기업명" required><el-input v-model="editForm.name"
                  :disabled="!isEditMode" /></el-form-item>
              <div class="edit-buttons">
                <el-button @click="cancelEdit">취소</el-button>
                <el-button type="primary" @click="saveEdit">저장</el-button>
              </div>
            </el-form>
          </el-card>

          <el-card class="info-card memo-info" shadow="never">
            <template #header><span class="card-title">고객 메모</span></template>
            <el-input v-model="customer.memo" type="textarea" :rows="12" placeholder="메모 내용이 없습니다."
              :readonly="!isEditMode" class="memo-textarea" />
            <div v-if="isEditMode" class="tip-text text-right mt-2">* '저장' 클릭 시 반영됩니다.</div>
          </el-card>
        </div> 

        <el-card class="info-card history-info mt-20" shadow="never">
          <template #header>
            <div class="history-header-wrapper">
              <div class="history-top-row">
                <span class="card-title" style="margin-right: 20px;">고객 대응 히스토리</span>
                <div class="category-filter-group">
                  <el-button
                    v-for="cat in historyCategories"
                    :key="cat.value"
                    :type="selectedHistoryFilters.includes(cat.value) ? 'primary' : ''"
                    :plain="!selectedHistoryFilters.includes(cat.value)"
                    size="small"
                    round
                    @click="toggleHistoryCategory(cat.value)"
                  >
                    {{ cat.label }}
                  </el-button>
                </div>
              </div>

              <div class="history-filter-group mt-2">
                <el-date-picker
                  v-model="historyFilterDate"
                  type="daterange"
                  range-separator="~"
                  start-placeholder="시작일"
                  end-placeholder="종료일"
                  size="small"
                  style="width: 230px;"
                  value-format="YYYY-MM-DD"
                />
                
                <el-select v-model="historyFilterStatus" placeholder="상태" size="small" style="width: 100px;">
                  <el-option label="상태 전체" value="ALL" />
                  <el-option label="진행 중" value="ING" />
                  <el-option label="완료" value="DONE" />
                </el-select>

                <el-input
                  v-model="historySearchKeyword"
                  placeholder="내용, 유형, 담당자 검색"
                  size="small"
                  style="width: 600px;"
                  clearable
                >
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
              </div>
            </div>
          </template>

          <el-scrollbar height="700px">
            <el-timeline v-if="filteredHistoryList.length > 0">
              <el-timeline-item
                v-for="(item, index) in filteredHistoryList"
                :key="index"
                :timestamp="formatDate(item.date)"
                placement="top"
                :color="getHistoryDotColor(item)"
              >
                <el-card 
                  class="history-item-card clickable-card" 
                  shadow="hover"
                  @click="handleHistoryClick(item)"
                >
                  <div class="history-header">
                    <span class="history-type">[{{ item.type }}]</span>
                    <span class="history-performer">{{ item.performer }}</span>
                  </div>
                  <div class="history-content" v-html="highlightKeyword(item.content)"></div>
                  <div class="history-status">
                    <el-tag size="small" :type="getHistoryStatusType(item)">
                      {{ getHistoryStatusText(item) }}
                    </el-tag>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            
            <el-empty v-else :description="getEmptyDescription" />
          </el-scrollbar>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="문의 / 피드백" name="main_cs">
        <el-tabs v-model="activeCsTab" class="sub-tabs">
          
          <el-tab-pane label="문의 내역" name="support">
            <el-table :data="customer.supportList" border stripe style="width: 100%">
              <el-table-column prop="customerSupportCode" label="문의 번호" width="140" align="center">
                <template #default="{ row }">
                  <span class="clickable-link" @click="goSupportDetail(row.id)">
                    {{ row.customerSupportCode }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="createDate" label="접수일자" width="120" align="center" :formatter="dateFormatter" />
              <el-table-column prop="categoryName" label="카테고리" width="120" align="center" />
              <el-table-column prop="title" label="제목" min-width="150" show-overflow-tooltip />
              <el-table-column prop="channelName" label="접수 채널" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :style="getChannelTagStyle(row.channelName)">
                    {{ row.channelName || '-' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="empName" label="담당자" width="100" align="center" />
              <el-table-column prop="status" label="진행 상태" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getSupportStatusTag(row.status)">{{ formatSupportStatus(row.status) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="피드백 내역" name="feedback">
            <el-table :data="customer.feedbackList" border stripe>
              <el-table-column prop="feedbackCode" label="피드백 번호" width="140" align="center">
                <template #default="{ row }">
                   <span class="clickable-link" @click="goFeedbackDetail(row.id)">
                    {{ row.feedbackCode }}
                   </span>
                </template>
              </el-table-column>
              <el-table-column prop="createDate" label="등록일" width="120" align="center" :formatter="dateFormatter" />
              <el-table-column prop="categoryName" label="카테고리" width="120" align="center" />
              <el-table-column prop="title" label="제목" min-width="150" />
              <el-table-column prop="empName" label="담당자" width="100" align="center" />
              <el-table-column prop="star" label="만족도" width="140" align="center">
                 <template #default="{row}">
                   <el-rate v-model="row.star" disabled show-score text-color="#ff9900" />
                 </template>
              </el-table-column>
              <el-table-column prop="action" label="조치 내용" min-width="150" />
            </el-table>
          </el-tab-pane>

        </el-tabs>
      </el-tab-pane>

      <el-tab-pane label="영업 / 서비스" name="main_biz">
        <el-tabs v-model="activeBizTab" class="sub-tabs">
          
          <el-tab-pane label="견적 내역" name="quote">
            <el-table :data="customer.quoteList" border stripe>
              <el-table-column prop="quoteCode" label="견적 번호" width="140" align="center">
                <template #default="{ row }">
                   <span class="clickable-link" @click="goQuoteDetail(row.quoteId)">
                     {{ row.quoteCode }}
                   </span>
                </template>
              </el-table-column>
              <el-table-column prop="quoteCounselingDate" label="상담 일자" width="120" align="center" :formatter="dateFormatter" />
              <el-table-column prop="quoteSummary" label="견적 요약" min-width="200" />
              <el-table-column prop="quoteCounselor" label="상담원" width="100" align="center" />
              <el-table-column prop="channelName" label="채널" width="100" align="center" />
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="계약 내역" name="contract">
            <el-table :data="customer.contractList" border stripe>
              <el-table-column prop="contractCode" label="계약 번호" width="140" align="center">
                <template #default="{ row }">
                   <span class="clickable-link" @click="goContractDetail(row.id)">
                     {{ row.contractCode }}
                   </span>
                </template>
              </el-table-column>
              <el-table-column prop="conName" label="계약명" min-width="180" />
              <el-table-column prop="startDate" label="계약 시작일" width="120" align="center" :formatter="dateFormatter" />
              <el-table-column prop="contractPeriod" label="기간(개월)" width="100" align="center" />
              <el-table-column prop="monthlyPayment" label="월 납입금" width="150" align="right">
                <template #default="{row}">
                  {{ formatMoneyMan(row.monthlyPayment) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="계약 상태" width="100" align="center">
                <template #default="{row}">
                  <el-tag :type="getContractStatusTag(row.status)">{{ formatContractStatus(row.status) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="캠페인 내역" name="campaign">
            <h4>쿠폰 사용 이력</h4>
            <el-table :data="customer.couponList" border stripe class="mb-20">
              <el-table-column prop="couponCode" label="쿠폰 코드" width="140" align="center">
                <template #default="{ row }">
                   <span class="clickable-link" @click="goCouponList(row.couponCode)">
                     {{ row.couponCode }}
                   </span>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="쿠폰명" />
              <el-table-column prop="rate" label="할인율" width="100" align="center">
                <template #default="{row}">{{ row.rate }}%</template>
              </el-table-column>
              <el-table-column prop="status" label="사용 여부" width="100" align="center">
                 <template #default="{row}">
                    <el-tag :type="row.status === 'Y' ? 'info' : 'success'">
                      {{ row.status === 'Y' ? '사용 완료' : '사용 완료' }}
                    </el-tag>
                 </template>
              </el-table-column>
            </el-table>

            <h4>프로모션 참여 이력</h4>
            <el-table :data="customer.promotionList" border stripe>
              <el-table-column prop="promotionCode" label="프로모션 코드" width="140" align="center">
                <template #default="{ row }">
                   <span class="clickable-link" @click="goPromotionList(row.promotionCode)">
                     {{ row.promotionCode }}
                   </span>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="프로모션명" />
              <el-table-column prop="status" label="상태" width="100" align="center">
                 <template #default="{row}">
                   <el-tag>{{ row.status === 'A' ? '진행중' : '종료' }}</el-tag>
                 </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="AS / 정기점검" name="as">
            <el-table :data="customer.asList" border stripe>
              <el-table-column prop="after_service_code" label="관리 번호" width="140" align="center">
                <template #default="{ row }">
                   <span class="clickable-link" @click="goAsList">
                     {{ row.after_service_code }}
                   </span>
                </template>
              </el-table-column>
              <el-table-column prop="dueDate" label="예정일" width="120" align="center" :formatter="dateFormatter" />
              <el-table-column prop="type" label="유형" width="100" align="center">
                 <template #default="{row}">
                   <el-tag :type="row.type === 'R' ? 'success' : 'warning'" effect="plain">
                      {{ row.type === 'R' ? '정기 점검' : 'AS' }}
                   </el-tag>
                 </template>
              </el-table-column>
              <el-table-column prop="contents" label="내용" min-width="200" show-overflow-tooltip />
              <el-table-column prop="engineer" label="기사님" width="100" align="center" />
              <el-table-column prop="status" label="처리 상태" width="100" align="center">
                <template #default="{row}">
                   <el-tag :type="getAsStatusTag(row.status)">{{ formatAsStatus(row.status) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>

      <el-tab-pane label="세그먼트 변경 이력" name="main_segment">
        <el-timeline style="padding: 20px;">
          <el-timeline-item v-for="(item, index) in customer.segmentHistoryList" :key="index"
            :timestamp="formatDate(item.historyChangedAt)" placement="top"
            :color="getSegmentHexColor(item.currentSegmentName)">
            <el-card shadow="hover">
              <div class="history-item">
                <strong>
                  {{ item.previousSegmentName || '가입' }}
                  <el-icon style="vertical-align: middle;">
                    <Right />
                  </el-icon>
                  <span :style="{ color: getSegmentHexColor(item.currentSegmentName) }">
                    {{ item.currentSegmentName }}
                  </span>
                </strong>
                <p class="history-reason">
                  사유: {{ item.historyReason }}
                </p>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCustomerDetail, updateCustomer, deleteCustomer, restoreCustomer } from '@/api/customerlist';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Edit, Delete, RefreshLeft, Right, Search } from '@element-plus/icons-vue';
import { useAuthStore } from '@/store/auth.store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const customerId = route.params.id;

const loading = ref(false);
const activeTab = ref(route.query.tab || 'general');

const isEditMode = ref(false);
const customer = ref({
  historyList: [], segmentHistoryList: [], supportList: [], quoteList: [],
  contractList: [], asList: [], feedbackList: [], couponList: [], promotionList: []
});
const editForm = ref({});

// 히스토리 필터 상태
const historyFilterDate = ref(null);
const historyFilterStatus = ref('ALL');
const historySearchKeyword = ref('');

// 히스토리 카테고리 정의
const historyCategories = [
  { label: '전체', value: 'ALL' },
  { label: '문의', value: 'SUPPORT' },
  { label: '피드백', value: 'FEEDBACK' },
  { label: '견적', value: 'QUOTE' },
  { label: '계약', value: 'CONTRACT' },
  { label: '캠페인', value: 'CAMPAIGN' },
  { label: 'AS', value: 'AS' },
];

// 선택된 히스토리 필터 (초기값: 전체)
const selectedHistoryFilters = ref(['ALL']);

const canUpdateCustomer = computed(() =>
  authStore.hasAuth('CUSTOMER_WRITE')
)

const canDeleteCustomer = computed(() =>
  authStore.hasAuth('CUSTOMER_DELETE')
)

// URL 변경 감지
watch(() => route.query.tab, (newTab) => {
  activeTab.value = newTab || 'general';
});

const updateUrlTab = (val) => {
  activeTab.value = val;
  router.replace({ query: { ...route.query, tab: val } });
};

// 탭 그룹핑 Computed
const activeMainTab = computed({
  get: () => {
    const t = activeTab.value;
    if (['support', 'feedback'].includes(t)) return 'main_cs';
    if (['quote', 'contract', 'campaign', 'as'].includes(t)) return 'main_biz';
    if (t === 'history') return 'main_segment';
    return 'main_general';
  },
  set: (val) => {
    if (val === 'main_general') updateUrlTab('general');
    else if (val === 'main_cs') updateUrlTab('support');
    else if (val === 'main_biz') updateUrlTab('quote');
    else if (val === 'main_segment') updateUrlTab('history');
  }
});
const activeCsTab = computed({
  get: () => ['support', 'feedback'].includes(activeTab.value) ? activeTab.value : 'support',
  set: (val) => updateUrlTab(val)
});
const activeBizTab = computed({
  get: () => ['quote', 'contract', 'campaign', 'as'].includes(activeTab.value) ? activeTab.value : 'quote',
  set: (val) => updateUrlTab(val)
});

// 페이지 이동 핸들러
const goContractDetail = (id) => { router.push(`/contracts/${id}`); };
const goSupportDetail = (id) => { router.push(`/cs/supports/${id}`); };
const goFeedbackDetail = (id) => { router.push(`/cs/feedbacks/${id}`); };
const goQuoteDetail = (id) => { router.push(`/quote/${id}`); };

const goCouponList = (code) => {
    router.push({ 
        path: '/campaign/coupons', 
        query: { keyword: code } 
    });
};

const goPromotionList = (code) => {
    router.push({ 
        path: '/campaign/promotions', 
        query: { keyword: code } 
    });
};

const goAsList = () => {
    const companyName = customer.value.name;
    router.push({ 
        path: '/as', 
        query: { keyword: companyName } 
    });
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getCustomerDetail(customerId);
    customer.value = res.data;

    // if (customer.value.contractList && customer.value.contractList.length > 0) {
    //   const contractHistory = customer.value.contractList.map(c => ({
    //     date: c.startDate ? c.startDate + ' 00:00:00' : null, 
    //     type: '계약',
    //     performer: c.empName || customer.value.inCharge || '-',
    //     content: `계약 체결: ${c.conName} (월 ${formatMoneyMan(c.monthlyPayment)})`,
    //     status: c.status 
    //   })).filter(item => item.date);

    //   if (!customer.value.historyList) {
    //     customer.value.historyList = [];
    //   }
    //   customer.value.historyList.push(...contractHistory);
    //   customer.value.historyList.sort((a, b) => new Date(b.date) - new Date(a.date));
    // }

    if (!customer.value.historyList) {
      customer.value.historyList = [];
    }
  } catch (error) {
    ElMessage.error('데이터 로드 실패');
  } finally {
    loading.value = false;
  }
};

const handleHistoryClick = (item) => {
  const type = item.type || '';
  if (!type) return;

  let targetTab = 'general';

  if (type === '계약') targetTab = 'contract';
  else if (type.includes('문의')) targetTab = 'support';
  else if (type.includes('AS') || type.includes('점검')) targetTab = 'as';
  else if (type.includes('피드백')) targetTab = 'feedback';
  else if (type.includes('견적')) targetTab = 'quote';
  else if (type.includes('세그먼트')) targetTab = 'history';
  else if (type.includes('쿠폰') || type.includes('프로모션')) targetTab = 'campaign';
  
  if (activeTab.value !== targetTab) {
      router.push({ query: { ...route.query, tab: targetTab } });
      ElMessage.info(`'${type}' 상세 정보 탭으로 이동했습니다.`);
  }
};

const getHistoryStatusText = (item) => {
  const type = item.type || '';
  const status = item.status || '';

  if (type === '계약') return formatContractStatus(status);
  if (type.includes('견적') || type.includes('피드백') || type.includes('세그먼트') || type.includes('쿠폰') || type.includes('프로모션')) { return '완료'; }
  if (type.includes('문의')) return status === 'C' ? '완료' : '진행 중';
  if (type.includes('AS') || type.includes('점검')) return status === 'C' ? '완료' : '진행 중';

  return (status === '완료' || status === 'C') ? '완료' : '진행 중';
};

const getHistoryStatusType = (item) => {
  const text = getHistoryStatusText(item);
  if (text === '완료' || text === '처리 완료') return 'success';
  if (text === '해지') return 'info';
  if (text === '반려') return 'danger';
  return 'warning'; 
};

const getHistoryDotColor = (item) => {
  return getHistoryStatusType(item) === 'success' ? '#0bbd87' : '#ff9900';
};

// 카테고리 토글 함수
const toggleHistoryCategory = (val) => {
  if (val === 'ALL') {
    // '전체' 클릭 시: 토글 로직 (이미 전체면 해제, 아니면 전체만 선택)
    if (selectedHistoryFilters.value.includes('ALL')) {
      selectedHistoryFilters.value = [];
    } else {
      selectedHistoryFilters.value = ['ALL'];
    }
  } else {
    // 개별 카테고리 클릭 시
    // 만약 '전체'가 선택되어 있었다면, '전체'를 풀고 현재 클릭한 것만 선택
    if (selectedHistoryFilters.value.includes('ALL')) {
      selectedHistoryFilters.value = [val];
    } else {
      // 다중 선택 로직 (이미 있으면 제거, 없으면 추가)
      const idx = selectedHistoryFilters.value.indexOf(val);
      if (idx > -1) {
        selectedHistoryFilters.value.splice(idx, 1);
      } else {
        selectedHistoryFilters.value.push(val);
      }
    }
  }
};

// 필터링된 히스토리 리스트
const filteredHistoryList = computed(() => {
  // 1. 카테고리 선택이 아예 없으면 -> 빈 배열 반환 (초기 상태)
  if (selectedHistoryFilters.value.length === 0) {
    return [];
  }

  // [중요] 원본 배열이 변경되지 않도록 복사본(...)을 사용합니다.
  let list = [...(customer.value.historyList || [])];

  // 2. 카테고리 필터 ('ALL'이 아닐 때만 필터링 수행)
  if (!selectedHistoryFilters.value.includes('ALL')) {
    list = list.filter(item => {
      const type = item.type || '';
      return selectedHistoryFilters.value.some(filter => {
        if (filter === 'CONTRACT') return type === '계약';
        if (filter === 'QUOTE') return type.includes('견적');
        if (filter === 'SUPPORT') return type.includes('문의');
        if (filter === 'FEEDBACK') return type.includes('피드백');
        if (filter === 'CAMPAIGN') return type.includes('쿠폰') || type.includes('프로모션');
        if (filter === 'AS') return type.includes('AS') || type.includes('점검');
        return false;
      });
    });
  }

  // 3. 기존 상세 필터 (날짜)
  if (historyFilterDate.value && historyFilterDate.value.length === 2) {
    const startDate = new Date(historyFilterDate.value[0]);
    const endDate = new Date(historyFilterDate.value[1]);
    endDate.setHours(23, 59, 59, 999);
    list = list.filter(item => {
      if (!item.date) return false;
      const targetDate = new Date(item.date);
      return targetDate >= startDate && targetDate <= endDate;
    });
  }

  // 4. 기존 상세 필터 (상태)
  if (historyFilterStatus.value !== 'ALL') {
    list = list.filter(item => {
      const statusText = getHistoryStatusText(item);
      const isDone = statusText === '완료' || statusText === '처리 완료';
      if (historyFilterStatus.value === 'DONE') return isDone;
      if (historyFilterStatus.value === 'ING') return !isDone; 
      return true;
    });
  }

  // 5. 기존 상세 필터 (검색어)
  if (historySearchKeyword.value) {
    const keyword = historySearchKeyword.value.toLowerCase();
    list = list.filter(item => {
      const content = item.content ? item.content.toLowerCase() : '';
      const type = item.type ? item.type.toLowerCase() : '';
      const performer = item.performer ? item.performer.toLowerCase() : '';
      return content.includes(keyword) || type.includes(keyword) || performer.includes(keyword);
    });
  }

  // 마지막에 날짜순 정렬 로직 추가
  // 필터링된 결과(list)를 날짜(date) 기준으로 내림차순(최신순) 정렬합니다.
  return list.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA; // 큰 날짜(최신)가 앞으로 오도록 함
  });
});

const highlightKeyword = (text) => {
  if (!historySearchKeyword.value || !text) return text;
  const regex = new RegExp(`(${historySearchKeyword.value})`, 'gi');
  return text.replace(regex, '<span style="background-color: yellow; font-weight: bold;">$1</span>');
};

// 안내 메시지
const getEmptyDescription = computed(() => {
  if (selectedHistoryFilters.value.length === 0) return '보고 싶은 히스토리 항목을 선택해주세요.';
  if (!customer.value.historyList || customer.value.historyList.length === 0) return '히스토리가 없습니다.';
  return '검색 결과가 없습니다.';
});

// 수정 모드 활성화 함수
const enableEditMode = () => {
  // 1. 탭을 먼저 '종합 정보'로 변경
  activeMainTab.value = 'main_general';
  
  // 2. 폼 데이터 복사 및 수정 모드 켜기
  editForm.value = { ...customer.value };
  isEditMode.value = true;
};

const cancelEdit = () => { isEditMode.value = false; editForm.value = {}; };
const saveEdit = async () => {
  try {
    editForm.value.memo = customer.value.memo;
    await updateCustomer(customerId, editForm.value);
    ElMessage.success('저장되었습니다.');
    isEditMode.value = false;
    fetchData();
  } catch (e) { ElMessage.error('저장 실패: ' + e.message); }
};
const handleDelete = () => { ElMessageBox.confirm('정말 삭제(비활성화) 하시겠습니까?', '경고', { type: 'warning' }).then(async () => { try { await deleteCustomer(customerId); ElMessage.success('비활성화 되었습니다.'); fetchData(); } catch (e) { ElMessage.error('삭제 실패'); } }); };
const handleRestore = () => { ElMessageBox.confirm('고객을 다시 활성화 하시겠습니까?', '복구 확인', { type: 'success' }).then(async () => { try { await restoreCustomer(customerId); ElMessage.success('고객이 복구되었습니다.'); fetchData(); } catch (e) { ElMessage.error('복구 실패'); } }); };

// 브라우저 히스토리를 이용해 뒤로가기 (이전 URL의 파라미터 보존)
const goList = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    // 히스토리가 없는 경우(다이렉트 접속 등) 대비
    router.push('/customers');
  }
};

// 유틸 함수들
const formatContractStatus = (status) => {
  const map = { P: '진행 중', C: '완료', W: '승인 대기', R: '반려', T: '해지', I: '만료 임박' };
  return map[status] || status;
};
const getContractStatusTag = (status) => {
  const map = { P: 'primary', C: 'success', W: 'warning', R: 'danger', T: 'info', I: 'danger' };
  return map[status] || 'info';
};
const formatSupportStatus = (status) => {
  const map = { P: '처리 중', C: '완료', W: '대기' };
  return map[status] || status;
};
const getSupportStatusTag = (status) => {
  const map = { P: 'primary', C: 'success', W: 'warning' };
  return map[status] || 'info';
};
const formatAsStatus = (status) => {
  const map = { P: '방문 예정', C: '처리 완료', R: '접수됨' };
  return map[status] || status;
};
const getAsStatusTag = (status) => {
  const map = { P: 'warning', C: 'success', R: 'info' };
  return map[status] || 'info';
};
const getChannelTagStyle = (name) => {
  const styles = {
    '전화': { color: '#409EFF', backgroundColor: '#ecf5ff', borderColor: '#d9ecff' },
    '이메일': { color: '#67C23A', backgroundColor: '#f0f9eb', borderColor: '#e1f3d8' },
    '웹': { color: '#E6A23C', backgroundColor: '#fdf6ec', borderColor: '#faecd8' },
    '웹(채팅, 게시판)': { color: '#E6A23C', backgroundColor: '#fdf6ec', borderColor: '#faecd8' },
    'SNS': { color: '#F56C6C', backgroundColor: '#fef0f0', borderColor: '#fde2e2' },
    '방문': { color: '#909399', backgroundColor: '#f4f4f5', borderColor: '#e9e9eb' }
  };
  return styles[name] || styles['방문'];
};
const getSegmentHexColor = (s) => {
  if (!s) return '#409EFF';
  if (s.includes('VIP')) return '#E6A23C';
  if (s.includes('이탈')) return '#F56C6C';
  if (s.includes('블랙')) return '#909399';
  if (s.includes('신규')) return '#67C23A';
  if (s.includes('확장')) return '#409EFF';
  if (s.includes('잠재')) return '#909399';
  if (s.includes('일반')) return '#409EFF';
  return '#409EFF';
};
const formatDate = (d) => d ? d.substring(0, 10) : '';
const dateFormatter = (row, col, val) => formatDate(val);
const formatPhone = (v) => v ? v.replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3") : '-';

const formatMoneyMan = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return '-'
  const EOK = 100_000_000   
  const MAN = 10_000        
  const eok = Math.floor(n / EOK)
  const rest = n % EOK
  const man = Math.floor(rest / MAN)
  if (eok > 0 && man > 0) return `${eok}억 ${man}만원`
  if (eok > 0 && man === 0) return `${eok}억`
  return `${man}만원`
}

// 탭 변경 감지 및 차단 함수
const handleTabLeave = (activeName, oldActiveName) => {
  // 수정 모드일 때 로직
  if (isEditMode.value) {
    // 목표 탭이 '종합 정보(main_general)'인 경우는 허용 
    // (정보 수정 버튼 클릭 시 프로그램적으로 이동하는 것을 허용하기 위함)
    if (activeName === 'main_general') {
      return true;
    }
    // 그 외 다른 탭으로 이동하려고 하면 차단
    ElMessage.warning('정보 수정 중에는 다른 탭으로 이동할 수 없습니다. 저장 또는 취소해주세요.');
    return false; 
  }
  return true;
};

// 세그먼트 옵션 정의 (ID와 이름 매핑)
const segmentOptions = [
  { value: 1, label: '잠재 고객' },
  { value: 2, label: '신규 고객' },
  { value: 3, label: '일반 고객' },
  { value: 4, label: '이탈 위험 고객' },
  { value: 5, label: 'VIP 고객' },
  { value: 6, label: '블랙리스트 고객' },
  { value: 7, label: '확장 의사 고객' },
];

onMounted(fetchData);
</script>

<style scoped>
.page-container { padding: 20px; max-width: 1600px; margin: 0 auto; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 10px; }
.company-name { margin: 0; font-size: 24px; font-weight: 700; color: #333; }
.ml-2 { margin-left: 10px; }
.segment-tag { margin-left: 10px; }

/* 클릭 가능한 ID 스타일 */
.clickable-link {
  color: #409eff;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 500;
}
.clickable-link:hover {
  color: #66b1ff;
  font-weight: 700;
}

/* 2단 그리드 레이아웃 */
.info-grid.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  /* 1:1 비율 */
  gap: 20px;
  align-items: stretch;
}

.info-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-weight: 700;
  font-size: 16px;
}

/* 히스토리 카드 헤더 스타일 개선 */
.history-header-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.history-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}
.category-filter-group {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.history-filter-group {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end; /* 필터를 우측으로 정렬 */
  flex-wrap: wrap;
}

.mt-20 { margin-top: 20px; }
.mt-2 { margin-top: 8px; }

/* 텍스트 영역 스타일 */
.memo-textarea :deep(.el-textarea__inner) {
    resize: none; border: none; background-color: #f9f9f9; font-size: 14px; line-height: 1.6; padding: 15px;
}

.tip-text {
  font-size: 12px;
  color: #999;
}

.text-right {
  text-align: right;
}

.mb-20 {
  margin-bottom: 20px;
}

/* 히스토리 아이템 스타일 */
.history-item-card { margin-bottom: 5px; transition: all 0.2s; } 
.clickable-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; }

.history-header { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; color: #666; }
.history-type { font-weight: bold; color: #409eff; }
.history-content { font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #333; word-break: break-all; }
.history-status { text-align: right; }
.history-item p { margin: 5px 0 0; }
.history-reason { font-size: 13px; color: #666; }

.edit-buttons { display: flex; justify-content: flex-end; margin-top: 20px; gap: 10px; }

/* 중첩 탭 스타일 */
.sub-tabs :deep(.el-tabs__content) {
  padding: 20px 0 0 0;
}
</style>