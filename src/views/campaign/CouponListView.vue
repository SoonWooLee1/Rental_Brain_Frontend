<template>
  <div class="page-container">
  <div class="header">
    <div>
      <h2>쿠폰</h2>
      <p>금액 · 비율할인 쿠폰 통합 관리</p>
    </div>

    <!-- 쿠폰 등록 버튼 -->
      <el-tooltip v-if="!canCreateCoupon" content="쿠폰 등록 권한이 없습니다" placement="top">
        <span style="margin-left: auto;">
          <el-button type="primary" disabled>
            + 쿠폰 등록
          </el-button>
        </span>
      </el-tooltip>

      <el-button v-else style="display: flex; margin-left: auto;" type="primary" @click="openCreateModal">
        + 쿠폰 등록
      </el-button>
  </div>

  <div class="coupon-page">
    <!-- 상단 검색 / 필터 / 추가 버튼 -->
    <div class="toolbar">
      <el-input v-model="searchKeyword" placeholder="쿠폰명, 쿠폰ID로 검색..." class="search-input" clearable
        @keyup.enter="handleSearch">
        <template #prefix>
          <el-icon>
            <Search />
          </el-icon>
        </template>
      </el-input>

      <el-select v-model="selectedType" placeholder="전체 유형" class="filter-select" @change="handleTypeFilter">
        <el-option label="전체 유형" value="ALL" />
        <el-option label="비율 할인" value="R" />
        <el-option label="금액 할인" value="A" />
      </el-select>

      <el-select v-model="selectedStatus" placeholder="전체 상태" class="filter-select" @change="handleStatusFilter">
        <el-option label="전체 상태" value="ALL" />
        <el-option label="사용 가능" value="A" />
        <el-option label="기간 만료" value="C" />
        <el-option label="시작 전" value="P" />
      </el-select>

      <el-button type="primary" @click="handleSearch">검색</el-button>
    </div>

    <!-- 쿠폰 목록 테이블 -->
    <el-card shadow="never" :body-style="{ padding: '0' }">
      <el-table :data="couponList" v-loading="loading" style="width: 100%" class="coupon-table">
        <!-- 쿠폰 번호 -->
        <el-table-column label="쿠폰 ID" width="140">
          <template #default="{ row }">
            <div class="code-cell">
              <div class="main">{{ row.couponCode }}</div>
              <div class="sub">{{ row.contentCode || row.couponCodeShort }}</div>
            </div>
          </template>
        </el-table-column>

        <!-- 쿠폰명 -->
        <el-table-column label="쿠폰명" min-width="180">
          <template #default="{ row }">
            <div class="name-cell">
              <div class="title">{{ row.name }}</div>
            </div>
          </template>
        </el-table-column>

        <!-- 할인 -->
        <el-table-column label="할인" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="warning" effect="light">
              {{ getRateLabel(row.rate, row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 유형 -->
        <el-table-column label="유형" width="90" align="center">
          <template #default="{ row }">
            <el-tag type="primary" effect="light">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 최소 렌탈료 -->
        <el-table-column label="최소 렌탈료" width="120" align="right">
          <template #default="{ row }">
            {{ formatToManWon(row.minFee) }}
          </template>
        </el-table-column>

        <!-- 대상 세그먼트 -->
        <el-table-column label="대상 세그먼트" min-width="150">
          <template #default="{ row }">
            <span>{{ row.segmentName }}</span>
          </template>
        </el-table-column>

        <!-- 상태 -->
        <el-table-column label="상태" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" effect="light">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 유효기간 -->
        <el-table-column label="유효기간" width="120">
          <template #default="{ row }">
            <span v-if="row.endDate">
              {{ formatDate(row.endDate) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>

      <!-- 액션 -->
      <el-table-column label="액션" width="120" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="openDetailModal(row)">
            상세보기
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 페이지네이션 -->
  <div class="pagination-area">
    <el-pagination 
        layout="prev, pager, next" 
        :total="totalCount" 
        v-model:current-page="page"
        :page-size="pageSize"
        @current-change="fetchCouponList"
    />
  </div>
  </el-card>
    <CouponCreateModal
      v-model:visible="createModalVisible"
      :recommend-id="recommendId"
      @created="fetchCouponList"
      @close="handleModalClose"
    />

    <CouponDetailModal
      v-model:visible="detailModalVisible"
      :coupon-code="selectedCouponCode"
      @updated="fetchCouponList"
      @deleted="fetchCouponList"
    />
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import api from '@/api/axios';
import CouponCreateModal from './CouponCreateModal.vue';
import CouponDetailModal from './CouponDetailModal.vue';
import { useAuthStore } from '@/store/auth.store';

const couponList = ref([]);
const loading = ref(false);

const searchKeyword = ref('');
const selectedStatus = ref('ALL');
const selectedType = ref('ALL');

const createModalVisible = ref(false);
const detailModalVisible = ref(false);
const selectedCouponCode = ref(null);

const totalCount = ref(0);
const page = ref(1);
const pageSize = ref(7);

const route = useRoute();
const router = useRouter();

const recommendId = ref(null);
const authStore = useAuthStore();

const canCreateCoupon = computed(() =>
  authStore.hasAuth('CAMPAIGN_MANAGE')
)

// 금액 포맷 (만원 단위)
const formatToManWon = (value) => {
  if (value == null) return '0';
  const num = Number(value);
  if (Number.isNaN(num)) return '0';
  const man = num / 10000;
  const fixed = Number(man.toFixed(1));
  if (fixed === 0) return '0';
  if (Number.isInteger(fixed)) return `${fixed}만원`;
  return `${fixed}만원`;
};

const getRateLabel = (rate, type) => {
  return type === 'R' ? rate + '%' : rate + '원'
};

const getTypeLabel = (type) => {
  if (type === 'R') return '비율 할인';
  if (type === 'A') return '금액 할인';
  return '기타';
};

const getStatusLabel = (status) => {
  if (status === 'A') return '사용 가능';
  if (status === 'P') return '시작 전';
  if (status === 'C') return '기간 만료';
  return '알수없음';
};

const getStatusTagType = (status) => {
  if (status === 'A') return 'success';
  if (status === 'C') return 'info';
  return 'default';
};

const formatDate = (iso) => {
  if (!iso) return '';
  return iso.slice(0, 10);
};

// 1. 기본 목록 조회
const fetchCouponList = async () => {
  loading.value = true;
  try {
    const res = await api.get('/coupon/read-list', {
      params: {
        page: page.value,
        size: pageSize.value,
      }
    });
    couponList.value = res.data.contents || [];
    totalCount.value = res.data.totalCount;
  } catch (e) {
    ElMessage.error('쿠폰 목록을 불러오지 못했습니다.');
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// 2. 상태 필터
const handleStatusFilter = async () => {
  if (selectedStatus.value === 'ALL') {
    await fetchCouponList();
    return;
  }
  loading.value = true;
  try {
    const res = await api.get(`/coupon/filter-status/${selectedStatus.value}`, {
      params: {
        page: page.value,
        size: pageSize.value,
      }
    });
    couponList.value = res.data.contents || [];
    totalCount.value = res.data.totalCount;
  } catch (e) {
    ElMessage.error('상태 필터 적용 중 오류가 발생했습니다.');
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// 3. 유형 필터
const handleTypeFilter = async () => {
  if (selectedType.value === 'ALL') {
    await fetchCouponList();
    return;
  }
  loading.value = true;
  try {
    console.log('쿠폰 유형:', selectedType.value);
    const res = await api.get(`/coupon/filter-type/${selectedType.value}`, {
      params: {
        page: page.value,
        size: pageSize.value,
      }
    });
    couponList.value = res.data.contents || [];
    totalCount.value = res.data.totalCount;
  } catch (e) {
    ElMessage.error('유형 필터 적용 중 오류가 발생했습니다.');
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// 4. 검색
const handleSearch = async () => {
  const keyword = searchKeyword.value?.trim();
  if (!keyword) {
    await fetchCouponList();
    return;
  }
  loading.value = true;
  try {
    const res = await api.get(`/coupon/search/${encodeURIComponent(keyword)}`, {
      params: {
        page: page.value,
        size: pageSize.value,
      }
    });
    couponList.value = res.data.contents || [];
    totalCount.value = res.data.totalCount;
  } catch (e) {
    ElMessage.error('검색 중 오류가 발생했습니다.');
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// 5. 상세 모달 열기
const openDetailModal = (row) => {
  selectedCouponCode.value = row.couponCode;
  detailModalVisible.value = true;
};

// 등록 모달
const openCreateModal = () => {
  createModalVisible.value = true;
};

const handleModalClose = () => {
  createModalVisible.value = false
  recommendId.value = null
  
  router.replace({ 
    query: {} 
  })
};


onMounted(async () => {
// [추가 3] URL 파라미터(keyword)가 있으면 검색창에 입력하고 검색 실행
  if (route.query.keyword) {
    searchKeyword.value = route.query.keyword;
    page.value = 1;
  }
  
  // [핵심 변경] 데이터가 화면(검색창)에 반영될 시간을 줌
  await nextTick();

  fetchCouponList();
});

watch(() => route.query.recommendId, async (newVal) => {
  if (newVal) {
    recommendId.value = Number(newVal)
    createModalVisible.value = true
  } else {
    recommendId.value = null
    createModalVisible.value = false
  }
}, { immediate: true })
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;

  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.header p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.coupon-table :deep(.el-table__row) {
  height: 52px;
  /* 기본 48px 정도 → 64px처럼 늘리기 */
}

.coupon-table :deep(.el-table__cell) {
  padding-top: 12px;
  /* 위아래 패딩도 같이 조절 */
  padding-bottom: 12px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input {
  width: 500px;
}

.filter-select {
  width: 140px;
}

.code-cell .main {
  font-weight: 600;
}

.code-cell .sub {
  font-size: 12px;
  color: #999;
}

.name-cell .title {
  font-weight: 500;
}

.name-cell .subtitle {
  font-size: 12px;
  color: #999;
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eee;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.pagination-area {
  display: flex;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 10px;
}
</style>