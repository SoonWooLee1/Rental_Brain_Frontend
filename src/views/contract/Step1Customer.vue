<script setup>
  import { ref, watch, onMounted } from 'vue'
  import api from '@/api/axios'
  import Pagination from '@/components/common/Pagination.vue'
  
  /* props / emits */
  const props = defineProps({
    draft: {
      type: Object,
      required: true
    }
  })
  
  const emit = defineEmits(['next', 'update'])
  
  /* 상태 */
  const customers = ref([])
  const totalCount = ref(0)
  
  const page = ref(1)
  const size = ref(10)
  
  const keyword = ref('')
  const loading = ref(false)
  
  const selectedCustomerId = ref(props.draft.customerId || null)
  
  /* =========================
     고객 조회 API
  ========================= */
  async function fetchCustomers() {
    loading.value = true
  
    const params = {}
  
    // 검색 모드
    if (keyword.value && keyword.value.trim() !== '') {
      params.keyword = keyword.value.trim()
      // pageNum / amount 보내지 않음
    }
    // 페이징 모드
    else {
      params.pageNum = page.value
      params.amount = size.value
    }
  
    try {
      const res = await api.get('/contract/customer', { params })
  
      customers.value = res.data?.contents ?? []
      totalCount.value = res.data?.totalCount ?? 0
    } catch (e) {
      console.error('고객 조회 실패', e)
      customers.value = []
      totalCount.value = 0
    } finally {
      loading.value = false
    }
  }
  
  /* =========================
     이벤트 핸들러
  ========================= */
  
  // 페이지 변경
  function onPageChange(p) {
    // 검색 중에는 페이지 이동 없음
    if (keyword.value && keyword.value.trim() !== '') return
  
    page.value = p
    fetchCustomers()
  }
  
  // 검색어 변경
  watch(keyword, () => {
    page.value = 1
    fetchCustomers()
  })
  
  // 고객 선택
  function selectCustomer(customer) {
    selectedCustomerId.value = customer.customerId
  
    emit('update', {
      customerId: customer.customerId,
      customerName: customer.customerName,
      customerCode: customer.customerCode,
      inCharge: customer.inCharge,
      segmentId: customer.segmentId,
      segmentName: customer.segmentName
    })
  }
  
  // 다음 단계
  function goNext() {
    if (!selectedCustomerId.value) {
      alert('고객을 선택해주세요.')
      return
    }
    emit('next')
  }
  
  /* 최초 로드 */
  onMounted(fetchCustomers)
  </script>
  
  <template>
    <div class="step1-customer">
      <h2 class="title">고객 선택</h2>
  
      <!-- 검색 -->
      <div class="search-box">
        <input
          v-model="keyword"
          type="text"
          placeholder="고객명 / 고객코드 / 담당자 검색"
        />
      </div>
  
      <!-- 로딩 -->
      <div v-if="loading" class="loading">
        고객 목록을 불러오는 중입니다...
      </div>
  
      <!-- 목록 -->
      <div v-else>
        <div v-if="customers.length === 0" class="empty">
          조회된 고객이 없습니다.
        </div>
  
        <div
          v-for="customer in customers"
          :key="customer.customerId"
          class="customer-card"
          :class="{ selected: selectedCustomerId === customer.customerId }"
          @click="selectCustomer(customer)"
        >
          <div class="name">{{ customer.customerName }}</div>
  
          <div class="meta">
            <span>{{ customer.customerCode }}</span>
            <span>담당자: {{ customer.inCharge }}</span>
          </div>
  
          <span class="segment">
            {{ customer.segmentName }}
          </span>
        </div>
      </div>
  
      <!-- 페이지네이션 (검색 중 숨김) -->
      <Pagination
        v-if="!keyword || keyword.trim() === ''"
        :page="page"
        :size="size"
        :totalCount="totalCount"
        @update:page="onPageChange"
      />
  
      <!-- 하단 버튼 -->
      <div class="actions">
        <button class="next-btn" @click="goNext">
          다음
        </button>
      </div>
    </div>
  </template>
  
<style scoped>
.step1-customer {padding: 24px;}

.title {font-size: 20px;font-weight: 600;margin-bottom: 16px;}
.search-box {margin-bottom: 16px;}
.search-box input {width: 100%; padding: 10px 14px;border: 1px solid #e0e4f0;border-radius: 999px;font-size: 14px;}
.loading, .empty {padding: 40px;text-align: center;color: #666;}
  
.customer-card {border: 1px solid #e5e7eb;border-radius: 8px;padding: 14px;margin-bottom: 10px;cursor: pointer;transition: all 0.2s;}
.customer-card:hover {background: #f9fafb;}
.customer-card.selected {border-color: #248efff2;background: #f0f6ff;}
.customer-card .name {font-weight: 600;margin-bottom: 4px;}
.customer-card .meta {font-size: 13px;color: #666;display: flex;gap: 12px;}
  
.segment {display: inline-block;margin-top: 6px;font-size: 12px;padding: 2px 10px;border-radius: 999px;background: #eef2ff;color: #3730a3;}
.actions {display: flex;justify-content: flex-end;margin-top: 24px;}
.next-btn {padding: 10px 20px;background: #248efff2;color: #fff;border: none;border-radius: 6px;cursor: pointer;}
</style>
  