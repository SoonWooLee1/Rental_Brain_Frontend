<template>
  <div class="page-container">
    <div class="header">
      <div>
        <h2>프로모션</h2>
        <p>자동 · 일반 프로모션 통합 관리</p>
      </div>
            <!-- 권한 없을 때 -->
      <el-tooltip
        v-if="!canCreatePromotion"
        content="프로모션 등록 권한이 없습니다"
        placement="top"
      >
        <span style="margin-left:auto">
          <el-button type="primary" disabled>
            + 프로모션 등록
          </el-button>
        </span>
      </el-tooltip>

      <!-- 권한 있을 때 -->
      <el-button
        v-else
        style="display: flex; margin-left: auto;"
        type="primary"
        @click="openCreateModal"
      >
        + 프로모션 등록
      </el-button>
    </div>

      <div class="promotion-page">
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="프로모션 이름, ID로 검색..."
        class="search-input"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-select
        v-model="selectedType"
        placeholder="전체 유형"
        class="filter-select"
        @change="handleTypeFilter"
      >
        <el-option label="전체 유형" value="ALL" />
        <el-option label="자동" value="A" />
        <el-option label="일반" value="M" />
      </el-select>

      <el-select
        v-model="selectedStatus"
        placeholder="전체 상태"
        class="filter-select"
        @change="handleStatusFilter"
      >
        <el-option label="전체 상태" value="ALL" />
        <el-option label="진행 중" value="A" />
        <el-option label="일시 정지" value="H" />
        <el-option label="시작 전" value="P" />
        <el-option label="기간 만료" value="C" />
      </el-select>

    <el-button type="primary" @click="handleSearch">검색</el-button>
    </div>

    <el-card shadow="never" :body-style="{ padding: '0' }">
    <el-table
      :data="promotionList"
      v-loading="loading"
      style="width: 100%"
    >
      <el-table-column prop="promotionCode" label="프로모션 ID" width="140" />

      <el-table-column label="이름" min-width="180">
        <template #default="{ row }">
          <div class="promo-name-cell">
            <div class="title">{{ row.name }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="유형" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getTypeTagType(row.type)" effect="plain">
            {{ getTypeLabel(row.type) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="상태" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)" effect="light">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="발동조건" min-width="160">
        <template #default="{ row }">
          {{ row.triggerVal || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="대상" min-width="140">
        <template #default="{ row }">
          {{ row.segmentName }}
        </template>
      </el-table-column>

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
        @current-change="fetchPromotionList"
    />
  </div>
  </el-card>
  </div>

    <PromotionDetailModal
      v-model:visible="detailModalVisible"
      :promotion-code="selectedPromotionCode"
      @updated="fetchPromotionList"
      @deleted="fetchPromotionList"
    />

    <PromotionCreateModal
      v-model:visible="createModalVisible"
      :recommend-id="recommendId"
      @created="fetchPromotionList"
      @close="handleModalClose"
    />
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, watch, computed, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import api from '@/api/axios';
import PromotionCreateModal from './PromotionCreateModal.vue';
import PromotionDetailModal from './PromotionDetailModal.vue';
import { useAuthStore } from '@/store/auth.store';



const promotionList = ref([]);
const loading = ref(false);

const searchKeyword = ref('');
const selectedStatus = ref('ALL');
const selectedType = ref('ALL');

const createModalVisible = ref(false);
const detailModalVisible = ref(false);
const selectedPromotionCode = ref(null);

const route = useRoute();
const router = useRouter()

const recommendId = ref(null)
const authStore = useAuthStore();

const canCreatePromotion = computed(() =>
  authStore.hasAuth('CAMPAIGN_MANAGE')
)


// 상태 / 유형 라벨 매핑
const getStatusLabel = (status) => {
  if (status === 'A') return '진행 중';
  if (status === 'H') return '일시 정지';
  if (status === 'P') return '시작 전';
  if (status === 'C') return '기간 만료';
  return '알수없음';
};

const getStatusTagType = (status) => {
  if (status === 'A') return 'success';
  if (status === 'P') return 'warning';
  if (status === 'H') return 'info';
  if (status === 'C') return 'primary';
  return 'default';
};

const getTypeLabel = (type) => {
  if (type === 'A') return '자동';
  if (type === 'M') return '일반';
  return '기타';
};

const getTypeTagType = (type) => {
  if (type === 'A') return 'danger';
  if (type === 'M') return 'info';
  return '기타';
};

const totalCount = ref(0);
const page = ref(1);
const pageSize = ref(10);

// 목록 조회 API
const fetchPromotionList = async () => {
  loading.value = true;
  try {
    const res = await api.get('/promotion/read-list', {
    params: {
        page: page.value,
        size: pageSize.value,
      }
      });
    promotionList.value = res.data.contents || [];
    totalCount.value = res.data.totalCount;
  } catch (e) {
    ElMessage.error('프로모션 목록을 불러오지 못했습니다.');
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// 상태 필터링 API
const handleStatusFilter = async () => {
  if (selectedStatus.value === 'ALL') {
    await fetchPromotionList();
    return;
  }
  loading.value = true;
  try {
    const res = await api.get(
      `/promotion/filter-status/${selectedStatus.value}`, {
    params: {
        page: page.value,
        size: pageSize.value,
      }
      });
    promotionList.value = res.data.contents || [];
    totalCount.value = res.data.totalCount;
  } catch (e) {
    ElMessage.error('상태 필터 적용 중 오류가 발생했습니다.');
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// 유형 필터링 API
const handleTypeFilter = async () => {
  if (selectedType.value === 'ALL') {
    await fetchPromotionList();
    return;
  }
  loading.value = true;
  try {
    const res = await api.get(`/promotion/filter-type/${selectedType.value}`, {
    params: {
        page: page.value,
        size: pageSize.value,
      }
      });
    promotionList.value = res.data.contents || [];
    totalCount.value = res.data.totalCount;
  } catch (e) {
    ElMessage.error('유형 필터 적용 중 오류가 발생했습니다.');
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// 검색 API
const handleSearch = async () => {
  const keyword = searchKeyword.value?.trim();
  if (!keyword) {
    await fetchPromotionList();
    return;
  }
  loading.value = true;
  try {
    const res = await api.get(`/promotion/search/${encodeURIComponent(keyword)}`, {
    params: {
        page: page.value,
        size: pageSize.value,
      }
      });
    promotionList.value = res.data.contents || [];
    totalCount.value = res.data.totalCount;
  } catch (e) {
    ElMessage.error('검색 중 오류가 발생했습니다.');
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const openDetailModal = (row) => {
  selectedPromotionCode.value = row.promotionCode;
  detailModalVisible.value = true;
};

const openCreateModal = () => {
  createModalVisible.value = true;
};

const handleModalClose = () => {
  createModalVisible.value = false
  recommendId.value = null
  
  router.replace({ 
    query: {} 
  })
}

onMounted(async () => {
  // [추가 3] 파라미터 자동 검색 로직
  if (route.query.keyword) {
    searchKeyword.value = route.query.keyword;
    page.value = 1;
  }

  await nextTick();

  fetchPromotionList();
});

watch(() => route.query.recommendId, async (newVal) => {
  if (newVal) {
    recommendId.value = Number(newVal)
    createModalVisible.value = true  // 모달 자동 열기
  } else {
    recommendId.value = null
    createModalVisible.value = false
  }
}, { immediate: true })  // mounted 시점에도 실행
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


.search-input {
  width: 500px;
}

.filter-select {
  width: 140px;
}

.promo-name-cell .title {
  font-weight: 500;
}

.promo-name-cell .subtitle {
  font-size: 12px;
  color: #999;
}
.toolbar { 
    display: flex; align-items: center; 
    margin-bottom: 20px; padding: 20px; background: #fff; border-radius: 8px; border: 1px solid #eee;
    gap: 10px; align-items: center; flex-wrap: wrap;
}
.pagination-area {
    display: flex; justify-content: center; margin-top: 10px; margin-bottom: 10px;
}
</style>